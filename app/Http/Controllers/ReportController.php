<?php

namespace App\Http\Controllers;

use App\Models\Harvest;
use App\Models\InputUsage;
use App\Models\Field;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function index()
    {
        return Inertia::render('Reports/Index', [
            'fields' => Field::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function harvestLogs(Request $request)
    {
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $fieldId = $request->input('field_id');

        $query = Harvest::with(['planting.field', 'planting.crop.species', 'planting.crop.varietyEntity'])
            ->whereBetween('harvest_date', [$startDate, $endDate]);

        if ($fieldId) {
            $query->whereHas('planting', function ($q) use ($fieldId) {
                $q->where('field_id', $fieldId);
            });
        }

        $harvests = $query->orderBy('harvest_date')->get();

        return new StreamedResponse(function () use ($harvests) {
            $handle = fopen('php://output', 'w');

            // Add BOM for Excel UTF-8 compatibility
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            fputcsv($handle, ['Fecha', 'Sector', 'Especie', 'Variedad', 'Kilos', 'Calidad', 'Precio Unit.', 'Total']);

            foreach ($harvests as $harvest) {
                fputcsv($handle, [
                    $harvest->harvest_date,
                    $harvest->planting->field->name ?? 'N/A',
                    $harvest->planting->crop->species->name ?? $harvest->planting->crop->name ?? 'N/A',
                    $harvest->planting->crop->varietyEntity->name ?? $harvest->planting->crop->variety ?? 'N/A',
                    $harvest->quantity_kg,
                    $harvest->quality_grade ?? '-',
                    $harvest->price_per_kg ?? 0,
                    ($harvest->quantity_kg * ($harvest->price_per_kg ?? 0))
                ]);
            }

            fclose($handle);
        }, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="reporte_cosechas.csv"',
        ]);
    }

    public function harvestDaily(Request $request)
    {
        $startDate = $request->input('start_date', now()->startOfDay()->toDateString());
        $endDate = $request->input('end_date', now()->toDateString());
        $fieldId = $request->input('field_id');

        $rows = Harvest::query()
            ->selectRaw('harvests.harvest_date as harvest_date, fields.id as field_id, fields.name as field_name, SUM(harvests.quantity_kg) as total_kg, SUM(harvests.quantity_kg * COALESCE(harvests.price_per_kg, 0)) as total_value')
            ->join('plantings', 'plantings.id', '=', 'harvests.planting_id')
            ->join('fields', 'fields.id', '=', 'plantings.field_id')
            ->whereBetween('harvests.harvest_date', [$startDate, $endDate])
            ->when($fieldId, function ($query) use ($fieldId) {
                $query->where('fields.id', $fieldId);
            })
            ->groupBy('harvests.harvest_date', 'fields.id', 'fields.name')
            ->orderBy('harvests.harvest_date')
            ->orderBy('fields.name')
            ->get()
            ->map(function ($row) {
                $harvestDate = $row->harvest_date;
                if ($harvestDate instanceof \Carbon\Carbon) {
                    $harvestDate = $harvestDate->format('Y-m-d');
                }

                return [
                    'harvest_date' => $harvestDate,
                    'field_id' => $row->field_id,
                    'field_name' => $row->field_name,
                    'total_kg' => (float) $row->total_kg,
                    'total_value' => (float) $row->total_value,
                ];
            })
            ->values();

        return Inertia::render('Reports/HarvestDaily', [
            'rows' => $rows,
            'fields' => Field::orderBy('name')->get(['id', 'name']),
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'field_id' => $fieldId,
            ],
        ]);
    }

    public function applicationLogs(Request $request)
    {
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $fieldId = $request->input('field_id');

        // Mapping 'InputUsage' as Application Log
        // Ideally checking for 'fertilizer' or 'chemical' categories if we had them strictly defined,
        // but for now exporting all input usages.
        $query = InputUsage::with(['field', 'input.inputCategory'])
            ->whereBetween('usage_date', [$startDate, $endDate]);

        if ($fieldId) {
            $query->where('field_id', $fieldId);
        }

        $usages = $query->orderBy('usage_date')->get();

        return new StreamedResponse(function () use ($usages) {
            $handle = fopen('php://output', 'w');

            // BOM
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            fputcsv($handle, ['Fecha', 'Sector', 'Insumo', 'Categoría', 'Cantidad', 'Unidad', 'Costo Total', 'Responsable']);

            foreach ($usages as $usage) {
                fputcsv($handle, [
                    $usage->usage_date,
                    $usage->field->name ?? 'N/A',
                    $usage->input->name ?? 'N/A',
                    $usage->input->inputCategory->name ?? '-',
                    $usage->quantity_used,
                    $usage->input->unit ?? '-',
                    $usage->total_cost,
                    $usage->user->name ?? 'Sistema' // Assuming created_by or user relation exists, or we leave blank. InputUsage usually tracks user.
                ]);
            }

            fclose($handle);
        }, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="reporte_aplicaciones_agroquimicos.csv"',
        ]);
    }

    public function harvestCollectionsDaily(Request $request)
    {
        $date = $request->input('date', now()->toDateString());
        $fieldId = $request->input('field_id');
        $companyId = $request->user()->company_id;

        $rows = \App\Models\HarvestCollection::query()
            ->selectRaw('harvest_collections.date as collection_date, fields.id as field_id, fields.name as field_name, workers.name as worker_name, harvest_containers.id as container_id, harvest_containers.name as container_name, SUM(harvest_collections.quantity) as total_quantity, SUM(harvest_collections.quantity / NULLIF(harvest_containers.quantity_per_bin, 0)) as total_bins')
            ->join('fields', 'fields.id', '=', 'harvest_collections.field_id')
            ->join('harvest_containers', 'harvest_containers.id', '=', 'harvest_collections.harvest_container_id')
            ->join('workers', 'workers.id', '=', 'harvest_collections.worker_id')
            ->where('harvest_collections.company_id', $companyId)
            ->whereDate('harvest_collections.date', $date)
            ->when($fieldId, function ($query) use ($fieldId) {
                $query->where('fields.id', $fieldId);
            })
            ->groupBy('harvest_collections.date', 'fields.id', 'fields.name', 'harvest_containers.id', 'harvest_containers.name', 'workers.name')
            ->orderBy('harvest_collections.date')
            ->orderBy('fields.name')
            ->orderBy('harvest_containers.name')
            ->orderBy('workers.name');
        $rows = $rows->get()
            ->map(function ($row) {
                $date = $row->collection_date;
                if ($date instanceof \Carbon\Carbon) {
                    $date = $date->format('Y-m-d');
                }

                return [
                    'collection_date' => $date,
                    'field_id' => $row->field_id,
                    'field_name' => $row->field_name,
                    'worker_name' => $row->worker_name,
                    'container_id' => $row->container_id,
                    'container_name' => $row->container_name,
                    'total_quantity' => (float) $row->total_quantity,
                    'total_bins' => (float) $row->total_bins,
                ];
            })
            ->values();

        return Inertia::render('Reports/HarvestCollectionsDaily', [
            'rows' => $rows,
            'fields' => Field::orderBy('name')->get(['id', 'name']),
            'filters' => [
                'date' => $date,
                'field_id' => $fieldId,
            ],
        ]);
    }
}

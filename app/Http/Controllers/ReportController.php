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
}

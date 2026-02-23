<?php

namespace App\Http\Controllers;

use App\Models\Harvest;
use App\Models\InputUsage;
use App\Models\Field;
use App\Models\Attendance;
use App\Models\Contractor;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Illuminate\Support\Facades\Log;

class ReportController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $fieldIds = $user->fieldScopeIds();

        return Inertia::render('Reports/Index', [
            'fields' => Field::orderBy('name')
                ->when($fieldIds !== null, fn ($q) => $q->whereIn('id', $fieldIds))
                ->get(['id', 'name']),
        ]);
    }

    public function harvestLogs(Request $request)
    {
        $user = $request->user();
        $fieldIds = $user->fieldScopeIds();
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $fieldId = $request->input('field_id');
        if ($fieldIds !== null && $fieldId && !in_array((int) $fieldId, $fieldIds, true)) {
            $fieldId = null;
        }

        $query = Harvest::with(['planting.field', 'planting.crop.species', 'planting.crop.varietyEntity'])
            ->whereBetween('harvest_date', [$startDate, $endDate]);

        if ($fieldIds !== null) {
            $query->whereHas('planting', function ($q) use ($fieldIds) {
                $q->whereIn('field_id', $fieldIds);
            });
        }

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

            fputcsv($handle, ['Fecha', 'Campo', 'Especie', 'Variedad', 'Kilos', 'Calidad', 'Precio Unit.', 'Total']);

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
        $user = $request->user();
        $fieldIds = $user->fieldScopeIds();
        $startDate = $request->input('start_date', now()->startOfDay()->toDateString());
        $endDate = $request->input('end_date', now()->toDateString());
        $fieldId = $request->input('field_id');
        if ($fieldIds !== null && $fieldId && !in_array((int) $fieldId, $fieldIds, true)) {
            $fieldId = null;
        }

        $rows = Harvest::query()
            ->selectRaw('harvests.harvest_date as harvest_date, fields.id as field_id, fields.name as field_name, SUM(harvests.quantity_kg) as total_kg, SUM(harvests.quantity_kg * COALESCE(harvests.price_per_kg, 0)) as total_value')
            ->join('plantings', 'plantings.id', '=', 'harvests.planting_id')
            ->join('fields', 'fields.id', '=', 'plantings.field_id')
            ->whereBetween('harvests.harvest_date', [$startDate, $endDate])
            ->when($fieldIds !== null, function ($query) use ($fieldIds) {
                $query->whereIn('fields.id', $fieldIds);
            })
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
            'fields' => Field::orderBy('name')
                ->when($fieldIds !== null, fn ($q) => $q->whereIn('id', $fieldIds))
                ->get(['id', 'name']),
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'field_id' => $fieldId,
            ],
        ]);
    }

    public function applicationLogs(Request $request)
    {
        $user = $request->user();
        $fieldIds = $user->fieldScopeIds();
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $fieldId = $request->input('field_id');
        if ($fieldIds !== null && $fieldId && !in_array((int) $fieldId, $fieldIds, true)) {
            $fieldId = null;
        }

        // Mapping 'InputUsage' as Application Log
        // Ideally checking for 'fertilizer' or 'chemical' categories if we had them strictly defined,
        // but for now exporting all input usages.
        $query = InputUsage::with(['field', 'input.inputCategory'])
            ->whereBetween('usage_date', [$startDate, $endDate]);

        if ($fieldIds !== null) {
            $query->whereIn('field_id', $fieldIds);
        }

        if ($fieldId) {
            $query->where('field_id', $fieldId);
        }

        $usages = $query->orderBy('usage_date')->get();

        return new StreamedResponse(function () use ($usages) {
            $handle = fopen('php://output', 'w');

            // BOM
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            fputcsv($handle, ['Fecha', 'Campo', 'Insumo', 'Categoría', 'Cantidad', 'Unidad', 'Costo Total', 'Responsable']);

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

    public function attendanceDaily(Request $request)
    {
        $user = $request->user();
        $companyId = $user->company_id;
        $fieldIds = $user->fieldScopeIds();

        $date = $request->input('date', now()->toDateString());
        $fieldId = $request->input('field_id');
        $contractorId = $request->input('contractor_id');

        if ($fieldIds !== null && $fieldId && !in_array((int) $fieldId, $fieldIds, true)) {
            $fieldId = null;
        }

        if ($contractorId && !Contractor::where('company_id', $companyId)->where('id', $contractorId)->exists()) {
            $contractorId = null;
        }

        $rows = Attendance::query()
            ->selectRaw('attendances.date as attendance_date, fields.id as field_id, fields.name as field_name, contractors.id as contractor_id, contractors.business_name as contractor_name, workers.id as worker_id, workers.name as worker_name, attendances.check_in_time as check_in_time, attendances.check_out_time as check_out_time')
            ->join('workers', 'workers.id', '=', 'attendances.worker_id')
            ->leftJoin('contractors', 'contractors.id', '=', 'workers.contractor_id')
            ->leftJoin('fields', 'fields.id', '=', 'attendances.field_id')
            ->where('attendances.company_id', $companyId)
            ->whereDate('attendances.date', $date)
            ->when($fieldIds !== null, function ($query) use ($fieldIds) {
                $query->whereIn('attendances.field_id', $fieldIds);
            })
            ->when($fieldId, function ($query) use ($fieldId) {
                $query->where('attendances.field_id', $fieldId);
            })
            ->when($contractorId, function ($query) use ($contractorId) {
                $query->where('workers.contractor_id', $contractorId);
            })
            ->orderBy('fields.name')
            ->orderBy('contractors.business_name')
            ->orderBy('workers.name')
            ->get()
            ->map(function ($row) {
                $attendanceDate = $row->attendance_date;
                if ($attendanceDate instanceof Carbon) {
                    $attendanceDate = $attendanceDate->format('Y-m-d');
                }

                return [
                    'attendance_date' => $attendanceDate,
                    'field_id' => $row->field_id,
                    'field_name' => $row->field_name ?? 'Sin predio',
                    'contractor_id' => $row->contractor_id,
                    'contractor_name' => $row->contractor_name ?? 'Sin contratista',
                    'worker_id' => $row->worker_id,
                    'worker_name' => $row->worker_name,
                    'check_in_time' => $row->check_in_time ? substr((string) $row->check_in_time, 0, 5) : null,
                    'check_out_time' => $row->check_out_time ? substr((string) $row->check_out_time, 0, 5) : null,
                ];
            })
            ->values();

        return Inertia::render('Reports/AttendanceDaily', [
            'rows' => $rows,
            'fields' => Field::orderBy('name')
                ->when($fieldIds !== null, fn ($q) => $q->whereIn('id', $fieldIds))
                ->get(['id', 'name']),
            'contractors' => Contractor::where('company_id', $companyId)
                ->orderBy('business_name')
                ->get(['id', 'business_name']),
            'filters' => [
                'date' => $date,
                'field_id' => $fieldId,
                'contractor_id' => $contractorId,
            ],
        ]);
    }

    public function attendanceMonthly(Request $request)
    {
        $user = $request->user();
        $companyId = $user->company_id;
        $fieldIds = $user->fieldScopeIds();

        $month = $request->input('month', now()->format('Y-m'));
        try {
            $monthDate = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
            $month = $monthDate->format('Y-m');
        } catch (\Throwable $e) {
            $monthDate = now()->startOfMonth();
            $month = $monthDate->format('Y-m');
        }

        $monthStart = $monthDate->toDateString();
        $monthEnd = $monthDate->copy()->endOfMonth()->toDateString();

        $fieldId = $request->input('field_id');
        $contractorId = $request->input('contractor_id');

        if ($fieldIds !== null && $fieldId && !in_array((int) $fieldId, $fieldIds, true)) {
            $fieldId = null;
        }

        if ($contractorId && !Contractor::where('company_id', $companyId)->where('id', $contractorId)->exists()) {
            $contractorId = null;
        }

        $rows = Attendance::query()
            ->selectRaw('workers.id as worker_id, workers.name as worker_name, contractors.id as contractor_id, contractors.business_name as contractor_name, fields.id as field_id, fields.name as field_name, COUNT(attendances.id) as attendances_count, MIN(attendances.date) as first_attendance_date, MAX(attendances.date) as last_attendance_date')
            ->join('workers', 'workers.id', '=', 'attendances.worker_id')
            ->leftJoin('contractors', 'contractors.id', '=', 'workers.contractor_id')
            ->leftJoin('fields', 'fields.id', '=', 'attendances.field_id')
            ->where('attendances.company_id', $companyId)
            ->whereBetween('attendances.date', [$monthStart, $monthEnd])
            ->when($fieldIds !== null, function ($query) use ($fieldIds) {
                $query->whereIn('attendances.field_id', $fieldIds);
            })
            ->when($fieldId, function ($query) use ($fieldId) {
                $query->where('attendances.field_id', $fieldId);
            })
            ->when($contractorId, function ($query) use ($contractorId) {
                $query->where('workers.contractor_id', $contractorId);
            })
            ->groupBy('workers.id', 'workers.name', 'contractors.id', 'contractors.business_name', 'fields.id', 'fields.name')
            ->orderBy('contractors.business_name')
            ->orderBy('fields.name')
            ->orderBy('workers.name')
            ->get()
            ->map(function ($row) {
                $firstAttendanceDate = $row->first_attendance_date;
                if ($firstAttendanceDate instanceof Carbon) {
                    $firstAttendanceDate = $firstAttendanceDate->format('Y-m-d');
                }

                $lastAttendanceDate = $row->last_attendance_date;
                if ($lastAttendanceDate instanceof Carbon) {
                    $lastAttendanceDate = $lastAttendanceDate->format('Y-m-d');
                }

                return [
                    'worker_id' => $row->worker_id,
                    'worker_name' => $row->worker_name,
                    'contractor_id' => $row->contractor_id,
                    'contractor_name' => $row->contractor_name ?? 'Sin contratista',
                    'field_id' => $row->field_id,
                    'field_name' => $row->field_name ?? 'Sin predio',
                    'attendances_count' => (int) $row->attendances_count,
                    'first_attendance_date' => $firstAttendanceDate,
                    'last_attendance_date' => $lastAttendanceDate,
                ];
            })
            ->values();

        return Inertia::render('Reports/AttendanceMonthly', [
            'rows' => $rows,
            'fields' => Field::orderBy('name')
                ->when($fieldIds !== null, fn ($q) => $q->whereIn('id', $fieldIds))
                ->get(['id', 'name']),
            'contractors' => Contractor::where('company_id', $companyId)
                ->orderBy('business_name')
                ->get(['id', 'business_name']),
            'filters' => [
                'month' => $month,
                'field_id' => $fieldId,
                'contractor_id' => $contractorId,
            ],
        ]);
    }

    public function harvestCollectionsDaily(Request $request)
    {
        $user = $request->user();
        $fieldIds = $user->fieldScopeIds();
        $date = $request->input('date', now()->toDateString());
        $fieldId = $request->input('field_id');
        $companyId = $request->user()->company_id;
        if ($fieldIds !== null && $fieldId && !in_array((int) $fieldId, $fieldIds, true)) {
            $fieldId = null;
        }

        $rows = \App\Models\HarvestCollection::query()
            ->selectRaw('harvest_collections.date as collection_date, fields.id as field_id, fields.name as field_name, workers.name as worker_name, harvest_containers.id as container_id, harvest_containers.name as container_name, SUM(harvest_collections.quantity) as total_quantity, SUM(harvest_collections.quantity / NULLIF(harvest_containers.quantity_per_bin, 0)) as total_bins')
            ->join('fields', 'fields.id', '=', 'harvest_collections.field_id')
            ->join('harvest_containers', 'harvest_containers.id', '=', 'harvest_collections.harvest_container_id')
            ->join('workers', 'workers.id', '=', 'harvest_collections.worker_id')
            ->where('harvest_collections.company_id', $companyId)
            ->whereDate('harvest_collections.date', $date)
            ->when($fieldIds !== null, function ($query) use ($fieldIds) {
                $query->whereIn('fields.id', $fieldIds);
            })
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
        Log::debug('Harvest Collections Daily Row', ['rows' => $rows]);
        return Inertia::render('Reports/HarvestCollectionsDaily', [
            'rows' => $rows,
            'fields' => Field::orderBy('name')
                ->when($fieldIds !== null, fn ($q) => $q->whereIn('id', $fieldIds))
                ->get(['id', 'name']),
            'filters' => [
                'date' => $date,
                'field_id' => $fieldId,
            ],
        ]);
    }
}

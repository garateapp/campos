<?php

namespace App\Http\Controllers;

use App\Models\Field;
use App\Models\LaborPlanning;
use App\Models\LaborType;
use App\Models\Planting;
use App\Models\Species;
use App\Models\TaskType;
use App\Models\UnitOfMeasure;
use App\Models\Variety;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class LaborPlanningController extends Controller
{
    /**
     * Display a listing of labor plannings.
     */
    public function index(Request $request): Response
    {
        $year = $request->input('year', date('Y'));
        $month = $request->input('month', date('n'));

        // Eager load new relationships
        $plannings = LaborPlanning::with([
                'field',
                'planting.crop.species',
                'planting.crop.varietyEntity',
                'planting.crop.varieties',
                'species',
                'varieties',
                'taskType',
                'laborType',
                'unitOfMeasure'
            ])
            ->where('year', $year)
            ->where('month', $month)
            ->get()
            ->map(function ($p) {
                // Fallback: tomar especie/variedades desde la siembra si no vienen seteadas
                if (!$p->species && $p->planting?->crop?->species) {
                    $p->setRelation('species', $p->planting->crop->species);
                }

                if ($p->varieties->isEmpty() && $p->planting?->crop) {
                    $varieties = $p->planting->crop->varieties;
                    if ($varieties && $varieties->isNotEmpty()) {
                        $p->setRelation('varieties', $varieties);
                    } elseif ($p->planting->crop->varietyEntity) {
                        $p->setRelation('varieties', collect([$p->planting->crop->varietyEntity]));
                    }
                }

                if (!$p->taskType && $p->task_type_id) {
                    $p->setRelation('taskType', TaskType::find($p->task_type_id));
                }

                return $p;
            });

        $summary = [
            'total_jh_planned' => $plannings->sum('total_jh_planned'),
            'total_jh_actual' => $plannings->sum('total_jh_actual'),
            'total_value_planned' => $plannings->sum('total_value_planned'),
            'total_value_actual' => $plannings->sum('total_value_actual'),
        ];

        return Inertia::render('LaborPlannings/Index', [
            'plannings' => $plannings,
            'filters' => [
                'year' => (int) $year,
                'month' => (int) $month,
            ],
            'summary' => $summary,
        ]);
    }

    /**
     * Show the form for creating a new labor planning.
     */
    public function create(): Response
    {
        return Inertia::render('LaborPlannings/Create', [
            'fields' => Field::orderBy('name')->get(['id', 'name']),
            'species' => Species::orderBy('name')->get(['id', 'name']),
            'varieties' => Variety::orderBy('name')->get(['id', 'name', 'species_id']),
            'taskTypes' => TaskType::orderBy('name')->get(['id', 'name']),
            'laborTypes' => LaborType::orderBy('name')->get(['id', 'name']),
            'units' => UnitOfMeasure::orderBy('name')->get(['id', 'name', 'code']),
            'plantings' => $this->plantingOptions(),
        ]);
    }

    /**
     * Store a newly created labor planning in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'year' => 'required|integer',
            'month' => 'required|integer|between:1,12',
            'field_id' => 'nullable|exists:fields,id',
            'planting_id' => 'nullable|exists:plantings,id',
            'species_id' => 'nullable|exists:species,id',
            'variety_ids' => 'nullable|array',
            'variety_ids.*' => 'integer|exists:varieties,id',
            'variety_id' => 'nullable|exists:varieties,id', // fallback single option
            'planting_year' => 'nullable|integer',
            'cc' => 'nullable|string|max:50',
            'hectares' => 'nullable|numeric',
            'num_plants' => 'nullable|integer',
            'meters' => 'nullable|numeric',
            'task_type_id' => 'required|exists:task_types,id',
            'labor_type_id' => 'required|exists:labor_types,id',
            'unit_of_measure_id' => 'nullable|exists:unit_of_measures,id',
            'num_jh_planned' => 'nullable|numeric',
            'avg_yield_planned' => 'nullable|numeric',
            'total_jh_planned' => 'nullable|numeric',
            'effective_days_planned' => 'nullable|integer',
            'value_planned' => 'nullable|numeric',
            'total_value_planned' => 'nullable|numeric',
        ]);

        $laborPlanning = LaborPlanning::create([
            'company_id' => auth()->user()->company_id,
            ...$validated,
        ]);
        $laborPlanning->varieties()->sync($this->collectVarietyIds($request));

        if ($request->boolean('create_another')) {
            return redirect()->route('labor-plannings.create', [
                'year' => $validated['year'],
                'month' => $validated['month'],
                'field_id' => $validated['field_id'] ?? null,
                'planting_id' => $validated['planting_id'] ?? null,
                'species_id' => $validated['species_id'] ?? null,
                'variety_ids' => $request->input('variety_ids') ?? ($validated['variety_id'] ? [$validated['variety_id']] : null),
                'planting_year' => $validated['planting_year'] ?? null,
                'cc' => $validated['cc'] ?? null,
                'hectares' => $validated['hectares'] ?? null,
                'num_plants' => $validated['num_plants'] ?? null,
                'meters' => $validated['meters'] ?? null,
            ])->with('success', 'Planificaci▋ creada. Puede continuar agregando labores para el mismo sector.');
        }

        return redirect()->route('labor-plannings.index', [
            'year' => $validated['year'],
            'month' => $validated['month']
        ])->with('success', 'Planificaci▋ de labor creada exitosamente.');
    }

    /**
     * Show the form for editing the specified labor planning.
     */
    public function edit(LaborPlanning $laborPlanning): Response
    {
        $laborPlanning->load(['varieties', 'planting']);

        return Inertia::render('LaborPlannings/Edit', [
            'planning' => $laborPlanning,
            'fields' => Field::orderBy('name')->get(['id', 'name']),
            'species' => Species::orderBy('name')->get(['id', 'name']),
            'varieties' => Variety::orderBy('name')->get(['id', 'name', 'species_id']),
            'taskTypes' => TaskType::orderBy('name')->get(['id', 'name']),
            'laborTypes' => LaborType::orderBy('name')->get(['id', 'name']),
            'units' => UnitOfMeasure::orderBy('name')->get(['id', 'name', 'code']),
            'plantings' => $this->plantingOptions(),
        ]);
    }

    /**
     * Update the specified labor planning in storage.
     */
    public function update(Request $request, LaborPlanning $laborPlanning)
    {
        $validated = $request->validate([
            'year' => 'required|integer',
            'month' => 'required|integer|between:1,12',
            'field_id' => 'nullable|exists:fields,id',
            'planting_id' => 'nullable|exists:plantings,id',
            'species_id' => 'nullable|exists:species,id',
            'variety_ids' => 'nullable|array',
            'variety_ids.*' => 'integer|exists:varieties,id',
            'variety_id' => 'nullable|exists:varieties,id', // fallback single option
            'planting_year' => 'nullable|integer',
            'cc' => 'nullable|string|max:50',
            'hectares' => 'nullable|numeric',
            'num_plants' => 'nullable|integer',
            'meters' => 'nullable|numeric',
            'task_type_id' => 'required|exists:task_types,id',
            'labor_type_id' => 'required|exists:labor_types,id',
            'unit_of_measure_id' => 'nullable|exists:unit_of_measures,id',
            'num_jh_planned' => 'nullable|numeric',
            'avg_yield_planned' => 'nullable|numeric',
            'total_jh_planned' => 'nullable|numeric',
            'effective_days_planned' => 'nullable|integer',
            'value_planned' => 'nullable|numeric',
            'total_value_planned' => 'nullable|numeric',
            // Actuals
            'avg_yield_actual' => 'nullable|numeric',
            'total_jh_actual' => 'nullable|numeric',
            'jh_ha_actual' => 'nullable|numeric',
            'value_actual' => 'nullable|numeric',
            'total_value_actual' => 'nullable|numeric',
        ]);

        $laborPlanning->update([
            'company_id' => auth()->user()->company_id,
            ...$validated,
        ]);
        $laborPlanning->varieties()->sync($this->collectVarietyIds($request));

        return redirect()->route('labor-plannings.index', [
            'year' => $laborPlanning->year,
            'month' => $laborPlanning->month
        ])->with('success', 'Planificaci▋ actualizada exitosamente.');
    }

    /**
     * Remove the specified labor planning from storage.
     */
    public function destroy(LaborPlanning $laborPlanning)
    {
        $year = $laborPlanning->year;
        $month = $laborPlanning->month;

        $laborPlanning->delete();

        return redirect()->route('labor-plannings.index', [
            'year' => $year,
            'month' => $month
        ])->with('success', 'Planificaci▋ eliminada.');
    }

    /**
     * Normalize single/multiple variety inputs to a unique ID array.
     */
    private function collectVarietyIds(Request $request): array
    {
        $varietyIds = collect($request->input('variety_ids', []))
            ->filter()
            ->map(fn ($id) => (int) $id);

        if ($request->filled('variety_id')) {
            $varietyIds->push((int) $request->input('variety_id'));
        }

        return $varietyIds->unique()->values()->all();
    }

    /**
     * Build planting options for selection (optional).
     */
    private function plantingOptions()
    {
        return Planting::with(['field:id,name', 'crop.species', 'crop.varietyEntity'])
            ->orderByDesc('planted_date')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'label' => $p->crop->name . ' - ' . ($p->crop->varietyEntity?->name ?? $p->crop->variety ?? '') . ' (' . $p->field->name . ')',
                'field_id' => $p->field_id,
                'species_id' => $p->crop->species?->id,
                'variety_id' => $p->crop->varietyEntity?->id,
                'cc' => $p->cc,
                'hectares' => $p->planted_area_hectares,
                'num_plants' => $p->plants_count,
                'season' => $p->season,
            ]);
    }

    /**
     * Importar planificaciones desde CSV (cabeceras en español).
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt',
        ]);

        $companyId = auth()->user()->company_id;
        $path = $request->file('file')->getRealPath();
        Log::info('Labor planning import: recibido archivo', [
            'path' => $path,
            'company_id' => $companyId,
            'original_name' => $request->file('file')->getClientOriginalName(),
            'size' => $request->file('file')->getSize(),
        ]);

        $rows = $this->readCsv($path);
        Log::info('Labor planning import: filas leidas', ['count' => $rows->count()]);

        if ($rows->isEmpty()) {
            return back()->with('error', 'El archivo esta vacio o no tiene filas.');
        }

        $errors = [];
        $created = 0;
        $total = $rows->count();

        DB::beginTransaction();
        try {
            foreach ($rows as $index => $row) {
                $rowNumber = $index + 2;
                $result = $this->processImportRow($row, $companyId);
                if ($result['status'] === 'error') {
                    $errors[] = "Fila {$rowNumber}: {$result['message']}";
                    continue;
                }
                $created++;
            }

            if ($errors) {
                DB::rollBack();
                return back()->with('import_errors', $errors);
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Labor planning import: fallo inesperado', ['error' => $e->getMessage()]);
            return back()->with('error', 'Fallo inesperado: ' . $e->getMessage());
        }

        return back()->with('success', "Importacion de planificaciones exitosa. Creadas: {$created} de {$total}");
    }

    private function processImportRow(array $row, int $companyId): array
    {
        $year = trim($row['anio'] ?? '');
        $month = trim($row['mes'] ?? '');
        $fieldName = trim($row['campo'] ?? '');
        $siembraId = trim($row['siembra_id'] ?? ($row['siembra'] ?? ''));
        $laborName = trim($row['labor'] ?? '');
        $tipoLaborName = trim($row['tipo_labor'] ?? '');
        $unidadMedidaName = trim($row['unidad_medida'] ?? '');
        $cc = trim($row['cc'] ?? '');
        $hectareas = trim($row['hectareas'] ?? '');
        $numPlantas = trim($row['num_plantas'] ?? '');
        $jhPlan = trim($row['jh_plan'] ?? '');
        $rendimientoPlan = trim($row['rendimiento_promedio_plan'] ?? '');
        $jhTotalesPlan = trim($row['jh_totales_plan'] ?? '');
        $diasEfectivosPlan = trim($row['dias_efectivos_plan'] ?? '');
        $costoUnitarioPlan = trim($row['costo_unitario_plan'] ?? '');
        $costoTotalPlan = trim($row['costo_total_plan'] ?? '');
        $jhTotalesReal = trim($row['jh_totales_real'] ?? '');
        $jhHaReal = trim($row['jh_ha_real'] ?? '');
        $costoUnitarioReal = trim($row['costo_unitario_real'] ?? '');
        $costoTotalReal = trim($row['costo_total_real'] ?? '');
        $notas = trim($row['notas'] ?? '');
        $metros = trim($row['metros'] ?? '');
        $avgYieldActual = trim($row['rendimiento_promedio_real'] ?? '');

        if ($year === '' || $month === '' || $laborName === '' || $tipoLaborName === '') {
            return ['status' => 'error', 'message' => 'anio, mes, labor y tipo_labor son obligatorios'];
        }

        if (!is_numeric($year) || !is_numeric($month) || (int) $month < 1 || (int) $month > 12) {
            return ['status' => 'error', 'message' => 'anio o mes invalido'];
        }

        $fieldId = null;
        if ($fieldName !== '') {
            $field = $this->findByName(Field::class, $fieldName, $companyId);
            if (!$field) {
                return ['status' => 'error', 'message' => "Campo '{$fieldName}' no encontrado"];
            }
            $fieldId = $field->id;
        }

        $plantingId = null;
        if ($siembraId !== '') {
            if (!is_numeric($siembraId)) {
                return ['status' => 'error', 'message' => "siembra_id debe ser numerico"];
            }
            $planting = Planting::where('company_id', $companyId)->find($siembraId);
            if (!$planting) {
                return ['status' => 'error', 'message' => "Siembra {$siembraId} no encontrada"];
            }
            $plantingId = $planting->id;
        }

        // task_types son globales, no se filtran por compañía
        $taskType = $this->findTaskTypeByName($laborName);
        if (!$taskType) {
            return ['status' => 'error', 'message' => "Labor '{$laborName}' no encontrada"];
        }

        $laborType = $this->findByName(LaborType::class, $tipoLaborName, $companyId);
        if (!$laborType) {
            return ['status' => 'error', 'message' => "Tipo de labor '{$tipoLaborName}' no encontrado"];
        }

        $unitId = null;
        if ($unidadMedidaName !== '') {
            $unit = UnitOfMeasure::where(function ($q) use ($unidadMedidaName) {
                $q->whereRaw('LOWER(name) = ?', [mb_strtolower($unidadMedidaName)])
                    ->orWhereRaw('LOWER(code) = ?', [mb_strtolower($unidadMedidaName)]);
            })->where(function ($q) use ($companyId) {
                $q->where('company_id', $companyId)->orWhereNull('company_id');
            })->first();
            if (!$unit) {
                return ['status' => 'error', 'message' => "Unidad de medida '{$unidadMedidaName}' no encontrada"];
            }
            $unitId = $unit->id;
        }

        $numericFields = [
            ['hectareas', $hectareas],
            ['num_plantas', $numPlantas],
            ['jh_plan', $jhPlan],
            ['rendimiento_promedio_plan', $rendimientoPlan],
            ['jh_totales_plan', $jhTotalesPlan],
            ['dias_efectivos_plan', $diasEfectivosPlan],
            ['costo_unitario_plan', $costoUnitarioPlan],
            ['costo_total_plan', $costoTotalPlan],
            ['jh_totales_real', $jhTotalesReal],
            ['jh_ha_real', $jhHaReal],
            ['costo_unitario_real', $costoUnitarioReal],
            ['costo_total_real', $costoTotalReal],
            ['metros', $metros],
            ['rendimiento_promedio_real', $avgYieldActual],
        ];
        foreach ($numericFields as [$label, $value]) {
            if ($value !== '' && !is_numeric($value)) {
                return ['status' => 'error', 'message' => "{$label} debe ser numerico"];
            }
        }

        // Autocalcular costo_total_plan segun unidad de medida (plantas o hectareas)
        $computedCostoTotalPlan = null;
        if ($costoUnitarioPlan !== '' && $unitId) {
            $unit = UnitOfMeasure::find($unitId);
            $unitNameLower = mb_strtolower($unit->name ?? '');
            $unitCodeLower = mb_strtolower($unit->code ?? '');

            if ((str_contains($unitNameLower, 'planta') || str_contains($unitCodeLower, 'plant')) && $numPlantas !== '') {
                $computedCostoTotalPlan = (float)$costoUnitarioPlan * (int)$numPlantas;
            } elseif ((str_contains($unitNameLower, 'hect') || str_contains($unitCodeLower, 'ha')) && $hectareas !== '') {
                $computedCostoTotalPlan = (float)$costoUnitarioPlan * (float)$hectareas;
            }
        }

        LaborPlanning::create([
            'company_id' => $companyId,
            'year' => (int) $year,
            'month' => (int) $month,
            'field_id' => $fieldId,
            'planting_id' => $plantingId,
            'task_type_id' => $taskType->id,
            'labor_type_id' => $laborType->id,
            'unit_of_measure_id' => $unitId,
            'cc' => $cc ?: null,
            'hectares' => $hectareas !== '' ? (float) $hectareas : null,
            'num_plants' => $numPlantas !== '' ? (int) $numPlantas : null,
            'num_jh_planned' => $jhPlan !== '' ? (float) $jhPlan : null,
            'avg_yield_planned' => $rendimientoPlan !== '' ? (float) $rendimientoPlan : null,
            'total_jh_planned' => $jhTotalesPlan !== '' ? (float) $jhTotalesPlan : null,
            'effective_days_planned' => $diasEfectivosPlan !== '' ? (int) $diasEfectivosPlan : null,
            'value_planned' => $costoUnitarioPlan !== '' ? (float) $costoUnitarioPlan : null,
            'total_value_planned' => $costoTotalPlan !== '' ? (float) $costoTotalPlan : $computedCostoTotalPlan,
            'total_jh_actual' => $jhTotalesReal !== '' ? (float) $jhTotalesReal : null,
            'jh_ha_actual' => $jhHaReal !== '' ? (float) $jhHaReal : null,
            'value_actual' => $costoUnitarioReal !== '' ? (float) $costoUnitarioReal : null,
            'total_value_actual' => $costoTotalReal !== '' ? (float) $costoTotalReal : null,
            'meters' => $metros !== '' ? (float) $metros : null,
            'avg_yield_actual' => $avgYieldActual !== '' ? (float) $avgYieldActual : null,
            'notes' => $notas ?: null,
        ]);

        return ['status' => 'ok'];
    }

    private function readCsv(string $path)
    {
        $handle = fopen($path, 'r');
        if ($handle === false) {
            return collect();
        }

        $firstLine = fgets($handle);
        if ($firstLine === false) {
            fclose($handle);
            return collect();
        }
        $delimiter = $this->detectDelimiter($firstLine);
        rewind($handle);

        $rows = collect();
        $headers = null;
        while (($data = fgetcsv($handle, 0, $delimiter)) !== false) {
            if ($headers === null) {
                $headers = array_map(function ($h) {
                    $h = trim($h);
                    return preg_replace('/^\xEF\xBB\xBF/', '', $h);
                }, $data);
                continue;
            }
            if (count(array_filter($data, fn ($v) => trim((string) $v) !== '')) === 0) {
                continue;
            }
            $row = [];
            foreach ($headers as $i => $header) {
                $row[$header] = $data[$i] ?? '';
            }
            $rows->push($row);
        }
        fclose($handle);

        return $rows;
    }

    private function detectDelimiter(string $line): string
    {
        $commaCount = substr_count($line, ',');
        $semicolonCount = substr_count($line, ';');
        return $semicolonCount > $commaCount ? ';' : ',';
    }

    private function findByName(string $model, string $name, int $companyId)
    {
        return $model::where(function ($q) use ($name) {
            $q->whereRaw('LOWER(name) = ?', [mb_strtolower($name)]);
        })
            ->where(function ($q) use ($companyId) {
                $q->where('company_id', $companyId)
                    ->orWhereNull('company_id');
            })
            ->first();
    }

    private function findTaskTypeByName(string $name)
    {
        return TaskType::whereRaw('LOWER(name) = ?', [mb_strtolower($name)])->first();
    }
}

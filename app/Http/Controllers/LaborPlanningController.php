<?php

namespace App\Http\Controllers;

use App\Models\Field;
use App\Models\LaborPlanning;
use App\Models\LaborType;
use App\Models\Species;
use App\Models\TaskType;
use App\Models\UnitOfMeasure;
use App\Models\Variety;
use Illuminate\Http\Request;
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
        $plannings = LaborPlanning::with(['field', 'species', 'variety', 'taskType', 'laborType', 'unitOfMeasure'])
            ->where('year', $year)
            ->where('month', $month)
            ->get();

        $summary = [
            'total_jh_planned' => $plannings->sum('total_jh_planned'),
            'total_jh_actual' => $plannings->sum('total_jh_actual'),
            'total_value_planned' => $plannings->sum('total_value_planned'),
            'total_value_actual' => $plannings->sum('total_value_actual'),
        ];

        return Inertia::render('LaborPlannings/Index', [
            'plannings' => $plannings,
            'filters' => [
                'year' => (int)$year,
                'month' => (int)$month,
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
            'species_id' => 'nullable|exists:species,id',
            'variety_id' => 'nullable|exists:varieties,id',
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

        LaborPlanning::create($validated);

        if ($request->boolean('create_another')) {
            return redirect()->route('labor-plannings.create', [
                'year' => $validated['year'],
                'month' => $validated['month'],
                'field_id' => $validated['field_id'] ?? null,
                'species_id' => $validated['species_id'] ?? null,
                'variety_id' => $validated['variety_id'] ?? null,
                'planting_year' => $validated['planting_year'] ?? null,
                'cc' => $validated['cc'] ?? null,
                'hectares' => $validated['hectares'] ?? null,
                'num_plants' => $validated['num_plants'] ?? null,
                'meters' => $validated['meters'] ?? null,
            ])->with('success', 'Planificación creada. Puede continuar agregando labores para el mismo sector.');
        }

        return redirect()->route('labor-plannings.index', [
            'year' => $validated['year'],
            'month' => $validated['month']
        ])->with('success', 'Planificación de labor creada exitosamente.');
    }

    /**
     * Show the form for editing the specified labor planning.
     */
    public function edit(LaborPlanning $laborPlanning): Response
    {
        return Inertia::render('LaborPlannings/Edit', [
            'planning' => $laborPlanning,
            'fields' => Field::orderBy('name')->get(['id', 'name']),
            'species' => Species::orderBy('name')->get(['id', 'name']),
            'varieties' => Variety::orderBy('name')->get(['id', 'name', 'species_id']),
            'taskTypes' => TaskType::orderBy('name')->get(['id', 'name']),
            'laborTypes' => LaborType::orderBy('name')->get(['id', 'name']),
            'units' => UnitOfMeasure::orderBy('name')->get(['id', 'name', 'code']),
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
            'species_id' => 'nullable|exists:species,id',
            'variety_id' => 'nullable|exists:varieties,id',
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

        $laborPlanning->update($validated);

        return redirect()->route('labor-plannings.index', [
            'year' => $laborPlanning->year,
            'month' => $laborPlanning->month
        ])->with('success', 'Planificación actualizada exitosamente.');
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
        ])->with('success', 'Planificación eliminada.');
    }
}

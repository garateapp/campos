<?php

namespace App\Http\Controllers;

use App\Models\Field;
use App\Models\SoilType;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FieldController extends Controller
{
    /**
     * Display a listing of fields.
     */
    public function index(): Response
    {
        $fields = Field::with(['soilType', 'plantings' => function ($query) {
            $query->whereNotIn('status', ['completed', 'failed']);
        }])
            ->orderBy('name')
            ->get()
            ->map(fn ($field) => [
                'id' => $field->id,
                'name' => $field->name,
                'code' => $field->code,
                'area_hectares' => $field->area_hectares,
                'soil_type' => $field->soilType?->name ?? 'N/A',
                'status' => $field->status,
                'active_plantings_count' => $field->plantings->count(),
                'notes' => $field->notes,
            ]);

        return Inertia::render('Fields/Index', [
            'fields' => $fields,
        ]);
    }

    /**
     * Show the form for creating a new field.
     */
    public function create(): Response
    {
        return Inertia::render('Fields/Create', [
            'soilTypes' => SoilType::orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Store a newly created field.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'area_hectares' => 'required|numeric|min:0.01',
            'soil_type_id' => 'nullable|exists:soil_types,id',
            'coordinates' => 'nullable|array',
            'status' => 'nullable|in:active,fallow,preparing',
            'notes' => 'nullable|string|max:1000',
        ]);

        Field::create($validated);

        return redirect()->route('fields.index')->with('success', 'Parcela creada exitosamente.');
    }

    /**
     * Display the specified field.
     */
    public function show(Field $field): Response
    {
        $field->load([
            'plantings.crop',
            'plantings.activities',
            'plantings.harvests',
            'tasks' => fn ($q) => $q->latest()->limit(10),
        ]);

        return Inertia::render('Fields/Show', [
            'field' => [
                'id' => $field->id,
                'name' => $field->name,
                'code' => $field->code,
                'area_hectares' => $field->area_hectares,
                'soil_type' => $field->soilType?->name ?? 'N/A',
                'status' => $field->status,
                'coordinates' => $field->coordinates,
                'notes' => $field->notes,
                'plantings' => $field->plantings->map(fn ($p) => [
                    'id' => $p->id,
                    'crop_name' => $p->crop->name,
                    'variety' => $p->crop->variety,
                    'season' => $p->season,
                    'planted_date' => $p->planted_date->format('Y-m-d'),
                    'status' => $p->status,
                    'planted_area_hectares' => $p->planted_area_hectares,
                    'total_harvested_kg' => $p->harvests->sum('quantity_kg'),
                ]),
                'recent_tasks' => $field->tasks->map(fn ($t) => [
                    'id' => $t->id,
                    'title' => $t->title,
                    'status' => $t->status,
                    'due_date' => $t->due_date->format('Y-m-d'),
                ]),
            ],
        ]);
    }

    /**
     * Show the form for editing the specified field.
     */
    public function edit(Field $field): Response
    {
        return Inertia::render('Fields/Edit', [
            'field' => $field,
            'soilTypes' => SoilType::orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Update the specified field.
     */
    public function update(Request $request, Field $field)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'area_hectares' => 'required|numeric|min:0.01',
            'soil_type_id' => 'nullable|exists:soil_types,id',
            'coordinates' => 'nullable|array',
            'status' => 'nullable|in:active,fallow,preparing',
            'notes' => 'nullable|string|max:1000',
        ]);

        $field->update($validated);

        return redirect()->route('fields.index')->with('success', 'Parcela actualizada.');
    }

    /**
     * Remove the specified field.
     */
    public function destroy(Field $field)
    {
        $field->delete();

        return redirect()->route('fields.index')->with('success', 'Parcela eliminada.');
    }

    /**
     * Display the field mapping page.
     */
    public function mapping(): Response
    {
        $fields = Field::with(['plantings.crop'])
            ->orderBy('name')
            ->get()
            ->map(fn ($field) => [
                'id' => $field->id,
                'name' => $field->name,
                'code' => $field->code,
                'area_hectares' => $field->area_hectares,
                'status' => $field->status,
                'coordinates' => $field->coordinates,
                'crop' => $field->plantings->first()?->crop?->name ?? 'N/A',
            ]);

        return Inertia::render('FieldMapping', [
            'fields' => $fields,
        ]);
    }
}

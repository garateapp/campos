<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Crop;
use App\Models\Field;
use App\Models\Harvest;
use App\Models\Planting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlantingController extends Controller
{
    /**
     * Display a listing of plantings.
     */
    public function index(Request $request): Response
    {
        $query = Planting::with(['field', 'crop.species.family', 'crop.varietyEntity'])
            ->withSum('harvests', 'quantity_kg');

        // Filter by season
        if ($request->has('season')) {
            $query->where('season', $request->season);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $plantings = $query->orderByDesc('planted_date')->get()->map(fn ($p) => [
            'id' => $p->id,
            'field_name' => $p->field->name,
            'field_id' => $p->field_id,
            'crop_name' => $p->crop->name,
            'family_name' => $p->crop->species?->family?->name,
            'species_name' => $p->crop->species?->name,
            'variety_name' => $p->crop->varietyEntity?->name ?? $p->crop->variety,
            'season' => $p->season,
            'planted_date' => $p->planted_date->format('Y-m-d'),
            'expected_harvest_date' => $p->expected_harvest_date?->format('Y-m-d'),
            'planted_area_hectares' => $p->planted_area_hectares,
            'status' => $p->status,
            'expected_yield_kg' => $p->expected_yield_kg,
            'total_harvested_kg' => $p->harvests_sum_quantity_kg ?? 0,
        ]);

        // Get available seasons for filter
        $seasons = Planting::distinct('season')->pluck('season')->sort()->reverse()->values();

        return Inertia::render('Plantings/Index', [
            'plantings' => $plantings,
            'seasons' => $seasons,
            'filters' => $request->only(['season', 'status']),
        ]);
    }

    /**
     * Show the form for creating a new planting.
     */
    public function create(): Response
    {
        $fields = Field::where('status', 'active')->orderBy('name')->get(['id', 'name', 'area_hectares']);
        $crops = Crop::orderBy('name')->get(['id', 'name', 'variety', 'days_to_harvest']);

        return Inertia::render('Plantings/Create', [
            'fields' => $fields,
            'crops' => $crops,
        ]);
    }

    /**
     * Store a newly created planting.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'field_id' => 'required|exists:fields,id',
            'crop_id' => 'required|exists:crops,id',
            'season' => 'required|string|max:20',
            'planted_date' => 'required|date',
            'expected_harvest_date' => 'nullable|date|after:planted_date',
            'planted_area_hectares' => 'required|numeric|min:0.01',
            'plants_count' => 'nullable|integer|min:1',
            'expected_yield_kg' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        Planting::create($validated);

        return redirect()->route('plantings.index')->with('success', 'Siembra registrada exitosamente.');
    }

    /**
     * Display the specified planting.
     */
    public function show(Planting $planting): Response
    {
        $planting->load(['field', 'crop.species.family', 'crop.varietyEntity', 'activities.performer', 'harvests']);

        return Inertia::render('Plantings/Show', [
            'planting' => [
                'id' => $planting->id,
                'field' => $planting->field,
                'crop' => $planting->crop,
                'season' => $planting->season,
                'planted_date' => $planting->planted_date->format('Y-m-d'),
                'expected_harvest_date' => $planting->expected_harvest_date?->format('Y-m-d'),
                'planted_area_hectares' => $planting->planted_area_hectares,
                'plants_count' => $planting->plants_count,
                'status' => $planting->status,
                'expected_yield_kg' => $planting->expected_yield_kg,
                'notes' => $planting->notes,
                'activities' => $planting->activities->map(fn ($a) => [
                    'id' => $a->id,
                    'type' => $a->type,
                    'activity_date' => $a->activity_date->format('Y-m-d'),
                    'description' => $a->description,
                    'performer_name' => $a->performer?->name,
                    'metadata' => $a->metadata,
                ]),
                'harvests' => $planting->harvests->map(fn ($h) => [
                    'id' => $h->id,
                    'harvest_date' => $h->harvest_date->format('Y-m-d'),
                    'quantity_kg' => $h->quantity_kg,
                    'quality_grade' => $h->quality_grade,
                    'price_per_kg' => $h->price_per_kg,
                    'notes' => $h->notes,
                ]),
                'total_harvested_kg' => $planting->harvests->sum('quantity_kg'),
            ],
        ]);
    }

    /**
     * Show the form for editing the specified planting.
     */
    public function edit(Planting $planting): Response
    {
        $fields = Field::orderBy('name')->get(['id', 'name', 'area_hectares']);
        $crops = Crop::orderBy('name')->get(['id', 'name', 'variety']);

        return Inertia::render('Plantings/Edit', [
            'planting' => $planting,
            'fields' => $fields,
            'crops' => $crops,
        ]);
    }

    /**
     * Update the specified planting.
     */
    public function update(Request $request, Planting $planting)
    {
        $validated = $request->validate([
            'field_id' => 'required|exists:fields,id',
            'crop_id' => 'required|exists:crops,id',
            'season' => 'required|string|max:20',
            'planted_date' => 'required|date',
            'expected_harvest_date' => 'nullable|date|after:planted_date',
            'planted_area_hectares' => 'required|numeric|min:0.01',
            'plants_count' => 'nullable|integer|min:1',
            'status' => 'required|in:planted,growing,flowering,fruiting,harvesting,completed,failed',
            'expected_yield_kg' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        $planting->update($validated);

        return redirect()->route('plantings.show', $planting)->with('success', 'Siembra actualizada.');
    }

    /**
     * Remove the specified planting.
     */
    public function destroy(Planting $planting)
    {
        $planting->delete();

        return redirect()->route('plantings.index')->with('success', 'Siembra eliminada.');
    }

    /**
     * Store a new activity for a planting.
     */
    public function storeActivity(Request $request, Planting $planting)
    {
        $validated = $request->validate([
            'type' => 'required|in:irrigation,fertilization,pest_control,pruning,scouting,other',
            'activity_date' => 'required|date',
            'description' => 'nullable|string|max:1000',
            'metadata' => 'nullable|array',
        ]);

        Activity::create([
            'company_id' => auth()->user()->company_id,
            'planting_id' => $planting->id,
            'performed_by' => auth()->id(),
            ...$validated,
        ]);

        return redirect()->back()->with('success', 'Actividad registrada.');
    }

    /**
     * Store a new harvest for a planting.
     */
    public function storeHarvest(Request $request, Planting $planting)
    {
        $validated = $request->validate([
            'harvest_date' => 'required|date',
            'quantity_kg' => 'required|numeric|min:0.01',
            'quality_grade' => 'nullable|string|max:50',
            'price_per_kg' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        Harvest::create([
            'company_id' => auth()->user()->company_id,
            'planting_id' => $planting->id,
            ...$validated,
        ]);

        // Update planting status to harvesting if still in previous states
        if (in_array($planting->status, ['planted', 'growing', 'flowering', 'fruiting'])) {
            $planting->update(['status' => 'harvesting']);
        }

        return redirect()->back()->with('success', 'Cosecha registrada.');
    }
}

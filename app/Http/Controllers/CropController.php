<?php

namespace App\Http\Controllers;

use App\Models\Crop;
use App\Models\Family;
use App\Models\Species;
use App\Models\Variety;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CropController extends Controller
{
    /**
     * Display a listing of crops.
     */
    public function index(): Response
    {
        $crops = Crop::with(['species.family', 'varietyEntity'])
            ->withCount('plantings')
            ->orderBy('name')
            ->get()
            ->map(fn ($crop) => [
                'id' => $crop->id,
                'name' => $crop->name,
                'family_name' => $crop->species?->family?->name,
                'species_name' => $crop->species?->name,
                'variety_name' => $crop->varietyEntity?->name ?? $crop->variety,
                'scientific_name' => $crop->scientific_name,
                'days_to_harvest' => $crop->days_to_harvest,
                'plantings_count' => $crop->plantings_count,
            ]);

        return Inertia::render('Crops/Index', [
            'crops' => $crops,
        ]);
    }

    /**
     * Show the form for creating a new crop.
     */
    public function create(): Response
    {
        $families = Family::with(['species.varieties'])->orderBy('name')->get();

        return Inertia::render('Crops/Form', [
            'crop' => null,
            'families' => $families,
        ]);
    }

    /**
     * Store a newly created crop.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'species_id' => 'required|exists:species,id',
            'variety_id' => 'nullable|exists:varieties,id',
            'name' => 'nullable|string|max:255', // Optional override
            'variety' => 'nullable|string|max:255', // Optional override
            'scientific_name' => 'nullable|string|max:255',
            'days_to_harvest' => 'nullable|integer|min:1',
            'notes' => 'nullable|string|max:1000',
        ]);

        // If name is not provided, use species name
        if (empty($validated['name'])) {
            $species = Species::find($validated['species_id']);
            $validated['name'] = $species->name;
        }

        Crop::create($validated);

        return redirect()->route('crops.index')->with('success', 'Cultivo creado exitosamente.');
    }

    /**
     * Show the form for editing the specified crop.
     */
    public function edit(Crop $crop): Response
    {
        $families = Family::with(['species.varieties'])->orderBy('name')->get();
        $crop->load('species.family');

        return Inertia::render('Crops/Form', [
            'crop' => array_merge($crop->toArray(), [
                'family_id' => $crop->species?->family_id
            ]),
            'families' => $families,
        ]);
    }

    /**
     * Update the specified crop.
     */
    public function update(Request $request, Crop $crop)
    {
        $validated = $request->validate([
            'species_id' => 'required|exists:species,id',
            'variety_id' => 'nullable|exists:varieties,id',
            'name' => 'nullable|string|max:255',
            'variety' => 'nullable|string|max:255',
            'scientific_name' => 'nullable|string|max:255',
            'days_to_harvest' => 'nullable|integer|min:1',
            'notes' => 'nullable|string|max:1000',
        ]);

        $crop->update($validated);

        return redirect()->route('crops.index')->with('success', 'Cultivo actualizado.');
    }

    /**
     * Remove the specified crop.
     */
    public function destroy(Crop $crop)
    {
        if ($crop->plantings()->exists()) {
            return redirect()->back()->with('error', 'No se puede eliminar un cultivo con siembras asociadas.');
        }

        $crop->delete();

        return redirect()->route('crops.index')->with('success', 'Cultivo eliminado.');
    }
}

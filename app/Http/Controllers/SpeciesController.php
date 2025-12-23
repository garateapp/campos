<?php

namespace App\Http\Controllers;

use App\Models\Family;
use App\Models\Species;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SpeciesController extends Controller
{
    /**
     * Display a listing of the species.
     */
    public function index(): Response
    {
        return Inertia::render('MasterTables/Species/Index', [
            'species' => Species::with('family')->orderBy('name')->get(),
            'families' => Family::orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Store a newly created species in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'family_id' => 'required|exists:families,id',
            'name' => 'required|string|max:255',
            'scientific_name' => 'nullable|string|max:255',
        ]);

        Species::create($validated);

        return redirect()->back()->with('success', 'Especie creada exitosamente.');
    }

    /**
     * Update the specified species in storage.
     */
    public function update(Request $request, Species $species)
    {
        $validated = $request->validate([
            'family_id' => 'required|exists:families,id',
            'name' => 'required|string|max:255',
            'scientific_name' => 'nullable|string|max:255',
        ]);

        $species->update($validated);

        return redirect()->back()->with('success', 'Especie actualizada exitosamente.');
    }

    /**
     * Remove the specified species from storage.
     */
    public function destroy(Species $species)
    {
        $species->delete();

        return redirect()->back()->with('success', 'Especie eliminada exitosamente.');
    }
}

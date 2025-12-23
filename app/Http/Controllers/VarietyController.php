<?php

namespace App\Http\Controllers;

use App\Models\Species;
use App\Models\Variety;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VarietyController extends Controller
{
    /**
     * Display a listing of the varieties.
     */
    public function index(): Response
    {
        return Inertia::render('MasterTables/Varieties/Index', [
            'varieties' => Variety::with('species.family')->orderBy('name')->get(),
            'species' => Species::orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Store a newly created variety in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'species_id' => 'required|exists:species,id',
            'name' => 'required|string|max:255',
        ]);

        Variety::create($validated);

        return redirect()->back()->with('success', 'Variedad creada exitosamente.');
    }

    /**
     * Update the specified variety in storage.
     */
    public function update(Request $request, Variety $variety)
    {
        $validated = $request->validate([
            'species_id' => 'required|exists:species,id',
            'name' => 'required|string|max:255',
        ]);

        $variety->update($validated);

        return redirect()->back()->with('success', 'Variedad actualizada exitosamente.');
    }

    /**
     * Remove the specified variety from storage.
     */
    public function destroy(Variety $variety)
    {
        $variety->delete();

        return redirect()->back()->with('success', 'Variedad eliminada exitosamente.');
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\HarvestContainer;
use App\Models\Species;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class HarvestContainerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $containers = HarvestContainer::where('company_id', Auth::user()->company_id)
            ->with('species')
            ->orderBy('name')
            ->get();

        $species = Species::where('company_id', Auth::user()->company_id)
            ->orderBy('name')
            ->get();

        return Inertia::render('MasterTables/HarvestContainers/Index', [
            'containers' => $containers,
            'species' => $species,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'species_id' => 'required|exists:species,id',
            'name' => 'required|string|max:255',
            'quantity_per_bin' => 'required|integer|min:1',
            'bin_weight_kg' => 'required|numeric|min:0',
        ]);

        $validated['company_id'] = Auth::user()->company_id;

        HarvestContainer::create($validated);

        return redirect()->route('harvest-containers.index')->with('success', 'Envase creado exitosamente.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, HarvestContainer $harvestContainer)
    {
        if ($harvestContainer->company_id !== Auth::user()->company_id) {
            abort(403);
        }

        $validated = $request->validate([
            'species_id' => 'required|exists:species,id',
            'name' => 'required|string|max:255',
            'quantity_per_bin' => 'required|integer|min:1',
            'bin_weight_kg' => 'required|numeric|min:0',
        ]);

        $harvestContainer->update($validated);

        return redirect()->route('harvest-containers.index')->with('success', 'Envase actualizado exitosamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(HarvestContainer $harvestContainer)
    {
        if ($harvestContainer->company_id !== Auth::user()->company_id) {
            abort(403);
        }

        $harvestContainer->delete();

        return redirect()->route('harvest-containers.index')->with('success', 'Envase eliminado exitosamente.');
    }
}

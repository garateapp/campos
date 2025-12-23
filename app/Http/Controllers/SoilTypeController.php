<?php

namespace App\Http\Controllers;

use App\Models\SoilType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SoilTypeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('MasterTables/SoilTypes/Index', [
            'soilTypes' => SoilType::withCount('fields')->orderBy('name')->get()
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        SoilType::create($validated);

        return back()->with('success', 'Tipo de suelo creado exitosamente.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, SoilType $soilType)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $soilType->update($validated);

        return back()->with('success', 'Tipo de suelo actualizado exitosamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(SoilType $soilType)
    {
        if ($soilType->fields()->count() > 0) {
            return back()->with('error', 'No se puede eliminar el tipo de suelo porque tiene parcelas asociadas.');
        }

        $soilType->delete();

        return back()->with('success', 'Tipo de suelo eliminado exitosamente.');
    }
}

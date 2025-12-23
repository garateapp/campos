<?php

namespace App\Http\Controllers;

use App\Models\Family;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FamilyController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('MasterTables/Families/Index', [
            'families' => Family::withCount('species')->orderBy('name')->get()
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:families,name',
        ]);

        Family::create($validated);

        return back()->with('success', 'Familia creada exitosamente.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Family $family)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:families,name,' . $family->id,
        ]);

        $family->update($validated);

        return back()->with('success', 'Familia actualizada exitosamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Family $family)
    {
        if ($family->species()->count() > 0) {
            return back()->with('error', 'No se puede eliminar la familia porque tiene especies asociadas.');
        }

        $family->delete();

        return back()->with('success', 'Familia eliminada exitosamente.');
    }

    /**
     * Get hierarchy for cascading selects.
     */
    public function hierarchy()
    {
        return response()->json(
            Family::with(['species' => function($q) {
                $q->orderBy('name');
            }, 'species.varieties' => function($q) {
                $q->orderBy('name');
            }])->orderBy('name')->get()
        );
    }
}

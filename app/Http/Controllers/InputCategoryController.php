<?php

namespace App\Http\Controllers;

use App\Models\InputCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InputCategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('MasterTables/InputCategories/Index', [
            'categories' => InputCategory::withCount('inputs')->orderBy('name')->get()
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

        InputCategory::create($validated);

        return back()->with('success', 'Categoría de insumo creada exitosamente.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, InputCategory $inputCategory)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $inputCategory->update($validated);

        return back()->with('success', 'Categoría de insumo actualizada exitosamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(InputCategory $inputCategory)
    {
        if ($inputCategory->inputs()->count() > 0) {
            return back()->with('error', 'No se puede eliminar la categoría porque tiene insumos asociados.');
        }

        $inputCategory->delete();

        return back()->with('success', 'Categoría de insumo eliminada exitosamente.');
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\UnitOfMeasure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UnitOfMeasureController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('MasterTables/UnitOfMeasures/Index', [
            'units' => UnitOfMeasure::orderBy('name')->get()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:unit_of_measures,name,NULL,id,company_id,' . auth()->user()->company_id,
            'code' => 'nullable|string|max:10',
        ]);

        UnitOfMeasure::create([
            'company_id' => auth()->user()->company_id,
            'name' => $validated['name'],
            'code' => $validated['code'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Unidad de medida creada.');
    }

    public function update(Request $request, UnitOfMeasure $unitOfMeasure)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:unit_of_measures,name,' . $unitOfMeasure->id . ',id,company_id,' . auth()->user()->company_id,
            'code' => 'nullable|string|max:10',
        ]);

        $unitOfMeasure->update($validated);

        return redirect()->back()->with('success', 'Unidad de medida actualizada.');
    }

    public function destroy(UnitOfMeasure $unitOfMeasure)
    {
        $unitOfMeasure->delete();

        return redirect()->back()->with('success', 'Unidad de medida eliminada.');
    }
}

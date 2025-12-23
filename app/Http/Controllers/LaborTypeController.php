<?php

namespace App\Http\Controllers;

use App\Models\LaborType;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LaborTypeController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('MasterTables/LaborTypes/Index', [
            'laborTypes' => LaborType::orderBy('name')->get()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:labor_types,name,NULL,id,company_id,' . auth()->user()->company_id,
        ]);

        LaborType::create([
            'company_id' => auth()->user()->company_id,
            'name' => $validated['name'],
        ]);

        return redirect()->back()->with('success', 'Tipo de labor creado.');
    }

    public function update(Request $request, LaborType $laborType)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:labor_types,name,' . $laborType->id . ',id,company_id,' . auth()->user()->company_id,
        ]);

        $laborType->update($validated);

        return redirect()->back()->with('success', 'Tipo de labor actualizado.');
    }

    public function destroy(LaborType $laborType)
    {
        // Add check for usage later if needed
        $laborType->delete();

        return redirect()->back()->with('success', 'Tipo de labor eliminado.');
    }
}

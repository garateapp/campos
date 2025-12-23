<?php

namespace App\Http\Controllers;

use App\Models\Cost;
use App\Models\Field;
use App\Models\Planting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CostController extends Controller
{
    /**
     * Display a listing of costs.
     */
    public function index(Request $request): Response
    {
        $query = Cost::with(['field', 'planting.crop']);

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Filter by category
        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        // Filter by field
        if ($request->has('field_id')) {
            $query->where('field_id', $request->field_id);
        }

        // Filter by date range
        if ($request->has('from')) {
            $query->where('cost_date', '>=', $request->from);
        }
        if ($request->has('to')) {
            $query->where('cost_date', '<=', $request->to);
        }

        $costs = $query->orderByDesc('cost_date')->get()->map(fn ($cost) => [
            'id' => $cost->id,
            'type' => $cost->type,
            'category' => $cost->category,
            'description' => $cost->description,
            'amount' => $cost->amount,
            'currency' => $cost->currency,
            'cost_date' => $cost->cost_date->format('Y-m-d'),
            'field_name' => $cost->field?->name,
            'planting_info' => $cost->planting 
                ? "{$cost->planting->crop->name} ({$cost->planting->season})"
                : null,
            'notes' => $cost->notes,
        ]);

        // Get summary stats
        $totalCosts = $costs->sum('amount');
        $costsByType = $costs->groupBy('type')->map(fn ($group) => $group->sum('amount'));
        $costsByCategory = $costs->groupBy('category')->map(fn ($group) => $group->sum('amount'));

        // Get fields for filter
        $fields = Field::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Costs/Index', [
            'costs' => $costs,
            'summary' => [
                'total' => $totalCosts,
                'byType' => $costsByType,
                'byCategory' => $costsByCategory,
            ],
            'fields' => $fields,
            'filters' => $request->only(['type', 'category', 'field_id', 'from', 'to']),
        ]);
    }

    /**
     * Show the form for creating a new cost.
     */
    public function create(): Response
    {
        $fields = Field::orderBy('name')->get(['id', 'name']);
        $plantings = Planting::with('crop', 'field')
            ->orderByDesc('planted_date')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'label' => "{$p->crop->name} - {$p->field->name} ({$p->season})",
                'field_id' => $p->field_id,
            ]);

        return Inertia::render('Costs/Form', [
            'cost' => null,
            'fields' => $fields,
            'plantings' => $plantings,
        ]);
    }

    /**
     * Store a newly created cost.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:input,labor,equipment,transport,other',
            'category' => 'required|in:fixed,variable',
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0.01',
            'currency' => 'nullable|string|size:3',
            'cost_date' => 'required|date',
            'field_id' => 'nullable|exists:fields,id',
            'planting_id' => 'nullable|exists:plantings,id',
            'notes' => 'nullable|string|max:1000',
        ]);

        Cost::create([
            ...$validated,
            'currency' => $validated['currency'] ?? auth()->user()->company->currency ?? 'CLP',
        ]);

        return redirect()->route('costs.index')->with('success', 'Costo registrado exitosamente.');
    }

    /**
     * Show the form for editing the specified cost.
     */
    public function edit(Cost $cost): Response
    {
        $fields = Field::orderBy('name')->get(['id', 'name']);
        $plantings = Planting::with('crop', 'field')
            ->orderByDesc('planted_date')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'label' => "{$p->crop->name} - {$p->field->name} ({$p->season})",
                'field_id' => $p->field_id,
            ]);

        return Inertia::render('Costs/Form', [
            'cost' => [
                ...$cost->toArray(),
                'cost_date' => $cost->cost_date->format('Y-m-d'),
            ],
            'fields' => $fields,
            'plantings' => $plantings,
        ]);
    }

    /**
     * Update the specified cost.
     */
    public function update(Request $request, Cost $cost)
    {
        $validated = $request->validate([
            'type' => 'required|in:input,labor,equipment,transport,other',
            'category' => 'required|in:fixed,variable',
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0.01',
            'currency' => 'nullable|string|size:3',
            'cost_date' => 'required|date',
            'field_id' => 'nullable|exists:fields,id',
            'planting_id' => 'nullable|exists:plantings,id',
            'notes' => 'nullable|string|max:1000',
        ]);

        $cost->update($validated);

        return redirect()->route('costs.index')->with('success', 'Costo actualizado.');
    }

    /**
     * Remove the specified cost.
     */
    public function destroy(Cost $cost)
    {
        $cost->delete();

        return redirect()->route('costs.index')->with('success', 'Costo eliminado.');
    }
}

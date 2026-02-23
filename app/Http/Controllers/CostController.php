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
        $user = auth()->user();
        $fieldIds = $user->fieldScopeIds();
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

        if ($fieldIds !== null) {
            $query->where(function ($q) use ($fieldIds) {
                $q->whereIn('field_id', $fieldIds)
                    ->orWhereHas('planting', function ($planting) use ($fieldIds) {
                        $planting->whereIn('field_id', $fieldIds);
                    });
            });
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
        $fields = Field::orderBy('name')
            ->when($fieldIds !== null, fn ($q) => $q->whereIn('id', $fieldIds))
            ->get(['id', 'name']);

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
        $user = auth()->user();
        $fieldIds = $user->fieldScopeIds();
        $fields = Field::orderBy('name')
            ->when($fieldIds !== null, fn ($q) => $q->whereIn('id', $fieldIds))
            ->get(['id', 'name']);
        $plantings = Planting::with('crop', 'field')
            ->orderByDesc('planted_date')
            ->when($fieldIds !== null, fn ($q) => $q->whereIn('field_id', $fieldIds))
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
        $user = auth()->user();
        $fieldIds = $user->fieldScopeIds();
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

        if ($fieldIds !== null && count($fieldIds) === 1) {
            $validated['field_id'] = $fieldIds[0];
        }

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
        $user = auth()->user();
        $fieldIds = $user->fieldScopeIds();
        if ($fieldIds !== null && $cost->field_id && !in_array($cost->field_id, $fieldIds, true)) {
            abort(403, 'No tienes acceso a este costo.');
        }

        $fields = Field::orderBy('name')
            ->when($fieldIds !== null, fn ($q) => $q->whereIn('id', $fieldIds))
            ->get(['id', 'name']);
        $plantings = Planting::with('crop', 'field')
            ->orderByDesc('planted_date')
            ->when($fieldIds !== null, fn ($q) => $q->whereIn('field_id', $fieldIds))
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
        $user = auth()->user();
        $fieldIds = $user->fieldScopeIds();
        if ($fieldIds !== null && $cost->field_id && !in_array($cost->field_id, $fieldIds, true)) {
            abort(403, 'No tienes acceso a este costo.');
        }

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

        if ($fieldIds !== null && count($fieldIds) === 1) {
            $validated['field_id'] = $fieldIds[0];
        }

        $cost->update($validated);

        return redirect()->route('costs.index')->with('success', 'Costo actualizado.');
    }

    /**
     * Remove the specified cost.
     */
    public function destroy(Cost $cost)
    {
        $user = auth()->user();
        $fieldIds = $user->fieldScopeIds();
        if ($fieldIds !== null && $cost->field_id && !in_array($cost->field_id, $fieldIds, true)) {
            abort(403, 'No tienes acceso a este costo.');
        }

        $cost->delete();

        return redirect()->route('costs.index')->with('success', 'Costo eliminado.');
    }
}

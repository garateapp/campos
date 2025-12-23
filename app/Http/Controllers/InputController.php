<?php

namespace App\Http\Controllers;

use App\Models\Input;
use App\Models\InputCategory;
use App\Models\InputUsage;
use App\Models\Field;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InputController extends Controller
{
    /**
     * Display a listing of inputs.
     */
    public function index(Request $request): Response
    {
        $query = Input::with('field');

        // Filter by category
        if ($request->has('input_category_id') && $request->input_category_id !== 'all') {
            $query->where('input_category_id', $request->input_category_id);
        }

        // Filter low stock
        if ($request->boolean('low_stock')) {
            $query->whereColumn('current_stock', '<=', 'min_stock_alert')
                  ->whereNotNull('min_stock_alert');
        }

        // Filter by field
        if ($request->has('field_id') && $request->field_id !== 'all') {
            $query->where('field_id', $request->field_id);
        }

        $inputs = $query->orderBy('name')->get()->map(fn ($input) => [
            'id' => $input->id,
            'name' => $input->name,
            'category_name' => $input->category?->name,
            'unit' => $input->unit,
            'current_stock' => $input->current_stock,
            'min_stock_alert' => $input->min_stock_alert,
            'unit_cost' => $input->unit_cost,
            'is_low_stock' => $input->isLowStock(),
            'total_value' => $input->current_stock * ($input->unit_cost ?? 0),
            'field_name' => $input->field?->name ?? 'Bodega General',
            'field_id' => $input->field_id,
        ]);

        return Inertia::render('Inputs/Index', [
            'inputs' => $inputs,
            'fields' => Field::orderBy('name')->get(['id', 'name']),
            'categories' => InputCategory::orderBy('name')->get(['id', 'name']),
            'filters' => $request->only(['input_category_id', 'low_stock', 'field_id']),
        ]);
    }

    /**
     * Show the form for creating a new input.
     */
    public function create(): Response
    {
        return Inertia::render('Inputs/Form', [
            'input' => null,
            'fields' => Field::orderBy('name')->get(['id', 'name']),
            'categories' => InputCategory::orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Store a newly created input.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'field_id' => 'nullable|exists:fields,id',
            'input_category_id' => 'required|exists:input_categories,id',
            'unit' => 'required|string|max:20',
            'current_stock' => 'required|numeric|min:0',
            'min_stock_alert' => 'nullable|numeric|min:0',
            'unit_cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        Input::create(array_merge($validated, [
            'company_id' => auth()->user()->company_id,
        ]));

        return redirect()->route('inputs.index')->with('success', 'Insumo creado exitosamente.');
    }

    /**
     * Display the specified input.
     */
    public function show(Input $input): Response
    {
        $input->load('field');
        $recentUsages = InputUsage::where('input_id', $input->id)
            ->with('field')
            ->orderByDesc('usage_date')
            ->limit(20)
            ->get()
            ->map(fn ($u) => [
                'id' => $u->id,
                'usage_date' => $u->usage_date->format('Y-m-d'),
                'quantity' => $u->quantity,
                'total_cost' => $u->total_cost,
                'field_name' => $u->field?->name,
                'notes' => $u->notes,
            ]);

        return Inertia::render('Inputs/Show', [
            'input' => [
                ...$input->toArray(),
                'category_name' => $input->category?->name,
                'field_name' => $input->field?->name,
            ],
            'recentUsages' => $recentUsages,
            'fields' => Field::orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Show the form for editing the specified input.
     */
    public function edit(Input $input): Response
    {
        return Inertia::render('Inputs/Form', [
            'input' => $input,
            'fields' => Field::orderBy('name')->get(['id', 'name']),
            'categories' => InputCategory::orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Update the specified input.
     */
    public function update(Request $request, Input $input)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'field_id' => 'nullable|exists:fields,id',
            'input_category_id' => 'required|exists:input_categories,id',
            'unit' => 'required|string|max:20',
            'current_stock' => 'required|numeric|min:0',
            'min_stock_alert' => 'nullable|numeric|min:0',
            'unit_cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        $input->update($validated);

        return redirect()->route('inputs.index')->with('success', 'Insumo actualizado.');
    }

    /**
     * Remove the specified input.
     */
    public function destroy(Input $input)
    {
        $input->delete();

        return redirect()->route('inputs.index')->with('success', 'Insumo eliminado.');
    }

    /**
     * Record usage of an input.
     */
    public function recordUsage(Request $request, Input $input)
    {
        $validated = $request->validate([
            'usage_date' => 'required|date',
            'quantity' => 'required|numeric|min:0.01',
            'field_id' => 'nullable|exists:fields,id',
            'activity_id' => 'nullable|exists:activities,id',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Check if enough stock
        if ($input->current_stock < $validated['quantity']) {
            return redirect()->back()->with('error', 'Stock insuficiente.');
        }

        InputUsage::create([
            'company_id' => auth()->user()->company_id,
            'input_id' => $input->id,
            'usage_date' => $validated['usage_date'],
            'quantity' => $validated['quantity'],
            'field_id' => $validated['field_id'] ?? null,
            'activity_id' => $validated['activity_id'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Uso registrado.');
    }
}

<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class HarvestCollectionController extends Controller
{
    public function index()
    {
        $user = \Illuminate\Support\Facades\Auth::user();
        $fieldIds = $user->fieldScopeIds();
        $fields = \App\Models\Field::where('company_id', $user->company_id)
            ->when($fieldIds !== null, fn ($q) => $q->whereIn('id', $fieldIds))
            ->orderBy('name')
            ->get();
        // Load HarvestContainers with Species for filtering
        $containers = \App\Models\HarvestContainer::where('company_id', \Illuminate\Support\Facades\Auth::user()->company_id)
            ->with('species')
            ->orderBy('name')
            ->get();
        $species = \App\Models\Species::where('company_id', \Illuminate\Support\Facades\Auth::user()->company_id)->orderBy('name')->get();

        return \Inertia\Inertia::render('Operations/HarvestCollection/Index', [
            'fields' => $fields,
            'containers' => $containers,
            'species' => $species,
        ]);
    }

    public function store(\Illuminate\Http\Request $request)
    {
        $user = \Illuminate\Support\Facades\Auth::user();
        $fieldIds = $user->fieldScopeIds();
        if ($fieldIds !== null && count($fieldIds) === 1) {
            $request->merge(['field_id' => $fieldIds[0]]);
        }

        $fieldRules = ['required', 'exists:fields,id'];
        if ($fieldIds !== null) {
            $fieldRules[] = Rule::in($fieldIds);
        }

        $request->validate([
            'card_code' => 'required|string',
            'date' => 'required|date',
            'field_id' => $fieldRules,
            'harvest_container_id' => 'required|exists:harvest_containers,id',
            'quantity' => 'required|integer|min:1',
        ]);

        $companyId = $user->company_id;

        // 1. Find Card
        $card = \App\Models\Card::where('company_id', $companyId)
            ->where('code', $request->card_code)
            ->first();

        if (!$card) {
            return back()->withErrors(['card_code' => 'Tarjeta no encontrada.']);
        }

        // 2. Find Assignment for Date
        $assignment = \App\Models\CardAssignment::where('company_id', $companyId)
            ->where('card_id', $card->id)
            ->where('date', $request->date)
            ->with('worker')
            ->first();

        if (!$assignment) {
             return back()->withErrors(['card_code' => 'Tarjeta no asignada para esta fecha.']);
        }

        // 3. Create Collection Record
        \App\Models\HarvestCollection::create([
            'company_id' => $companyId,
            'worker_id' => $assignment->worker_id,
            'date' => $request->date,
            'harvest_container_id' => $request->harvest_container_id,
            'quantity' => $request->quantity,
            'field_id' => $request->field_id,
        ]);

        // Calculate Worker's Total for Today
        $total = \App\Models\HarvestCollection::where('company_id', $companyId)
            ->where('worker_id', $assignment->worker_id)
            ->where('date', $request->date)
            ->where('harvest_container_id', $request->harvest_container_id)
            ->sum('quantity');

        return back()->with('success', "Registrado: +{$request->quantity} para {$assignment->worker->name}. Total Hoy: {$total}");
    }
}

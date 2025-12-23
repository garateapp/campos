<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class HarvestCollectionController extends Controller
{
    public function index()
    {
        $fields = \App\Models\Field::where('company_id', \Illuminate\Support\Facades\Auth::user()->company_id)->orderBy('name')->get();
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
        $request->validate([
            'card_code' => 'required|string',
            'date' => 'required|date',
            'field_id' => 'required|exists:fields,id',
            'harvest_container_id' => 'required|exists:harvest_containers,id',
            'quantity' => 'required|integer|min:1',
        ]);

        $companyId = \Illuminate\Support\Facades\Auth::user()->company_id;

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
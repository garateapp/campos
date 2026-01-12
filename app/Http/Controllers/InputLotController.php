<?php

namespace App\Http\Controllers;

use App\Models\InputLot;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InputLotController extends Controller
{
    /**
     * Display a listing of input lots (FIFO).
     */
    public function index(Request $request): Response
    {
        $companyId = auth()->user()->company_id;

        $lots = InputLot::with(['input.field', 'input.category'])
            ->where('company_id', $companyId)
            ->orderBy('created_at')
            ->get()
            ->map(fn ($lot) => [
                'id' => $lot->id,
                'input_name' => $lot->input?->name,
                'category_name' => $lot->input?->category?->name,
                'field_name' => $lot->input?->field?->name ?? 'Bodega General',
                'unit' => $lot->input?->unit,
                'quantity' => $lot->quantity,
                'remaining_quantity' => $lot->remaining_quantity,
                'created_at' => $lot->created_at->format('Y-m-d'),
            ]);

        return Inertia::render('Inputs/LotsIndex', [
            'lots' => $lots,
        ]);
    }
}

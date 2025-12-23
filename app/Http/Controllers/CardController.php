<?php

namespace App\Http\Controllers;

use App\Models\Card;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class CardController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $cards = Card::where('company_id', Auth::user()->company_id)
            ->orderBy('code')
            ->get();

        return Inertia::render('MasterTables/Cards/Index', [
            'cards' => $cards,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:255|unique:cards,code',
            'status' => 'required|in:active,inactive,lost',
        ]);

        $validated['company_id'] = Auth::user()->company_id;

        Card::create($validated);

        return redirect()->route('cards.index')->with('success', 'Tarjeta creada exitosamente.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Card $card)
    {
        if ($card->company_id !== Auth::user()->company_id) {
            abort(403);
        }

        $validated = $request->validate([
            'code' => 'required|string|max:255|unique:cards,code,' . $card->id,
            'status' => 'required|in:active,inactive,lost',
        ]);

        $card->update($validated);

        return redirect()->route('cards.index')->with('success', 'Tarjeta actualizada exitosamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Card $card)
    {
        if ($card->company_id !== Auth::user()->company_id) {
            abort(403);
        }

        $card->delete();

        return redirect()->route('cards.index')->with('success', 'Tarjeta eliminada exitosamente.');
    }
}

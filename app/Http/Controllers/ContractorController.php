<?php

namespace App\Http\Controllers;

use App\Models\Contractor;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ContractorController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $contractors = Contractor::where('company_id', Auth::user()->company_id)
            ->orderBy('business_name')
            ->get();

        return Inertia::render('MasterTables/Contractors/Index', [
            'contractors' => $contractors,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'business_name' => 'required|string|max:255',
            'rut' => 'nullable|string|max:20',
            'contact_name' => 'nullable|string|max:255',
            'contact_email' => 'nullable|email|max:255',
        ]);

        $validated['company_id'] = Auth::user()->company_id;

        Contractor::create($validated);

        return redirect()->back()->with('success', 'Contratista creado exitosamente.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Contractor $contractor)
    {
        // Ensure access policy
        if ($contractor->company_id !== Auth::user()->company_id) {
            abort(403);
        }

        $validated = $request->validate([
            'business_name' => 'required|string|max:255',
            'rut' => 'nullable|string|max:20',
            'contact_name' => 'nullable|string|max:255',
            'contact_email' => 'nullable|email|max:255',
        ]);

        $contractor->update($validated);

        return redirect()->back()->with('success', 'Contratista actualizado exitosamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Contractor $contractor)
    {
         if ($contractor->company_id !== Auth::user()->company_id) {
            abort(403);
        }
        
        $contractor->delete();

        return redirect()->back()->with('success', 'Contratista eliminado.');
    }
}

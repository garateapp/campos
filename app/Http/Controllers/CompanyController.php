<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Auth;

class CompanyController extends Controller
{
    /**
     * Display the company setup form.
     */
    public function setup(): Response
    {
        return Inertia::render('Company/Setup');
    }

    /**
     * Store a newly created company in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'rut' => 'required|string|max:20',
            'address' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
        ]);

        $user = Auth::user();
        
        // Ensure user doesn't already have a company if that's the logic
        // For now, simple creation and assignment
        $company = Company::create($validated);
        
        $user->company_id = $company->id;
        $user->save();

        return redirect()->route('dashboard')->with('success', 'Empresa creada exitosamente.');
    }

    /**
     * Display the company settings form.
     */
    public function settings(): Response
    {
        $company = Auth::user()->company;

        if (!$company) {
            return redirect()->route('company.setup');
        }

        return Inertia::render('Company/Settings', [
            'company' => $company,
        ]);
    }

    /**
     * Update the specified company in storage.
     */
    public function update(Request $request)
    {
        $company = Auth::user()->company;
        
        if (!$company) {
            return redirect()->back()->with('error', 'No se encontró la empresa.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'rut' => 'required|string|max:20',
            'address' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
        ]);

        $company->update($validated);

        return redirect()->back()->with('success', 'Configuración actualizada exitosamente.');
    }
}

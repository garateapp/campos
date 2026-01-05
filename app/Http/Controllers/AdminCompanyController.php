<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AdminCompanyController extends Controller
{
    public function index(): Response
    {
        $companies = Company::orderBy('name')->get([
            'id',
            'name',
            'slug',
            'tax_id',
            'address',
            'phone',
            'email',
            'timezone',
            'currency',
            'is_active',
            'created_at',
        ]);

        return Inertia::render('Admin/Companies/Index', [
            'companies' => $companies,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:companies,slug',
            'tax_id' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'timezone' => 'nullable|string|max:100',
            'currency' => 'nullable|string|max:3',
            'is_active' => 'sometimes|boolean',
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        Company::create($validated + ['settings' => []]);

        return redirect()->back()->with('success', 'Compa\u00f1\u00eda creada.');
    }

    public function update(Request $request, Company $company)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:companies,slug,' . $company->id,
            'tax_id' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'timezone' => 'nullable|string|max:100',
            'currency' => 'nullable|string|max:3',
            'is_active' => 'sometimes|boolean',
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $company->update($validated);

        return redirect()->back()->with('success', 'Compa\u00f1\u00eda actualizada.');
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Worker;
use App\Models\Contractor;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class WorkerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $workers = Worker::where('company_id', Auth::user()->company_id)
            ->with('contractor')
            ->orderBy('name')
            ->get()
            ->map(function ($worker) {
                return [
                    'id' => $worker->id,
                    'name' => $worker->name,
                    'rut' => $worker->rut,
                    'phone' => $worker->phone,
                    'contractor_id' => $worker->contractor_id,
                    'contractor_name' => $worker->contractor ? $worker->contractor->business_name : 'Sin Contratista',
                    'is_identity_validated' => (bool) $worker->is_identity_validated,
                ];
            });

        $contractors = Contractor::where('company_id', Auth::user()->company_id)
            ->orderBy('business_name')
            ->get(['id', 'business_name']);

        return Inertia::render('MasterTables/Workers/Index', [
            'workers' => $workers,
            'contractors' => $contractors,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'rut' => 'required|string|max:20',
            'phone' => 'nullable|string|max:20',
            'contractor_id' => 'required|exists:contractors,id',
            'is_identity_validated' => 'boolean',
        ]);

        $validated['company_id'] = Auth::user()->company_id;

        Worker::create($validated);

        return redirect()->route('workers.index')->with('success', 'Jornalero creado exitosamente.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Worker $worker)
    {
        if ($worker->company_id !== Auth::user()->company_id) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'rut' => 'required|string|max:20',
            'phone' => 'nullable|string|max:20',
            'contractor_id' => 'required|exists:contractors,id',
            'is_identity_validated' => 'boolean',
        ]);

        $worker->update($validated);

        return redirect()->route('workers.index')->with('success', 'Jornalero actualizado exitosamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Worker $worker)
    {
        if ($worker->company_id !== Auth::user()->company_id) {
            abort(403);
        }

        $worker->delete();

        return redirect()->route('workers.index')->with('success', 'Jornalero eliminado exitosamente.');
    }
}

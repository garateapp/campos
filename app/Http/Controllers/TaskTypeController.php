<?php

namespace App\Http\Controllers;

use App\Models\TaskType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TaskTypeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('MasterTables/TaskTypes/Index', [
            'taskTypes' => TaskType::withCount('tasks')->orderBy('name')->get()
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        TaskType::create($validated);

        return back()->with('success', 'Tipo de tarea creado exitosamente.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, TaskType $taskType)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $taskType->update($validated);

        return back()->with('success', 'Tipo de tarea actualizado exitosamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(TaskType $taskType)
    {
        if ($taskType->tasks()->count() > 0) {
            return back()->with('error', 'No se puede eliminar el tipo de tarea porque tiene tareas asociadas.');
        }

        $taskType->delete();

        return back()->with('success', 'Tipo de tarea eliminado exitosamente.');
    }
}

<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class AttendanceController extends Controller
{

    public function index()
    {
        $fields = \App\Models\Field::where('company_id', \Illuminate\Support\Facades\Auth::user()->company_id)->orderBy('name')->get();
        $taskTypes = \App\Models\TaskType::all(); // Assuming task types are global or company scope

        return \Inertia\Inertia::render('Operations/Attendance/Index', [
            'fields' => $fields,
            'taskTypes' => $taskTypes,
        ]);
    }

    public function store(\Illuminate\Http\Request $request)
    {
        $request->validate([
            'card_code' => 'required|string',
            'date' => 'required|date',
            'field_id' => 'required|exists:fields,id',
            'task_type_id' => 'required|exists:task_types,id',
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

        // 3. Create Attendance
        // Check duplicate
        $exists = \App\Models\Attendance::where('company_id', $companyId)
            ->where('worker_id', $assignment->worker_id)
            ->where('date', $request->date)
            ->exists();

        if ($exists) {
            return back()->with('warning', $assignment->worker->name . ' ya está presente.');
        }

        \App\Models\Attendance::create([
            'company_id' => $companyId,
            'worker_id' => $assignment->worker_id,
            'date' => $request->date,
            'check_in_time' => now()->format('H:i:s'),
            'field_id' => $request->field_id,
            'task_type_id' => $request->task_type_id,
        ]);

        return back()->with('success', 'Asistencia registrada: ' . $assignment->worker->name);
    }
}

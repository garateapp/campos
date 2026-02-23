<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AttendanceController extends Controller
{

    public function index()
    {
        $user = \Illuminate\Support\Facades\Auth::user();
        $fieldIds = $user->fieldScopeIds();
        $fields = \App\Models\Field::where('company_id', $user->company_id)
            ->when($fieldIds !== null, fn ($q) => $q->whereIn('id', $fieldIds))
            ->orderBy('name')
            ->get();
        $taskTypes = \App\Models\TaskType::all(); // Assuming task types are global or company scope

        return \Inertia\Inertia::render('Operations/Attendance/Index', [
            'fields' => $fields,
            'taskTypes' => $taskTypes,
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
            'task_type_id' => 'required|exists:task_types,id',
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

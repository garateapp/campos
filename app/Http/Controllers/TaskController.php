<?php

namespace App\Http\Controllers;

use App\Models\Field;
use App\Models\Planting;
use App\Models\Task;
use App\Models\TaskType;
use App\Models\TaskAssignment;
use App\Models\TaskLog;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    /**
     * Display a listing of tasks.
     */
    public function index(Request $request): Response
    {
        $query = Task::with(['field', 'creator', 'assignedUsers', 'taskType']);

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by type
        if ($request->has('task_type_id') && $request->task_type_id !== 'all') {
            $query->where('task_type_id', $request->task_type_id);
        }

        // Filter by priority
        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }

        // Filter by date range
        if ($request->has('from')) {
            $query->where('due_date', '>=', $request->from);
        }
        if ($request->has('to')) {
            $query->where('due_date', '<=', $request->to);
        }

        $tasks = $query->orderBy('due_date')->get()->map(fn ($task) => [
            'id' => $task->id,
            'title' => $task->title,
            'description' => $task->description,
            'type' => $task->taskType?->name ?? 'Sin tipo',
            'priority' => $task->priority,
            'status' => $task->status,
            'due_date' => $task->due_date->format('Y-m-d'),
            'completed_date' => $task->completed_date?->format('Y-m-d'),
            'field_name' => $task->field?->name,
            'creator_name' => $task->creator->name,
            'assigned_users' => $task->assignedUsers->pluck('name'),
            'is_overdue' => $task->isOverdue(),
        ]);

        return Inertia::render('Tasks/Index', [
            'tasks' => $tasks,
            'filters' => $request->only(['status', 'task_type_id', 'priority', 'from', 'to']),
            'taskTypes' => TaskType::orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Show the form for creating a new task.
     */
    public function create(): Response
    {
        $fields = Field::orderBy('name')->get(['id', 'name']);
        $plantings = Planting::with('crop')
            ->whereNotIn('status', ['completed', 'failed'])
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'label' => "{$p->crop->name} - {$p->field->name} - CC:{$p->cc} ({$p->season})",
                'field_id' => $p->field_id,
            ]);
        $users = User::where('company_id', auth()->user()->company_id)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Tasks/Create', [
            'fields' => $fields,
            'plantings' => $plantings,
            'users' => $users,
            'taskTypes' => TaskType::orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Store a newly created task.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'field_id' => 'nullable|exists:fields,id',
            'planting_id' => 'nullable|exists:plantings,id',
            'task_type_id' => 'required|exists:task_types,id',
            'priority' => 'required|in:low,medium,high,urgent',
            'due_date' => 'required|date',
            'assigned_users' => 'nullable|array',
            'assigned_users.*' => 'exists:users,id',
            'metadata' => 'nullable|array',
        ]);

        $task = Task::create([
            'company_id' => auth()->user()->company_id,
            'created_by' => auth()->id(),
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'field_id' => $validated['field_id'] ?? null,
            'planting_id' => $validated['planting_id'] ?? null,
            'task_type_id' => $validated['task_type_id'],
            'priority' => $validated['priority'],
            'due_date' => $validated['due_date'],
            'metadata' => $validated['metadata'] ?? null,
        ]);

        // Create assignments
        if (!empty($validated['assigned_users'])) {
            foreach ($validated['assigned_users'] as $userId) {
                TaskAssignment::create([
                    'task_id' => $task->id,
                    'user_id' => $userId,
                ]);
            }
        }

        // Log task creation
        TaskLog::create([
            'task_id' => $task->id,
            'user_id' => auth()->id(),
            'action' => 'created',
            'logged_at' => now(),
        ]);

        return redirect()->route('tasks.index')->with('success', 'Tarea creada exitosamente.');
    }

    /**
     * Display the specified task.
     */
    public function show(Task $task): Response
    {
        $task->load(['field', 'planting.crop', 'creator', 'assignments.user', 'logs.user', 'taskType']);

        return Inertia::render('Tasks/Show', [
            'task' => [
                'id' => $task->id,
                'title' => $task->title,
                'description' => $task->description,
                'type' => $task->taskType?->name ?? 'Sin tipo',
                'priority' => $task->priority,
                'status' => $task->status,
                'due_date' => $task->due_date->format('Y-m-d'),
                'completed_date' => $task->completed_date?->format('Y-m-d'),
                'field' => $task->field,
                'planting' => $task->planting ? [
                    'id' => $task->planting->id,
                    'crop_name' => $task->planting->crop->name,
                    'season' => $task->planting->season,
                ] : null,
                'creator' => $task->creator,
                'assignments' => $task->assignments->map(fn ($a) => [
                    'id' => $a->id,
                    'user' => $a->user,
                    'status' => $a->status,
                    'started_at' => $a->started_at?->format('Y-m-d H:i'),
                    'completed_at' => $a->completed_at?->format('Y-m-d H:i'),
                ]),
                'logs' => $task->logs->map(fn ($l) => [
                    'id' => $l->id,
                    'action' => $l->action,
                    'note' => $l->note,
                    'user_name' => $l->user->name,
                    'logged_at' => $l->logged_at->format('Y-m-d H:i'),
                    'data' => $l->data,
                ]),
                'metadata' => $task->metadata,
                'is_overdue' => $task->isOverdue(),
            ],
        ]);
    }

    /**
     * Show the form for editing the specified task.
     */
    public function edit(Task $task): Response
    {
        $task->load('assignments');

        $fields = Field::orderBy('name')->get(['id', 'name']);
        $plantings = Planting::with('crop', 'field')
            ->whereNotIn('status', ['completed', 'failed'])
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'label' => "{$p->crop->name} - {$p->field->name} ({$p->season})",
                'field_id' => $p->field_id,
            ]);
        $users = User::where('company_id', auth()->user()->company_id)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Tasks/Edit', [
            'task' => [
                ...$task->toArray(),
                'due_date' => $task->due_date->format('Y-m-d'),
                'assigned_users' => $task->assignments->pluck('user_id'),
            ],
            'fields' => $fields,
            'plantings' => $plantings,
            'users' => $users,
            'taskTypes' => TaskType::orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Update the specified task.
     */
    public function update(Request $request, Task $task)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'field_id' => 'nullable|exists:fields,id',
            'planting_id' => 'nullable|exists:plantings,id',
            'task_type_id' => 'required|exists:task_types,id',
            'priority' => 'required|in:low,medium,high,urgent',
            'due_date' => 'required|date',
            'assigned_users' => 'nullable|array',
            'assigned_users.*' => 'exists:users,id',
        ]);

        $task->update([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'field_id' => $validated['field_id'] ?? null,
            'planting_id' => $validated['planting_id'] ?? null,
            'task_type_id' => $validated['task_type_id'],
            'priority' => $validated['priority'],
            'due_date' => $validated['due_date'],
        ]);

        // Sync assignments
        if (isset($validated['assigned_users'])) {
            $existingUserIds = $task->assignments->pluck('user_id')->toArray();
            $newUserIds = $validated['assigned_users'];

            // Remove old assignments
            $task->assignments()->whereNotIn('user_id', $newUserIds)->delete();

            // Add new assignments
            foreach (array_diff($newUserIds, $existingUserIds) as $userId) {
                TaskAssignment::create([
                    'task_id' => $task->id,
                    'user_id' => $userId,
                ]);
            }
        }

        return redirect()->route('tasks.show', $task)->with('success', 'Tarea actualizada.');
    }

    /**
     * Update task status.
     */
    public function updateStatus(Request $request, Task $task)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,in_progress,completed,cancelled',
        ]);

        $oldStatus = $task->status;
        $task->update([
            'status' => $validated['status'],
            'completed_date' => $validated['status'] === 'completed' ? now() : null,
        ]);

        // Log status change
        TaskLog::create([
            'task_id' => $task->id,
            'user_id' => auth()->id(),
            'action' => $validated['status'],
            'data' => ['old_status' => $oldStatus],
            'logged_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Estado actualizado.');
    }

    /**
     * Add users to task.
     */
    public function assign(Request $request, Task $task)
    {
        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        foreach ($validated['user_ids'] as $userId) {
            TaskAssignment::firstOrCreate([
                'task_id' => $task->id,
                'user_id' => $userId,
            ]);
        }

        return redirect()->back()->with('success', 'Usuarios asignados.');
    }

    /**
     * Store a task log entry.
     */
    public function storeLog(Request $request, Task $task)
    {
        $validated = $request->validate([
            'action' => 'required|string|max:50',
            'note' => 'nullable|string|max:2000',
            'data' => 'nullable|array',
            'client_uuid' => 'nullable|string|max:36',
            'logged_at' => 'nullable|date',
        ]);

        // Check for duplicate (offline sync)
        if (!empty($validated['client_uuid'])) {
            if (TaskLog::wasAlreadySynced($validated['client_uuid'])) {
                return response()->json(['status' => 'already_synced']);
            }
        }

        TaskLog::create([
            'task_id' => $task->id,
            'user_id' => auth()->id(),
            'action' => $validated['action'],
            'note' => $validated['note'] ?? null,
            'data' => $validated['data'] ?? null,
            'client_uuid' => $validated['client_uuid'] ?? null,
            'logged_at' => $validated['logged_at'] ?? now(),
        ]);

        return redirect()->back()->with('success', 'Log registrado.');
    }

    /**
     * Remove the specified task.
     */
    public function destroy(Task $task)
    {
        $task->delete();

        return redirect()->route('tasks.index')->with('success', 'Tarea eliminada.');
    }

    /**
     * Sync offline data.
     */
    public function sync(Request $request)
    {
        $validated = $request->validate([
            'operations' => 'required|array',
            'operations.*.uuid' => 'required|string',
            'operations.*.entity' => 'required|in:task_log',
            'operations.*.action' => 'required|in:create',
            'operations.*.data' => 'required|array',
            'operations.*.timestamp' => 'required|integer',
        ]);

        $results = [];

        foreach ($validated['operations'] as $operation) {
            // Check if already synced
            if (TaskLog::wasAlreadySynced($operation['uuid'])) {
                $results[] = [
                    'uuid' => $operation['uuid'],
                    'status' => 'already_synced',
                ];
                continue;
            }

            if ($operation['entity'] === 'task_log') {
                $data = $operation['data'];

                $task = Task::find($data['task_id']);
                if (!$task) {
                    $results[] = [
                        'uuid' => $operation['uuid'],
                        'status' => 'error',
                        'message' => 'Task not found',
                    ];
                    continue;
                }

                TaskLog::create([
                    'task_id' => $data['task_id'],
                    'user_id' => auth()->id(),
                    'action' => $data['action'],
                    'note' => $data['note'] ?? null,
                    'data' => $data['data'] ?? null,
                    'client_uuid' => $operation['uuid'],
                    'logged_at' => \Carbon\Carbon::createFromTimestamp($operation['timestamp'] / 1000),
                ]);

                $results[] = [
                    'uuid' => $operation['uuid'],
                    'status' => 'synced',
                ];
            }
        }

        return response()->json(['results' => $results]);
    }
}

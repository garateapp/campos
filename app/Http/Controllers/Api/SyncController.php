<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Worker;
use App\Models\Contractor;
use App\Models\Field;
use App\Models\Species;
use App\Models\HarvestContainer;
use App\Models\Card;
use App\Models\CardAssignment;
use App\Models\Attendance;
use App\Models\HarvestCollection;
use App\Models\Crop;
use App\Models\Planting;
use App\Models\Input;
use App\Models\Cost;
use App\Models\LaborPlanning;
use App\Models\Variety;
use App\Models\Task;
use App\Models\TaskType;
use App\Models\TaskAssignment;
use App\Models\LaborType;
use App\Models\UnitOfMeasure;
use App\Models\Task;
use App\Models\TaskType;
use App\Models\TaskAssignment;
use App\Models\LaborType;
use App\Models\UnitOfMeasure;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class SyncController extends Controller
{
    public function download(Request $request)
    {
        // Simple full dump strategy for V1
        // In V2 we can implement last_sync_at parameter
        try{
        $companyId = $request->user()->company_id ?? 1; // Fallback or auth check

        return response()->json([
            'workers' => Worker::where('company_id', $companyId)->get(),
            'contractors' => Contractor::where('company_id', $companyId)->get(),
            'fields' => Field::where('company_id', $companyId)->get(),
            'species' => Species::where('company_id', $companyId)->with('harvestContainers')->get(),
            'varieties' => Variety::where('company_id', $companyId)->get(['id', 'name', 'species_id']),
            'harvest_containers' => HarvestContainer::where('company_id', $companyId)->get(),
            'cards' => Card::where('company_id', $companyId)->get(),
            'card_assignments' => CardAssignment::where('company_id', $companyId)
                ->where('date', '>=', now()->subDays(2)) // Only recent assignments
                ->get(),
            'crops' => Crop::where('company_id', $companyId)
                ->get(['id', 'name', 'field_id', 'species_id', 'variety_id', 'variety', 'notes'])
                ->map(function ($crop) {
                    return [
                        'id' => $crop->id,
                        'name' => $crop->name,
                        'field_id' => $crop->field_id,
                        'species' => $crop->variety ?? null,
                        'species_id' => $crop->species_id,
                        'variety' => $crop->variety,
                        'variety_id' => $crop->variety_id,
                        'area' => null,
                        'season' => null,
                        'notes' => $crop->notes,
                    ];
                })->values(),
            'plantings' => Planting::with('crop')
                ->where('company_id', $companyId)
                ->orderByDesc('planted_date')
                ->get()
                ->map(function ($planting) {
                    return [
                        'id' => $planting->id,
                        'crop_name' => $planting->crop?->name ?? null,
                        'field_id' => $planting->field_id,
                        'planting_date' => optional($planting->planted_date)->toDateString(),
                        'density' => $planting->plants_count,
                        'notes' => $planting->notes,
                    ];
                })->values(),
            'supplies' => Input::where('company_id', $companyId)
                ->get(['id', 'name', 'unit', 'current_stock as quantity', 'unit_cost', 'field_id'])
                ->map(function ($input) {
                    return [
                        'id' => $input->id,
                        'name' => $input->name,
                        'unit' => $input->unit,
                        'quantity' => $input->quantity ?? 0,
                        'unit_cost' => $input->unit_cost ?? 0,
                        'field_id' => $input->field_id,
                    ];
                })->values(),
            'direct_costs' => Cost::where('company_id', $companyId)
                ->where(function ($q) {
                    $q->whereNull('type')->orWhere('type', 'direct');
                })
                ->orderByDesc('cost_date')
                ->get(['id', 'field_id', 'category', 'amount', 'cost_date', 'notes'])
                ->map(function ($cost) {
                    return [
                        'id' => $cost->id,
                        'field_id' => $cost->field_id,
                        'category' => $cost->category ?? 'directo',
                        'amount' => $cost->amount ?? 0,
                        'date' => optional($cost->cost_date)->toDateString(),
                        'notes' => $cost->notes,
                    ];
                })->values(),
            'labor_plans' => LaborPlanning::where('company_id', $companyId)
                ->orderByDesc('year')
                ->orderByDesc('month')
                ->limit(120)
                ->get(['id', 'field_id', 'labor_name', 'year', 'month', 'num_jh_planned', 'total_jh_planned', 'notes'])
                ->map(function ($plan) {
                    $date = Carbon::create($plan->year, $plan->month, 1);
                    return [
                        'id' => $plan->id,
                        'field_id' => $plan->field_id,
                        'task' => $plan->labor_name,
                        'scheduled_date' => $date->toDateString(),
                        'workers_needed' => $plan->num_jh_planned,
                        'hours' => $plan->total_jh_planned,
                        'notes' => $plan->notes ?? null,
                    ];
                })->values(),
            'task_types' => TaskType::all(['id', 'name']),
            'labor_types' => LaborType::all(['id', 'name']),
            'unit_of_measures' => UnitOfMeasure::all(['id', 'name', 'code']),
            'tasks' => Task::where('company_id', $companyId)
                ->orderByDesc('scheduled_date')
                ->limit(200)
                ->get(['id', 'name', 'field_id', 'task_type_id', 'scheduled_date', 'status', 'notes'])
                ->values(),
            'task_assignments' => TaskAssignment::whereIn('task_id', Task::where('company_id', $companyId)->pluck('id'))
                ->get(['id', 'task_id', 'worker_id', 'hours'])
                ->values(),
            'server_time' => now()->toIso8601String(),
        ]);
        } catch (\Exception $e) {
            report($e);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function upload(Request $request)
    {
        $payload = $request->validate([
            'attendances' => 'array',
            'collections' => 'array',
            'card_assignments' => 'array',
            'crops' => 'array',
            'plantings' => 'array',
            'supplies' => 'array',
            'direct_costs' => 'array',
            'labor_plans' => 'array',
            'tasks' => 'array',
            'task_assignments' => 'array',
            'workers' => 'array',
        ]);

        $companyId = $request->user()->company_id ?? 1;

        DB::beginTransaction();
        try {
            $processed = [
                'attendances' => 0,
                'collections' => 0,
                'assignments' => 0,
                'crops' => 0,
                'plantings' => 0,
                'supplies' => 0,
                'direct_costs' => 0,
                'labor_plans' => 0,
                'tasks' => 0,
                'task_assignments' => 0,
                'workers' => 0,
            ];

            if (!empty($payload['card_assignments'])) {
                foreach ($payload['card_assignments'] as $record) {
                    CardAssignment::firstOrCreate(
                        [
                            'company_id' => $companyId,
                            'worker_id' => $record['worker_id'],
                            'date' => $record['date'],
                        ],
                        [
                            'card_id' => $record['card_id'],
                        ]
                    );
                    $processed['assignments']++;
                }
            }

            if (!empty($payload['attendances'])) {
                foreach ($payload['attendances'] as $record) {
                    Attendance::firstOrCreate(
                        [
                            'company_id' => $companyId,
                            'worker_id' => $record['worker_id'],
                            'date' => $record['date'],
                        ],
                        [
                            'check_in_time' => $record['check_in_time'],
                            'field_id' => $record['field_id'] ?? null,
                            'task_type_id' => $record['task_type_id'] ?? null,
                        ]
                    );
                    $processed['attendances']++;
                }
            }

            if (!empty($payload['collections'])) {
                foreach ($payload['collections'] as $record) {
                    HarvestCollection::create([
                        'company_id' => $companyId,
                        'worker_id' => $record['worker_id'],
                        'date' => $record['date'],
                        'harvest_container_id' => $record['harvest_container_id'],
                        'quantity' => $record['quantity'],
                        'field_id' => $record['field_id'] ?? null,
                    ]);
                    $processed['collections']++;
                }
            }

            if (!empty($payload['crops'])) {
                foreach ($payload['crops'] as $record) {
                    Crop::firstOrCreate(
                        [
                            'company_id' => $companyId,
                            'name' => $record['name'] ?? 'Cultivo',
                            'field_id' => $record['field_id'] ?? null,
                        ],
                        [
                            'species_id' => null,
                            'variety' => $record['species'] ?? null,
                            'notes' => $record['notes'] ?? null,
                        ]
                    );
                    $processed['crops']++;
                }
            }

            if (!empty($payload['plantings'])) {
                foreach ($payload['plantings'] as $record) {
                    $crop = null;
                    if (!empty($record['crop_name'])) {
                        $crop = Crop::firstOrCreate(
                            [
                                'company_id' => $companyId,
                                'name' => $record['crop_name'],
                            ],
                            [
                                'field_id' => $record['field_id'] ?? null,
                            ]
                        );
                    }

                    Planting::firstOrCreate(
                        [
                            'company_id' => $companyId,
                            'crop_id' => $crop?->id,
                            'field_id' => $record['field_id'] ?? null,
                            'planted_date' => $record['planting_date'] ?? now(),
                        ],
                        [
                            'plants_count' => $record['density'] ?? null,
                            'notes' => $record['notes'] ?? null,
                        ]
                    );
                    $processed['plantings']++;
                }
            }

            if (!empty($payload['supplies'])) {
                foreach ($payload['supplies'] as $record) {
                    Input::updateOrCreate(
                        [
                            'company_id' => $companyId,
                            'name' => $record['name'] ?? 'Insumo',
                        ],
                        [
                            'field_id' => $record['field_id'] ?? null,
                            'unit' => $record['unit'] ?? null,
                            'current_stock' => $record['quantity'] ?? 0,
                            'unit_cost' => $record['unit_cost'] ?? 0,
                        ]
                    );
                    $processed['supplies']++;
                }
            }

            if (!empty($payload['direct_costs'])) {
                foreach ($payload['direct_costs'] as $record) {
                    Cost::create([
                        'company_id' => $companyId,
                        'field_id' => $record['field_id'] ?? null,
                        'type' => 'direct',
                        'category' => $record['category'] ?? 'Directo',
                        'amount' => $record['amount'] ?? 0,
                        'cost_date' => $record['date'] ?? now(),
                        'notes' => $record['notes'] ?? null,
                    ]);
                    $processed['direct_costs']++;
                }
            }

            if (!empty($payload['labor_plans'])) {
                foreach ($payload['labor_plans'] as $record) {
                    $date = !empty($record['scheduled_date'])
                        ? Carbon::parse($record['scheduled_date'])
                        : now();

                    LaborPlanning::create([
                        'company_id' => $companyId,
                        'year' => (int) $date->format('Y'),
                        'month' => (int) $date->format('n'),
                        'field_id' => $record['field_id'] ?? null,
                        'labor_name' => $record['task'] ?? 'Labor',
                        'num_jh_planned' => $record['workers_needed'] ?? null,
                        'total_jh_planned' => $record['hours'] ?? null,
                        'notes' => $record['notes'] ?? null,
                    ]);
                    $processed['labor_plans']++;
                }
            }

            if (!empty($payload['tasks'])) {
                foreach ($payload['tasks'] as $record) {
                    $task = Task::updateOrCreate(
                        [
                            'company_id' => $companyId,
                            'id' => $record['id'] ?? null,
                            'name' => $record['name'] ?? 'Tarea',
                        ],
                        [
                            'field_id' => $record['field_id'] ?? null,
                            'task_type_id' => $record['task_type_id'] ?? null,
                            'scheduled_date' => $record['scheduled_date'] ?? now(),
                            'status' => $record['status'] ?? 'pendiente',
                            'notes' => $record['notes'] ?? null,
                        ]
                    );
                    $processed['tasks']++;

                    if (!empty($record['assignments']) && is_array($record['assignments'])) {
                        foreach ($record['assignments'] as $assign) {
                            TaskAssignment::updateOrCreate(
                                [
                                    'task_id' => $task->id,
                                    'worker_id' => $assign['worker_id'] ?? null,
                                ],
                                [
                                    'hours' => $assign['hours'] ?? null,
                                ]
                            );
                            $processed['task_assignments']++;
                        }
                    }
                }
            }

            if (!empty($payload['task_assignments'])) {
                foreach ($payload['task_assignments'] as $record) {
                    TaskAssignment::updateOrCreate(
                        [
                            'id' => $record['id'] ?? null,
                        ],
                        [
                            'task_id' => $record['task_id'] ?? null,
                            'worker_id' => $record['worker_id'] ?? null,
                            'hours' => $record['hours'] ?? null,
                        ]
                    );
                    $processed['task_assignments']++;
                }
            }

            if (!empty($payload['workers'])) {
                foreach ($payload['workers'] as $record) {
                    Worker::updateOrCreate(
                        [
                            'company_id' => $companyId,
                            'id' => $record['id'] ?? null,
                            'rut' => $record['rut'] ?? null,
                        ],
                        [
                            'name' => $record['name'] ?? 'Jornalero',
                            'contractor_id' => $record['contractor_id'] ?? null,
                        ]
                    );
                    $processed['workers']++;
                }
            }

            DB::commit();
            return response()->json(['status' => 'success', 'processed' => $processed]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::channel('single')->error('Sync upload failed', [
                'message' => $e->getMessage(),
                'exception' => get_class($e),
            ]);
            report($e);
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }
}

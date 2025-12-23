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

class SyncController extends Controller
{
    public function download(Request $request)
    {
        // Simple full dump strategy for V1
        // In V2 we can implement last_sync_at parameter
        
        $companyId = $request->user()->company_id ?? 1; // Fallback or auth check

        return response()->json([
            'workers' => Worker::where('company_id', $companyId)->get(),
            'contractors' => Contractor::where('company_id', $companyId)->get(),
            'fields' => Field::where('company_id', $companyId)->get(),
            'species' => Species::where('company_id', $companyId)->with('harvestContainers')->get(),
            'harvest_containers' => HarvestContainer::where('company_id', $companyId)->get(),
            'cards' => Card::where('company_id', $companyId)->get(),
            'card_assignments' => CardAssignment::where('company_id', $companyId)
                ->where('date', '>=', now()->subDays(2)) // Only recent assignments
                ->get(),
            'server_time' => now()->toIso8601String(),
        ]);
    }

    public function upload(Request $request)
    {
        $payload = $request->validate([
            'attendances' => 'array',
            'collections' => 'array',
        ]);

        $companyId = $request->user()->company_id ?? 1;

        DB::beginTransaction();
        try {
            $processed = ['attendances' => 0, 'collections' => 0, 'assignments' => 0];

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

            DB::commit();
            return response()->json(['status' => 'success', 'processed' => $processed]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }
}

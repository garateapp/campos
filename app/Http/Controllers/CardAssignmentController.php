<?php

namespace App\Http\Controllers;

use App\Models\Card;
use App\Models\Worker;
use App\Models\CardAssignment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CardAssignmentController extends Controller
{
    public function index(Request $request)
    {
        $date = $request->input('date', Carbon::today()->toDateString());
        $companyId = Auth::user()->company_id;

        // Fetch all active workers with their contractors
        $workers = Worker::where('company_id', $companyId)
            ->with(['contractor', 'company'])
            ->orderBy('name')
            ->get();

        // Fetch assignments for the selected date
        $assignments = CardAssignment::where('company_id', $companyId)
            ->whereDate('date', $date)
            ->get()
            ->keyBy('worker_id');

        // Fetch all active cards
        $cards = Card::where('company_id', $companyId)
            ->where('status', 'active')
            ->orderBy('code')
            ->get();

        return Inertia::render('Operations/CardAssignments/Index', [
            'workers' => $workers,
            'cards' => $cards,
            'assignments' => $assignments,
            'date' => $date,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'assignments' => 'array',
            'assignments.*.worker_id' => 'required|exists:workers,id',
            'assignments.*.card_id' => 'nullable|exists:cards,id',
        ]);

        $companyId = Auth::user()->company_id;
        $date = $request->date;

        DB::transaction(function () use ($companyId, $date, $request) {
            // Clear existing assignments for this day (or update? simpler to sync)
            // Strategy: delete all for this company+date, then insert new ones.
            // Or upsert. Let's iterate and update/create.
            
            // Actually, if we send the whole state, we can sync.
            // But usually user changes one by one or batch saves.
            // Let's assume batch save of the whole grid for now, or just processing the changes.
            // For simplicity in this first version, we'll iterate the submitted assignments.
            // If card_id is null, delete assignment. If set, update or create.

            foreach ($request->assignments as $assignment) {
                if (empty($assignment['card_id'])) {
                    CardAssignment::where('company_id', $companyId)
                        ->where('date', $date)
                        ->where('worker_id', $assignment['worker_id'])
                        ->delete();
                } else {
                    CardAssignment::updateOrCreate(
                        [
                            'company_id' => $companyId,
                            'date' => $date,
                            'worker_id' => $assignment['worker_id'],
                        ],
                        [
                            'card_id' => $assignment['card_id']
                        ]
                    );
                }
            }
        });

        return redirect()->back()->with('success', 'Asignaciones guardadas.');
    }

    public function copyPrevious(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
        ]);

        $companyId = Auth::user()->company_id;
        $targetDate = Carbon::parse($request->date);
        $previousDate = $targetDate->copy()->subDay();

        $previousAssignments = CardAssignment::where('company_id', $companyId)
            ->whereDate('date', $previousDate)
            ->get();

        if ($previousAssignments->isEmpty()) {
            return redirect()->back()->with('error', 'No hay asignaciones del día anterior para copiar.');
        }

        DB::transaction(function () use ($companyId, $targetDate, $previousAssignments) {
            foreach ($previousAssignments as $prev) {
                // Check if assignment already exists for target date
                $exists = CardAssignment::where('company_id', $companyId)
                    ->where('date', $targetDate)
                    ->where('worker_id', $prev->worker_id)
                    ->exists();

                if (!$exists) {
                    CardAssignment::create([
                        'company_id' => $companyId,
                        'date' => $targetDate->toDateString(),
                        'worker_id' => $prev->worker_id,
                        'card_id' => $prev->card_id,
                    ]);
                }
            }
        });

        return redirect()->back()->with('success', 'Asignaciones copiadas del día anterior.');
    }
}

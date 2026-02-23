<?php

namespace App\Http\Controllers;

use App\Models\Cost;
use App\Models\Field;
use App\Models\Harvest;
use App\Models\Planting;
use App\Models\Task;
use App\Models\Input;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the dashboard with key metrics.
     */
    public function index(): Response
    {
        $user = auth()->user();
        $company = $user->company;
        $fieldIds = $user->fieldScopeIds();

        // Get current season (e.g., "2024-2025")
        $currentYear = now()->year;
        $currentSeason = now()->month >= 7 
            ? "{$currentYear}-" . ($currentYear + 1)
            : ($currentYear - 1) . "-{$currentYear}";

        // Field stats
        $fieldsQuery = Field::query();
        if ($fieldIds !== null) {
            $fieldsQuery->whereIn('id', $fieldIds);
        }
        $fieldsCount = $fieldsQuery->count();
        $totalHectares = $fieldsQuery->sum('area_hectares');

        // Active plantings
        $plantingsQuery = Planting::whereNotIn('status', ['completed', 'failed']);
        if ($fieldIds !== null) {
            $plantingsQuery->whereIn('field_id', $fieldIds);
        }
        $activePlantings = $plantingsQuery->count();

        // Tasks stats (respect assignment visibility)
        $taskQuery = Task::query();
        if (!$user->isSuperAdmin()) {
            $taskQuery->whereHas('assignments', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        }
        if ($fieldIds !== null) {
            $taskQuery->where(function ($q) use ($fieldIds) {
                $q->whereIn('field_id', $fieldIds)
                    ->orWhereHas('planting', function ($planting) use ($fieldIds) {
                        $planting->whereIn('field_id', $fieldIds);
                    });
            });
        }

        $pendingTasks = (clone $taskQuery)->where('status', 'pending')->count();
        $overdueTasks = (clone $taskQuery)->where('status', '!=', 'completed')
            ->where('status', '!=', 'cancelled')
            ->where('due_date', '<', now()->startOfDay())
            ->count();
        $tasksCompletedThisMonth = (clone $taskQuery)->where('status', 'completed')
            ->whereMonth('completed_date', now()->month)
            ->whereYear('completed_date', now()->year)
            ->count();

        // Recent tasks
        $recentTasks = (clone $taskQuery)->with(['field', 'creator'])
            ->orderBy('due_date')
            ->limit(5)
            ->get()
            ->map(fn ($task) => [
                'id' => $task->id,
                'title' => $task->title,
                'type' => $task->type,
                'priority' => $task->priority,
                'status' => $task->status,
                'due_date' => $task->due_date->format('Y-m-d'),
                'field_name' => $task->field?->name,
                'is_overdue' => $task->isOverdue(),
            ]);

        // Financial summary (current month)
        $costsQuery = Cost::whereMonth('cost_date', now()->month)
            ->whereYear('cost_date', now()->year)
            ->when($fieldIds !== null, function ($q) use ($fieldIds) {
                $q->whereIn('field_id', $fieldIds)
                    ->orWhereHas('planting', function ($planting) use ($fieldIds) {
                        $planting->whereIn('field_id', $fieldIds);
                    });
            });
        $costsThisMonth = $costsQuery->sum('amount');

        $harvestsThisMonth = Harvest::whereMonth('harvest_date', now()->month)
            ->whereYear('harvest_date', now()->year)
            ->when($fieldIds !== null, function ($q) use ($fieldIds) {
                $q->whereHas('planting', function ($planting) use ($fieldIds) {
                    $planting->whereIn('field_id', $fieldIds);
                });
            })
            ->get();
        
        $revenueThisMonth = $harvestsThisMonth->sum(fn ($h) => $h->quantity_kg * ($h->price_per_kg ?? 0));
        $harvestKgThisMonth = $harvestsThisMonth->sum('quantity_kg');

        // Low stock alerts
        $lowStockInputs = Input::whereColumn('current_stock', '<=', 'min_stock_alert')
            ->whereNotNull('min_stock_alert')
            ->when($fieldIds !== null, fn ($q) => $q->whereIn('field_id', $fieldIds))
            ->get()
            ->map(fn ($input) => [
                'id' => $input->id,
                'name' => $input->name,
                'current_stock' => $input->current_stock,
                'min_stock' => $input->min_stock_alert,
                'unit' => $input->unit,
            ]);

        return Inertia::render('Dashboard/Index', [
            'company' => [
                'name' => $company->name,
                'currency' => $company->currency,
            ],
            'stats' => [
                'fieldsCount' => $fieldsCount,
                'totalHectares' => round($totalHectares, 2),
                'activePlantings' => $activePlantings,
                'pendingTasks' => $pendingTasks,
                'overdueTasks' => $overdueTasks,
                'tasksCompletedThisMonth' => $tasksCompletedThisMonth,
            ],
            'financial' => [
                'costsThisMonth' => round($costsThisMonth, 0),
                'revenueThisMonth' => round($revenueThisMonth, 0),
                'harvestKgThisMonth' => round($harvestKgThisMonth, 2),
                'netThisMonth' => round($revenueThisMonth - $costsThisMonth, 0),
            ],
            'recentTasks' => $recentTasks,
            'lowStockAlerts' => $lowStockInputs,
            'currentSeason' => $currentSeason,
        ]);
    }
}

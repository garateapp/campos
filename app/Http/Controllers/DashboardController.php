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

        // Get current season (e.g., "2024-2025")
        $currentYear = now()->year;
        $currentSeason = now()->month >= 7 
            ? "{$currentYear}-" . ($currentYear + 1)
            : ($currentYear - 1) . "-{$currentYear}";

        // Field stats
        $fieldsCount = Field::count();
        $totalHectares = Field::sum('area_hectares');

        // Active plantings
        $activePlantings = Planting::whereNotIn('status', ['completed', 'failed'])->count();

        // Tasks stats
        $pendingTasks = Task::where('status', 'pending')->count();
        $overdueTasks = Task::where('status', '!=', 'completed')
            ->where('status', '!=', 'cancelled')
            ->where('due_date', '<', now()->startOfDay())
            ->count();
        $tasksCompletedThisMonth = Task::where('status', 'completed')
            ->whereMonth('completed_date', now()->month)
            ->whereYear('completed_date', now()->year)
            ->count();

        // Recent tasks
        $recentTasks = Task::with(['field', 'creator'])
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
        $costsThisMonth = Cost::whereMonth('cost_date', now()->month)
            ->whereYear('cost_date', now()->year)
            ->sum('amount');

        $harvestsThisMonth = Harvest::whereMonth('harvest_date', now()->month)
            ->whereYear('harvest_date', now()->year)
            ->get();
        
        $revenueThisMonth = $harvestsThisMonth->sum(fn ($h) => $h->quantity_kg * ($h->price_per_kg ?? 0));
        $harvestKgThisMonth = $harvestsThisMonth->sum('quantity_kg');

        // Low stock alerts
        $lowStockInputs = Input::whereColumn('current_stock', '<=', 'min_stock_alert')
            ->whereNotNull('min_stock_alert')
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

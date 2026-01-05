<?php

namespace App\Http\Controllers;

use App\Models\Cost;
use App\Models\Field;
use App\Models\Harvest;
use App\Models\LaborPlanning;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AnalyticsController extends Controller
{
    public function index(Request $request)
    {
        $currentYear = $request->input('year', date('Y'));
        $previousYear = $currentYear - 1;

        // 1. Harvest Trends (Monthly) - Current vs Previous
        $harvestsCurrent = Harvest::selectRaw('MONTH(harvest_date) as month, SUM(quantity_kg) as total')
            ->whereYear('harvest_date', $currentYear)
            ->groupBy('month')
            ->pluck('total', 'month')
            ->toArray();

        $harvestsPrev = Harvest::selectRaw('MONTH(harvest_date) as month, SUM(quantity_kg) as total')
            ->whereYear('harvest_date', $previousYear)
            ->groupBy('month')
            ->pluck('total', 'month')
            ->toArray();

        $monthlyData = [];
        for ($i = 1; $i <= 12; $i++) {
            $monthlyData['labels'][] = date('F', mktime(0, 0, 0, $i, 10)); // Month name
            $monthlyData['current'][] = $harvestsCurrent[$i] ?? 0;
            $monthlyData['previous'][] = $harvestsPrev[$i] ?? 0;
        }

        // 2. Efficiency per Field (Yield kg/ha)
        $fields = Field::with('plantings')->get();
        $efficiencyData = $fields->map(function ($field) use ($currentYear) {
            // Get total harvest for this field in current year
            $harvestTotal = Harvest::whereHas('planting', function ($q) use ($field) {
                $q->where('field_id', $field->id);
            })->whereYear('harvest_date', $currentYear)->sum('quantity_kg');

            $yieldPerHa = $field->area_hectares > 0 ? $harvestTotal / $field->area_hectares : 0;

            return [
                'field' => $field->name,
                'yield' => round($yieldPerHa, 2),
            ];
        })->sortByDesc('yield')->take(10)->values(); // Top 10

        // 3. Cost Distribution
        $costs = Cost::selectRaw('type, SUM(amount) as total')
            ->whereYear('cost_date', $currentYear)
            ->groupBy('type')
            ->get();

        $costData = [
            'labels' => $costs->pluck('type'),
            'data' => $costs->pluck('total'),
        ];

        return Inertia::render('Analytics/Index', [
            'trends' => $monthlyData,
            'efficiency' => $efficiencyData,
            'costs' => $costData,
            'filters' => ['year' => (int)$currentYear],
        ]);
    }
}

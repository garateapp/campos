<?php

namespace App\Services;

use App\Models\Cost;
use App\Models\Field;
use App\Models\Harvest;
use App\Models\InputUsage;
use App\Models\LaborPlanning;
use Illuminate\Support\Facades\DB;

class ProfitabilityService
{
    public function getFieldProfitability(int $year, ?array $fieldIds = null)
    {
        // Get all fields with their latest planting for that year (or just current)
        $fields = Field::with(['plantings' => function($q) use ($year) {
            $q->where('season', 'like', "%{$year}%")
              ->with(['crop.species', 'crop.varietyEntity']);
        }])
            ->when($fieldIds !== null, fn ($q) => $q->whereIn('id', $fieldIds))
            ->get();
        
        $results = $fields->map(function ($field) use ($year) {
            // Get the specific planting for this year context
            $planting = $field->plantings->first();
            $cropName = 'Sin Cuartel';
            
            if ($planting && $planting->crop) {
                $species = $planting->crop->species->name ?? $planting->crop->name;
                $variety = $planting->crop->varietyEntity->name ?? $planting->crop->variety ?? '';
                $cropName = $variety ? "{$species} ({$variety})" : $species;
            }

            // 1. Calculate Income (Harvests)
            $income = Harvest::whereHas('planting', function($q) use ($field) {
                    $q->where('field_id', $field->id);
                })
                ->whereYear('harvest_date', $year)
                ->get()
                ->sum(function ($harvest) {
                    return $harvest->quantity_kg * ($harvest->price_per_kg ?? 0);
                });
            
            // ... (rest of the calculation logic omitted for brevity in replacement, but I will include it to ensure completeness)
            // Actually, I should replace lines 30-65 to keep the logic intact but with the fix.
            
            // 2. Calculate Labor Costs (from LaborPlanning Actuals)
            $laborCost = LaborPlanning::where('field_id', $field->id)
                ->where('year', $year)
                ->sum('total_value_actual');

            // 3. Calculate Input Costs (from InputUsage)
            $inputCost = InputUsage::where('field_id', $field->id)
                ->whereYear('usage_date', $year)
                ->sum('total_cost');

            // 4. Other Costs
            $otherCost = Cost::where('field_id', $field->id)
                ->whereYear('cost_date', $year)
                ->whereNotIn('type', ['labor', 'input'])
                ->sum('amount');

            $totalCost = $laborCost + $inputCost + $otherCost;
            $margin = $income - $totalCost;
            $marginPercent = $income > 0 ? ($margin / $income) * 100 : 0;

            return [
                'field_id' => $field->id,
                'field_name' => $field->name,
                'crop_name' => $cropName,
                'area' => $field->area_hectares,
                'income' => $income,
                'costs' => [
                    'labor' => $laborCost,
                    'inputs' => $inputCost,
                    'other' => $otherCost,
                    'total' => $totalCost
                ],
                'margin' => $margin,
                'margin_percent' => round($marginPercent, 2)
            ];
        });

        // Calculate Totals for the Company
        $companyTotal = [
            'income' => $results->sum('income'),
            'total_cost' => $results->sum('costs.total'),
            'margin' => $results->sum('margin'),
        ];
        $companyTotal['margin_percent'] = $companyTotal['income'] > 0 
            ? ($companyTotal['margin'] / $companyTotal['income']) * 100 
            : 0;

        return [
            'by_field' => $results->sortByDesc('margin')->values(),
            'total' => $companyTotal
        ];
    }
}

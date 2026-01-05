<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Harvest;
use Illuminate\Http\Request;

class HarvestController extends Controller
{
    public function index(Request $request)
    {
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $query = Harvest::with(['planting.field:id,name,code', 'planting.crop:id,name,variety'])
            ->orderByDesc('harvest_date');

        if ($startDate && $endDate) {
            $query->whereBetween('harvest_date', [$startDate, $endDate]);
        }

        // Limit to 100 for pagination safety in V1
        $harvests = $query->paginate(100);

        return response()->json($harvests);
    }
}

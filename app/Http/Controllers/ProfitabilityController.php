<?php

namespace App\Http\Controllers;

use App\Services\ProfitabilityService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProfitabilityController extends Controller
{
    protected $profitabilityService;

    public function __construct(ProfitabilityService $profitabilityService)
    {
        $this->profitabilityService = $profitabilityService;
    }

    public function index(Request $request)
    {
        $year = $request->input('year', date('Y'));
        
        $data = $this->profitabilityService->getFieldProfitability((int)$year);

        return Inertia::render('Profitability/Index', [
            'profitability' => $data,
            'filters' => [
                'year' => (int)$year,
            ]
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Field;
use Illuminate\Http\Request;

class FieldController extends Controller
{
    /**
     * List all fields for the authenticated user's company.
     */
    public function index(Request $request)
    {
        // BelongsToCompany trait automatically filters by company_id via Global Scope
        $fields = Field::select('id', 'name', 'code', 'area_hectares', 'status')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $fields,
            'meta' => [
                'count' => $fields->count(),
                'timestamp' => now()->toIso8601String(),
            ]
        ]);
    }
}

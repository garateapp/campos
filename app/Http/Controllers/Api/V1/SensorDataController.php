<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SensorDataController extends Controller
{
    /**
     * Receive sensor data (IoT).
     * Since we do not have a 'sensors' table yet, we will log it for now as a POC.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'sensor_id' => 'required|string',
            'field_id' => 'required|exists:fields,id',
            'type' => 'required|string', // temperature, humidity, soil_moisture
            'value' => 'required|numeric',
            'unit' => 'required|string',
            'timestamp' => 'required|date',
        ]);

        // In a real implementation: SensorReading::create($validated);
        // For MVP POC: Log to file
        Log::channel('daily')->info('IoT Ingestion:', $validated);

        return response()->json([
            'message' => 'Sensor data received successfully.',
            'id' => uniqid('reading_'),
        ], 201);
    }
}

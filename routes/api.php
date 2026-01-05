<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\V1\FieldController;
use App\Http\Controllers\Api\V1\HarvestController;
use App\Http\Controllers\Api\V1\SensorDataController;
use App\Http\Controllers\Api\SyncController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public Authentication Routes
Route::post('/login', [AuthController::class, 'login']);

// Protected Routes (Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    
    // User Info
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // V1 Endpoints
    Route::prefix('v1')->group(function () {
        
        // Read-only resources
        Route::get('/fields', [FieldController::class, 'index']);
        Route::get('/harvests', [HarvestController::class, 'index']);
        
        // Write resources (IoT)
        Route::post('/sensor-data', [SensorDataController::class, 'store']);

        // Offline sync (mobile)
        Route::get('/sync/download', [SyncController::class, 'download']);
        Route::post('/sync/upload', [SyncController::class, 'upload']);
        
    });

});

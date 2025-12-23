<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;

Route::post('/login', [AuthController::class, 'login']);

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('v1/sync')->group(function () {
    Route::get('/download', [SyncController::class, 'download']);
    Route::post('/upload', [SyncController::class, 'upload']);
});

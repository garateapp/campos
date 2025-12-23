<?php

use App\Http\Controllers\FamilyController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\ContractorController;
use App\Http\Controllers\WorkerController;
use App\Http\Controllers\CardController;
use App\Http\Controllers\CardAssignmentController;
use App\Http\Controllers\CropController;
use App\Http\Controllers\CostController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FieldController;
use App\Http\Controllers\InputController;
use App\Http\Controllers\PlantingController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SpeciesController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\LaborPlanningController;
use App\Http\Controllers\VarietyController;
use App\Http\Controllers\SoilTypeController;
use App\Http\Controllers\InputCategoryController;
use App\Http\Controllers\TaskTypeController;
use App\Http\Controllers\LaborTypeController;
use App\Http\Controllers\UnitOfMeasureController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

/*
|--------------------------------------------------------------------------
| Company Setup Routes (Auth required, no company required)
|--------------------------------------------------------------------------
*/

Route::middleware('auth')->prefix('company')->name('company.')->group(function () {
    Route::get('/setup', [CompanyController::class, 'setup'])->name('setup');
    Route::post('/setup', [CompanyController::class, 'store'])->name('store');
});

/*
|--------------------------------------------------------------------------
| Protected Routes (Auth + Company required)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified', \App\Http\Middleware\EnsureCompanyAccess::class])->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Company Settings
    Route::get('/company/settings', [CompanyController::class, 'settings'])->name('company.settings');
    Route::patch('/company/settings', [CompanyController::class, 'update'])->name('company.update');

    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Fields (Parcelas)
    Route::resource('fields', FieldController::class);
    Route::get('/field-mapping', [FieldController::class, 'mapping'])->name('field-mapping');

    // Crops (Cultivos)
    Route::resource('crops', CropController::class);
    Route::resource('families', FamilyController::class);
    Route::resource('species', SpeciesController::class);
    Route::resource('varieties', VarietyController::class);
    Route::resource('soil-types', SoilTypeController::class);
    Route::resource('task-types', TaskTypeController::class);
    Route::resource('input-categories', InputCategoryController::class);
    Route::resource('labor-types', LaborTypeController::class);
    Route::resource('unit-of-measures', UnitOfMeasureController::class);
    Route::resource('contractors', ContractorController::class);
    Route::resource('workers', WorkerController::class);
    Route::resource('cards', CardController::class);

    // Card Assignments (Operations)
    Route::get('card-assignments', [CardAssignmentController::class, 'index'])->name('card-assignments.index');
    Route::post('card-assignments', [CardAssignmentController::class, 'store'])->name('card-assignments.store');
    Route::post('card-assignments/copy-previous', [CardAssignmentController::class, 'copyPrevious'])->name('card-assignments.copy-previous');
    
    // Envases de Cosecha
    Route::resource('harvest-containers', \App\Http\Controllers\HarvestContainerController::class);
    
    // Operations Routes
    Route::get('attendance', [\App\Http\Controllers\AttendanceController::class, 'index'])->name('attendance.index');
    Route::post('attendance', [\App\Http\Controllers\AttendanceController::class, 'store'])->name('attendance.store');
    
    Route::get('harvest-collection', [\App\Http\Controllers\HarvestCollectionController::class, 'index'])->name('harvest-collection.index');
    Route::post('harvest-collection', [\App\Http\Controllers\HarvestCollectionController::class, 'store'])->name('harvest-collection.store');

    // Plantings (Siembras)
    Route::resource('plantings', PlantingController::class);
    Route::post('/plantings/{planting}/activities', [PlantingController::class, 'storeActivity'])->name('plantings.activities.store');
    Route::post('/plantings/{planting}/harvests', [PlantingController::class, 'storeHarvest'])->name('plantings.harvests.store');

    // Tasks (Tareas)
    Route::resource('tasks', TaskController::class);
    Route::post('/tasks/{task}/assign', [TaskController::class, 'assign'])->name('tasks.assign');
    Route::post('/tasks/{task}/logs', [TaskController::class, 'storeLog'])->name('tasks.logs.store');
    Route::patch('/tasks/{task}/status', [TaskController::class, 'updateStatus'])->name('tasks.status');

    // Inputs (Insumos)
    Route::resource('inputs', InputController::class);
    Route::post('/inputs/{input}/usage', [InputController::class, 'recordUsage'])->name('inputs.usage.store');

    // Costs (Costos)
    Route::resource('costs', CostController::class);

    // Labor Planning (Planificación de Labores)
    Route::resource('labor-plannings', LaborPlanningController::class);

    // API endpoints for sync and hierarchy
    Route::prefix('api')->group(function () {
        Route::post('/sync', [TaskController::class, 'sync'])->name('api.sync');
        Route::get('/hierarchy', [FamilyController::class, 'hierarchy'])->name('api.hierarchy');
    });
});

require __DIR__.'/auth.php';


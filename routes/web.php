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
use App\Http\Controllers\AdminCompanyController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AdminRoleController;
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
| Admin Routes (Auth + Verified + Admin role)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified', \App\Http\Middleware\EnsureAdmin::class])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::resource('companies', AdminCompanyController::class)->only(['index', 'store', 'update']);
        Route::resource('users', AdminUserController::class)->only(['index', 'store', 'update']);
        Route::resource('roles', AdminRoleController::class)->only(['index', 'update']);
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
    Route::post('crops/import', [CropController::class, 'import'])->name('crops.import');
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
    Route::post('plantings/import', [PlantingController::class, 'import'])->name('plantings.import');
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
    Route::post('/inputs/{input}/transfer', [InputController::class, 'transfer'])->name('inputs.transfer');

    // Costs (Costos)
    Route::resource('costs', CostController::class);

    // Labor Planning (Planificación de Labores)
    Route::post('labor-plannings/import', [LaborPlanningController::class, 'import'])->name('labor-plannings.import');
    Route::resource('labor-plannings', LaborPlanningController::class);

    // Financial Analysis
    Route::get('/profitability', [\App\Http\Controllers\ProfitabilityController::class, 'index'])->name('profitability.index');

    // Reports (Informes)
    Route::get('/reports', [\App\Http\Controllers\ReportController::class, 'index'])->name('reports.index');
    Route::get('/reports/harvest-logs', [\App\Http\Controllers\ReportController::class, 'harvestLogs'])->name('reports.harvest-logs');
    Route::get('/reports/application-logs', [\App\Http\Controllers\ReportController::class, 'applicationLogs'])->name('reports.application-logs');

    // Business Intelligence
    Route::get('/analytics', [\App\Http\Controllers\AnalyticsController::class, 'index'])->name('analytics.index');

    // API endpoints for sync and hierarchy
    Route::prefix('api')->group(function () {
        Route::post('/sync', [TaskController::class, 'sync'])->name('api.sync');
        Route::get('/hierarchy', [FamilyController::class, 'hierarchy'])->name('api.hierarchy');
        Route::post('/import/{type}', [\App\Http\Controllers\BulkImportController::class, 'import'])->name('api.import');
    });
});

require __DIR__.'/auth.php';

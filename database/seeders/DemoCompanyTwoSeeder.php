<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Crop;
use App\Models\Field;
use App\Models\LaborPlanning;
use App\Models\LaborType;
use App\Models\Planting;
use App\Models\Role;
use App\Models\Species;
use App\Models\Task;
use App\Models\TaskType;
use App\Models\UnitOfMeasure;
use App\Models\User;
use App\Models\Variety;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoCompanyTwoSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure company exists
        $company = Company::firstOrCreate(
            ['id' => 2],
            [
                'name' => 'Demo Campos Sur',
                'slug' => 'demo-campos-sur',
                'tax_id' => '76.123.456-7',
                'email' => 'contacto@demo-campos.cl',
                'phone' => '+56 9 1234 5678',
                'currency' => 'CLP',
                'timezone' => 'America/Santiago',
                'is_active' => true,
            ]
        );

        // Ensure admin user for company 2
        $adminRole = Role::where('name', 'admin')->first();
        $superRole = Role::where('name', 'superadmin')->first();

        $demoAdmin = User::firstOrCreate(
            ['email' => 'admin+demo@greenexcampos.cl'],
            [
                'name' => 'Admin Demo',
                'password' => Hash::make('Demo1234!'),
                'company_id' => $company->id,
                'role_id' => $adminRole?->id ?? $superRole?->id,
                'is_active' => true,
            ]
        );

        // Master references (fallback creation if none exist for company 2)
        $species = Species::firstOrCreate(
            ['name' => 'Arandano Demo'],
            ['scientific_name' => 'Vaccinium spp.']
        );

        $variety = Variety::firstOrCreate(
            ['species_id' => $species->id, 'name' => 'Legacy Demo']
        );

        $taskType = TaskType::firstOrCreate(
            ['company_id' => $company->id, 'name' => 'Mantencion Demo']
        );

        $laborType = LaborType::firstOrCreate(
            ['company_id' => $company->id, 'name' => 'Jornal'],
            ['description' => 'Jornal estandar']
        );

        $unit = UnitOfMeasure::firstOrCreate(
            ['company_id' => $company->id, 'name' => 'Jornada', 'code' => 'JH']
        );

        // Fields
        $fieldA = Field::firstOrCreate(
            ['company_id' => $company->id, 'name' => 'Lote Norte'],
            [
                'code' => 'LN-01',
                'area_hectares' => 12.5,
                'status' => 'activo',
            ]
        );
        $fieldB = Field::firstOrCreate(
            ['company_id' => $company->id, 'name' => 'Lote Sur'],
            [
                'code' => 'LS-02',
                'area_hectares' => 18.0,
                'status' => 'activo',
            ]
        );

        // Crop + planting
        $crop = Crop::firstOrCreate(
            ['company_id' => $company->id, 'field_id' => $fieldA->id, 'name' => 'Arandano Legacy'],
            [
                'species_id' => $species->id,
                'variety_id' => $variety->id,
                'days_to_harvest' => 120,
            ]
        );

        $planting = Planting::updateOrCreate(
            ['company_id' => $company->id, 'field_id' => $fieldA->id, 'crop_id' => $crop->id, 'season' => '2025-2026'],
            [
                'company_id' => $company->id,
                'field_id' => $fieldA->id,
                'crop_id' => $crop->id,
                'planted_date' => Carbon::now()->subDays(45),
                'expected_harvest_date' => Carbon::now()->addMonths(3),
                'planted_area_hectares' => 10.0,
                'plants_count' => 15000,
                'status' => 'growing',
                'expected_yield_kg' => 25000,
                'notes' => 'Plantacion de demostracion para visitas.',
            ]
        );

        // Tasks for demo
        Task::updateOrCreate(
            ['company_id' => $company->id, 'title' => 'Riego por goteo semanal'],
            [
                'field_id' => $fieldA->id,
                'planting_id' => $planting->id,
                'created_by' => $demoAdmin->id,
                'description' => 'Configurar riego 12 lts/planta.',
                'type' => 'irrigation',
                'priority' => 'medium',
                'status' => 'in_progress',
                'due_date' => Carbon::now()->addDays(7),
                'task_type_id' => $taskType->id,
            ]
        );

        Task::updateOrCreate(
            ['company_id' => $company->id, 'title' => 'Aplicacion foliar preventiva'],
            [
                'field_id' => $fieldB->id,
                'planting_id' => $planting->id,
                'created_by' => $demoAdmin->id,
                'description' => 'Aplicar mezcla preventiva contra hongos.',
                'type' => 'pest_control',
                'priority' => 'high',
                'status' => 'pending',
                'due_date' => Carbon::now()->addDays(3),
                'task_type_id' => $taskType->id,
            ]
        );

        // Labor planning demo
        LaborPlanning::updateOrCreate(
            ['company_id' => $company->id, 'year' => now()->year, 'month' => now()->month, 'field_id' => $fieldA->id, 'task_type_id' => $taskType->id],
            [
                'company_id' => $company->id,
                'field_id' => $fieldA->id,
                'species_id' => $species->id,
                'variety_id' => $variety->id,
                'planting_year' => now()->year - 1,
                'hectares' => 10,
                'labor_type_id' => $laborType->id,
                'unit_of_measure_id' => $unit->id,
                'num_jh_planned' => 45,
                'avg_yield_planned' => 2500,
                'total_jh_planned' => 45,
                'effective_days_planned' => 6,
                'value_planned' => 25000,
                'total_value_planned' => 25000,
                'avg_yield_actual' => 0,
                'total_jh_actual' => null,
                'value_actual' => null,
            ]
        );
    }
}

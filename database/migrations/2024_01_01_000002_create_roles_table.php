<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // admin, crop_manager, agronomist, field_worker
            $table->string('display_name');
            $table->text('description')->nullable();
            $table->json('permissions')->nullable();
            $table->timestamps();
        });

        // Insert default roles
        DB::table('roles')->insert([
            ['name' => 'admin', 'display_name' => 'Administrador', 'description' => 'Acceso total a todos los módulos', 'permissions' => json_encode(['*']), 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'crop_manager', 'display_name' => 'Gerente de Cultivos', 'description' => 'Gestión de cultivos, tareas e inventario', 'permissions' => json_encode(['crops.*', 'tasks.*', 'inputs.*', 'fields.*', 'plantings.*']), 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'agronomist', 'display_name' => 'Agrónomo', 'description' => 'Exploración y registro de observaciones', 'permissions' => json_encode(['crops.view', 'fields.view', 'plantings.view', 'activities.create', 'scouting.*']), 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'field_worker', 'display_name' => 'Operario de Campo', 'description' => 'Acceso limitado a tareas asignadas', 'permissions' => json_encode(['tasks.view_assigned', 'tasks.complete']), 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};

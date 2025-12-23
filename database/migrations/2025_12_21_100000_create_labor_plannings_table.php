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
        Schema::create('labor_plannings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            
            // Context/Identification
            $table->integer('year');
            $table->integer('month');
            $table->foreignId('field_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('species_id')->nullable()->constrained('species')->nullOnDelete();
            $table->foreignId('variety_id')->nullable()->constrained('varieties')->nullOnDelete();
            $table->integer('planting_year')->nullable();
            $table->string('cc')->nullable(); // Cost Center
            
            // Base Data
            $table->decimal('hectares', 10, 2)->nullable();
            $table->integer('num_plants')->nullable();
            $table->decimal('kilos', 15, 2)->nullable();
            $table->decimal('meters', 15, 2)->nullable();
            
            // Planning Data
            $table->string('labor_name');
            $table->decimal('num_jh_planned', 10, 2)->nullable();
            $table->decimal('avg_yield_planned', 15, 2)->nullable();
            $table->string('unit_of_measure')->nullable();
            $table->decimal('total_jh_planned', 10, 2)->nullable();
            $table->integer('effective_days_planned')->nullable();
            $table->string('labor_type')->nullable(); // Planning type
            $table->decimal('value_planned', 15, 2)->nullable();
            $table->decimal('total_value_planned', 15, 2)->nullable();
            
            // Actual Data (Contrast)
            $table->decimal('avg_yield_actual', 15, 2)->nullable();
            $table->string('unit_of_measure_actual')->nullable();
            $table->decimal('total_jh_actual', 10, 2)->nullable();
            $table->decimal('jh_ha_actual', 10, 2)->nullable();
            $table->string('labor_type_actual')->nullable();
            $table->decimal('value_actual', 15, 2)->nullable();
            $table->decimal('total_value_actual', 15, 2)->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['company_id', 'year', 'month']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('labor_plannings');
    }
};

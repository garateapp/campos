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
        Schema::table('labor_plannings', function (Blueprint $table) {
            // Drop old string columns if they exist
            if (Schema::hasColumn('labor_plannings', 'labor_name')) {
                $table->dropColumn('labor_name');
            }
            if (Schema::hasColumn('labor_plannings', 'unit_of_measure')) {
                $table->dropColumn('unit_of_measure');
            }
            if (Schema::hasColumn('labor_plannings', 'unit_of_measure_actual')) {
                $table->dropColumn('unit_of_measure_actual');
            }
            
            // Add new foreign keys if they don't exist
            if (!Schema::hasColumn('labor_plannings', 'labor_type_id')) {
                $table->foreignId('labor_type_id')->nullable()->after('task_type_id')->constrained('labor_types')->nullOnDelete();
            }
            if (!Schema::hasColumn('labor_plannings', 'unit_of_measure_id')) {
                $table->foreignId('unit_of_measure_id')->nullable()->after('labor_type_id')->constrained('unit_of_measures')->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('labor_plannings', function (Blueprint $table) {
            $table->string('labor_name')->nullable(); // Was required, but nullable on rollback for safety
            $table->string('unit_of_measure')->nullable();
            $table->string('unit_of_measure_actual')->nullable();
            
            $table->dropConstrainedForeignId('labor_type_id');
            $table->dropConstrainedForeignId('unit_of_measure_id');
        });
    }
};

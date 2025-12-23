<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('labor_plannings', function (Blueprint $table) {
            $table->foreignId('task_type_id')->nullable()->after('labor_name')->constrained()->nullOnDelete();
        });

        // Optionally migrate data if needed, but per plan we might leave it or map it.
        // Since labor_type was free text, mapping might be unreliable without fuzzy logic or manual intervention.
        // We will keep existing labor_type data in 'labor_name' if needed or just drop labor_type column as planned.
        
        Schema::table('labor_plannings', function (Blueprint $table) {
            $table->dropColumn('labor_type');
            $table->dropColumn('labor_type_actual'); // Also drop actual type if it exists and we are unifying
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('labor_plannings', function (Blueprint $table) {
            $table->string('labor_type')->nullable()->after('effective_days_planned');
            $table->string('labor_type_actual')->nullable()->after('jh_ha_actual');
            $table->dropConstrainedForeignId('task_type_id');
        });
    }
};

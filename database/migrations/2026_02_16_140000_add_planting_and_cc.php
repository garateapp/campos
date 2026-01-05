<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add planting_id to labor_plannings
        Schema::table('labor_plannings', function (Blueprint $table) {
            if (!Schema::hasColumn('labor_plannings', 'planting_id')) {
                $table->foreignId('planting_id')->nullable()->after('field_id')->constrained('plantings')->nullOnDelete();
            }
        });

        // Add cost center to plantings
        Schema::table('plantings', function (Blueprint $table) {
            if (!Schema::hasColumn('plantings', 'cc')) {
                $table->string('cc')->nullable()->after('planted_area_hectares');
            }
        });
    }

    public function down(): void
    {
        Schema::table('labor_plannings', function (Blueprint $table) {
            if (Schema::hasColumn('labor_plannings', 'planting_id')) {
                $table->dropConstrainedForeignId('planting_id');
            }
        });

        Schema::table('plantings', function (Blueprint $table) {
            if (Schema::hasColumn('plantings', 'cc')) {
                $table->dropColumn('cc');
            }
        });
    }
};

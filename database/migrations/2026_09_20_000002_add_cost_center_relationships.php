<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('crops', function (Blueprint $table) {
            if (!Schema::hasColumn('crops', 'cost_center_id')) {
                $table->foreignId('cost_center_id')->nullable()->after('field_id')->constrained('cost_centers')->nullOnDelete();
            }
        });

        Schema::table('plantings', function (Blueprint $table) {
            if (!Schema::hasColumn('plantings', 'cost_center_id')) {
                $table->foreignId('cost_center_id')->nullable()->after('field_id')->constrained('cost_centers')->nullOnDelete();
            }
        });

        Schema::table('tasks', function (Blueprint $table) {
            if (!Schema::hasColumn('tasks', 'cost_center_id')) {
                $table->foreignId('cost_center_id')->nullable()->after('field_id')->constrained('cost_centers')->nullOnDelete();
            }
        });

        Schema::table('labor_plannings', function (Blueprint $table) {
            if (!Schema::hasColumn('labor_plannings', 'cost_center_id')) {
                $table->foreignId('cost_center_id')->nullable()->after('field_id')->constrained('cost_centers')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('labor_plannings', function (Blueprint $table) {
            if (Schema::hasColumn('labor_plannings', 'cost_center_id')) {
                $table->dropConstrainedForeignId('cost_center_id');
            }
        });

        Schema::table('tasks', function (Blueprint $table) {
            if (Schema::hasColumn('tasks', 'cost_center_id')) {
                $table->dropConstrainedForeignId('cost_center_id');
            }
        });

        Schema::table('plantings', function (Blueprint $table) {
            if (Schema::hasColumn('plantings', 'cost_center_id')) {
                $table->dropConstrainedForeignId('cost_center_id');
            }
        });

        Schema::table('crops', function (Blueprint $table) {
            if (Schema::hasColumn('crops', 'cost_center_id')) {
                $table->dropConstrainedForeignId('cost_center_id');
            }
        });
    }
};

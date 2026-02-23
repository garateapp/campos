<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('labor_plannings', function (Blueprint $table) {
            if (!Schema::hasColumn('labor_plannings', 'num_jh_estimated_2')) {
                $table->decimal('num_jh_estimated_2', 10, 2)->nullable()->after('num_jh_planned');
            }
            if (!Schema::hasColumn('labor_plannings', 'avg_yield_estimated_2')) {
                $table->decimal('avg_yield_estimated_2', 15, 2)->nullable()->after('avg_yield_planned');
            }
            if (!Schema::hasColumn('labor_plannings', 'total_jh_estimated_2')) {
                $table->decimal('total_jh_estimated_2', 10, 2)->nullable()->after('total_jh_planned');
            }
            if (!Schema::hasColumn('labor_plannings', 'effective_days_estimated_2')) {
                $table->integer('effective_days_estimated_2')->nullable()->after('effective_days_planned');
            }
            if (!Schema::hasColumn('labor_plannings', 'value_estimated_2')) {
                $table->decimal('value_estimated_2', 15, 2)->nullable()->after('value_planned');
            }
            if (!Schema::hasColumn('labor_plannings', 'total_value_estimated_2')) {
                $table->decimal('total_value_estimated_2', 15, 2)->nullable()->after('total_value_planned');
            }
        });
    }

    public function down(): void
    {
        Schema::table('labor_plannings', function (Blueprint $table) {
            $columns = [
                'num_jh_estimated_2',
                'avg_yield_estimated_2',
                'total_jh_estimated_2',
                'effective_days_estimated_2',
                'value_estimated_2',
                'total_value_estimated_2',
            ];

            foreach ($columns as $column) {
                if (Schema::hasColumn('labor_plannings', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};

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
        Schema::table('task_types', function (Blueprint $table) {
            if (!Schema::hasColumn('task_types', 'work_payment_mode')) {
                $table->string('work_payment_mode', 20)->default('day')->after('name');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('task_types', function (Blueprint $table) {
            if (Schema::hasColumn('task_types', 'work_payment_mode')) {
                $table->dropColumn('work_payment_mode');
            }
        });
    }
};

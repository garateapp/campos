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
        Schema::table('harvest_collections', function (Blueprint $table) {
            if (!Schema::hasColumn('harvest_collections', 'is_bin_completed')) {
                $table->boolean('is_bin_completed')->default(false)->after('field_id');
            }

            if (!Schema::hasColumn('harvest_collections', 'manual_bin_units')) {
                $table->unsignedInteger('manual_bin_units')->nullable()->after('is_bin_completed');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('harvest_collections', function (Blueprint $table) {
            if (Schema::hasColumn('harvest_collections', 'manual_bin_units')) {
                $table->dropColumn('manual_bin_units');
            }

            if (Schema::hasColumn('harvest_collections', 'is_bin_completed')) {
                $table->dropColumn('is_bin_completed');
            }
        });
    }
};


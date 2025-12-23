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
        Schema::table('harvest_containers', function (Blueprint $table) {
            $table->renameColumn('capacity_kg', 'bin_weight_kg');
            $table->integer('quantity_per_bin')->default(1)->after('name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('harvest_containers', function (Blueprint $table) {
            $table->renameColumn('bin_weight_kg', 'capacity_kg');
            $table->dropColumn('quantity_per_bin');
        });
    }
};

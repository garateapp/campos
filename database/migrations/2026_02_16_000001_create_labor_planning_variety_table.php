<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('labor_planning_variety', function (Blueprint $table) {
            $table->id();
            $table->foreignId('labor_planning_id')->constrained()->cascadeOnDelete();
            $table->foreignId('variety_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['labor_planning_id', 'variety_id']);
        });

        // Migrate existing single variety selections into the pivot table for backward compatibility.
        DB::table('labor_plannings')
            ->whereNotNull('variety_id')
            ->orderBy('id')
            ->chunkById(200, function ($rows) {
                $now = now();
                $payload = [];

                foreach ($rows as $row) {
                    $payload[] = [
                        'labor_planning_id' => $row->id,
                        'variety_id' => $row->variety_id,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }

                if (!empty($payload)) {
                    DB::table('labor_planning_variety')->insertOrIgnore($payload);
                }
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('labor_planning_variety');
    }
};

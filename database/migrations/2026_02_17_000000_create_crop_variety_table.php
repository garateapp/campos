<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crop_variety', function (Blueprint $table) {
            $table->id();
            $table->foreignId('crop_id')->constrained()->cascadeOnDelete();
            $table->foreignId('variety_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['crop_id', 'variety_id']);
        });

        // Migrate existing single variety assignments into the pivot.
        $existing = DB::table('crops')
            ->whereNotNull('variety_id')
            ->select('id as crop_id', 'variety_id')
            ->get();

        if ($existing->isNotEmpty()) {
            $now = now();
            $rows = $existing->map(function ($row) use ($now) {
                return [
                    'crop_id' => $row->crop_id,
                    'variety_id' => $row->variety_id,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            })->all();
            DB::table('crop_variety')->insertOrIgnore($rows);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('crop_variety');
    }
};

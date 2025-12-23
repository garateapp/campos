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
        Schema::create('plantings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('field_id')->constrained()->cascadeOnDelete();
            $table->foreignId('crop_id')->constrained()->cascadeOnDelete();
            $table->string('season'); // e.g., "2024-2025"
            $table->date('planted_date');
            $table->date('expected_harvest_date')->nullable();
            $table->decimal('planted_area_hectares', 10, 2);
            $table->integer('plants_count')->nullable();
            $table->enum('status', ['planted', 'growing', 'flowering', 'fruiting', 'harvesting', 'completed', 'failed'])->default('planted');
            $table->decimal('expected_yield_kg', 12, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['company_id', 'season', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plantings');
    }
};

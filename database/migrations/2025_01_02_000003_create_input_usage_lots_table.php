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
        Schema::create('input_usage_lots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('input_usage_id')->constrained('input_usages')->cascadeOnDelete();
            $table->foreignId('input_lot_id')->constrained('input_lots')->cascadeOnDelete();
            $table->decimal('quantity', 12, 2);
            $table->timestamps();

            $table->unique(['input_usage_id', 'input_lot_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('input_usage_lots');
    }
};

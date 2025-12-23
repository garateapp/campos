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
        Schema::create('card_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->foreignId('worker_id')->constrained()->cascadeOnDelete();
            $table->foreignId('card_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            // Constraints
            $table->unique(['company_id', 'date', 'card_id'], 'unique_card_per_day'); // Card can only be assigned once per day
            // $table->unique(['company_id', 'date', 'worker_id'], 'unique_worker_per_day'); // Worker can only have one card per day? Usually yes.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('card_assignments');
    }
};

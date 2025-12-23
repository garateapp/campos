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
        Schema::create('harvest_containers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('species_id')->constrained('species')->cascadeOnDelete(); // Assuming 'species' table exists
            $table->string('name'); // e.g., Tote 8.5, Bin Madera
            $table->decimal('capacity_kg', 8, 2); // e.g., 8.50, 450.00
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('harvest_containers');
    }
};

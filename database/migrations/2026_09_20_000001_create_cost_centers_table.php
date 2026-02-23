<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cost_centers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('code')->index();
            $table->string('name');
            $table->string('species')->nullable();
            $table->string('variety')->nullable();
            $table->string('status')->nullable();
            $table->integer('plant_year')->nullable();
            $table->string('planting_frame')->nullable();
            $table->integer('plants_count')->nullable();
            $table->decimal('hectares', 10, 2)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cost_centers');
    }
};

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
        Schema::create('costs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('field_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('planting_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('type', ['input', 'labor', 'equipment', 'transport', 'other']);
            $table->enum('category', ['fixed', 'variable'])->default('variable');
            $table->string('description');
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('CLP');
            $table->date('cost_date');
            $table->nullableMorphs('costable'); // Polymorphic: can link to activities, tasks, etc.
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'type', 'cost_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('costs');
    }
};

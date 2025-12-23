<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('species', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('scientific_name')->nullable();
            $table->timestamps();
        });

        Schema::create('varieties', function (Blueprint $table) {
            $table->id();
            $table->foreignId('species_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->timestamps();
        });

        Schema::table('crops', function (Blueprint $table) {
            $table->foreignId('species_id')->nullable()->after('company_id')->constrained('species')->nullOnDelete();
            $table->foreignId('variety_id')->nullable()->after('species_id')->constrained('varieties')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('crops', function (Blueprint $table) {
            $table->dropForeign(['variety_id']);
            $table->dropColumn('variety_id');
            $table->dropForeign(['species_id']);
            $table->dropColumn('species_id');
        });
        Schema::dropIfExists('varieties');
        Schema::dropIfExists('species');
    }
};

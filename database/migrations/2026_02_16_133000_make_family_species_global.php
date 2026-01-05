<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Families: allow null company_id to behave as global
        Schema::table('families', function (Blueprint $table) {
            if (Schema::hasColumn('families', 'company_id')) {
                // Drop FK first
                $table->dropForeign(['company_id']);
                $table->foreignId('company_id')->nullable()->change();
                $table->foreign('company_id')->references('id')->on('companies')->nullOnDelete();
            }
        });

        // Species: allow null company_id (global)
        Schema::table('species', function (Blueprint $table) {
            if (Schema::hasColumn('species', 'company_id')) {
                $table->foreignId('company_id')->nullable()->change();
            }
        });

        // Varieties: already nullable, ensure nullOnDelete for consistency
        Schema::table('varieties', function (Blueprint $table) {
            if (Schema::hasColumn('varieties', 'company_id')) {
                $table->dropForeign(['company_id']);
                $table->foreign('company_id')->references('id')->on('companies')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('families', function (Blueprint $table) {
            if (Schema::hasColumn('families', 'company_id')) {
                $table->dropForeign(['company_id']);
                $table->foreignId('company_id')->nullable(false)->change();
                $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
            }
        });

        Schema::table('species', function (Blueprint $table) {
            if (Schema::hasColumn('species', 'company_id')) {
                $table->foreignId('company_id')->nullable(false)->change();
            }
        });

        Schema::table('varieties', function (Blueprint $table) {
            if (Schema::hasColumn('varieties', 'company_id')) {
                $table->dropForeign(['company_id']);
                $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
            }
        });
    }
};

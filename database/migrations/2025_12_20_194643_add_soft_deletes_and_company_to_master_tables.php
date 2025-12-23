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
        Schema::table('species', function (Blueprint $table) {
            if (!Schema::hasColumn('species', 'deleted_at')) {
                $table->softDeletes();
            }
        });

        Schema::table('varieties', function (Blueprint $table) {
            if (!Schema::hasColumn('varieties', 'company_id')) {
                $table->foreignId('company_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
            }
            if (!Schema::hasColumn('varieties', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('varieties', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropForeign(['company_id']);
            $table->dropColumn('company_id');
        });

        Schema::table('species', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};

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
        Schema::table('attendances', function (Blueprint $table) {
            if (!Schema::hasColumn('attendances', 'check_out_time')) {
                $table->time('check_out_time')->nullable()->after('check_in_time');
            }
        });

        Schema::table('harvest_collections', function (Blueprint $table) {
            if (!Schema::hasColumn('harvest_collections', 'card_id')) {
                $table->foreignId('card_id')->nullable()->after('worker_id')->constrained()->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('harvest_collections', function (Blueprint $table) {
            if (Schema::hasColumn('harvest_collections', 'card_id')) {
                $table->dropConstrainedForeignId('card_id');
            }
        });

        Schema::table('attendances', function (Blueprint $table) {
            if (Schema::hasColumn('attendances', 'check_out_time')) {
                $table->dropColumn('check_out_time');
            }
        });
    }
};

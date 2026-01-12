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
        Schema::table('inputs', function (Blueprint $table) {
            $table->date('invoice_date')->nullable()->after('unit_cost');
            $table->integer('return_period_days')->nullable()->after('invoice_date');
            $table->decimal('return_min_quantity', 12, 2)->nullable()->after('return_period_days');
            $table->date('expiration_date')->nullable()->after('return_min_quantity');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inputs', function (Blueprint $table) {
            $table->dropColumn(['invoice_date', 'return_period_days', 'return_min_quantity', 'expiration_date']);
        });
    }
};

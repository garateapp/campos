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
        Schema::create('task_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('action'); // created, started, paused, completed, note_added
            $table->text('note')->nullable();
            $table->json('data')->nullable();
            $table->string('client_uuid')->nullable(); // For offline sync
            $table->timestamp('logged_at');
            $table->timestamps();

            $table->index(['task_id', 'logged_at']);
            $table->index('client_uuid');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('task_logs');
    }
};

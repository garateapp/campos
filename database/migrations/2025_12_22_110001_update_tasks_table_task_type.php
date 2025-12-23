<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add the column
        Schema::table('tasks', function (Blueprint $table) {
            $table->foreignId('task_type_id')->nullable()->after('planting_id')->constrained('task_types')->nullOnDelete();
        });

        // 2. Migrate data
        $tasks = DB::table('tasks')->get();
        foreach ($tasks as $task) {
            if ($task->type) {
                // Find or create TaskType for this company
                $taskType = DB::table('task_types')
                    ->where('company_id', $task->company_id)
                    ->where('name', $task->type)
                    ->first();

                if (!$taskType) {
                    $taskTypeId = DB::table('task_types')->insertGetId([
                        'company_id' => $task->company_id,
                        'name' => $task->type,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } else {
                    $taskTypeId = $taskType->id;
                }

                DB::table('tasks')->where('id', $task->id)->update(['task_type_id' => $taskTypeId]);
            }
        }

        // 3. Drop old column
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn('type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->enum('type', ['irrigation', 'fertilization', 'pest_control', 'harvest', 'maintenance', 'scouting', 'other'])->nullable()->after('planting_id');
        });

        // Optional: migrate back if needed, but risky due to enum constraints
        $tasks = DB::table('tasks')->whereNotNull('task_type_id')->get();
        foreach ($tasks as $task) {
            $taskTypeRecord = DB::table('task_types')->find($task->task_type_id);
            if ($taskTypeRecord) {
                // Only migrate back if the name is one of the valid enum values
                $validTypes = ['irrigation', 'fertilization', 'pest_control', 'harvest', 'maintenance', 'scouting', 'other'];
                if (in_array($taskTypeRecord->name, $validTypes)) {
                    DB::table('tasks')->where('id', $task->id)->update(['type' => $taskTypeRecord->name]);
                } else {
                    DB::table('tasks')->where('id', $task->id)->update(['type' => 'other']);
                }
            }
        }

        Schema::table('tasks', function (Blueprint $table) {
            $table->dropConstrainedForeignId('task_type_id');
        });
    }
};

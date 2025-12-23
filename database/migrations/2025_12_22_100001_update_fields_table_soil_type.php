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
        Schema::table('fields', function (Blueprint $table) {
            $table->foreignId('soil_type_id')->nullable()->after('area_hectares')->constrained('soil_types')->nullOnDelete();
        });

        // 2. Migrate data
        $fields = DB::table('fields')->whereNotNull('soil_type')->get();
        foreach ($fields as $field) {
            if ($field->soil_type) {
                // Find or create SoilType for this company
                $soilType = DB::table('soil_types')
                    ->where('company_id', $field->company_id)
                    ->where('name', $field->soil_type)
                    ->first();

                if (!$soilType) {
                    $soilTypeId = DB::table('soil_types')->insertGetId([
                        'company_id' => $field->company_id,
                        'name' => $field->soil_type,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } else {
                    $soilTypeId = $soilType->id;
                }

                DB::table('fields')->where('id', $field->id)->update(['soil_type_id' => $soilTypeId]);
            }
        }

        // 3. Drop old column
        Schema::table('fields', function (Blueprint $table) {
            $table->dropColumn('soil_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fields', function (Blueprint $table) {
            $table->string('soil_type')->nullable()->after('area_hectares');
        });

        // Optional: migrate back if needed, but risky
        $fields = DB::table('fields')->whereNotNull('soil_type_id')->get();
        foreach ($fields as $field) {
            $soilType = DB::table('soil_types')->find($field->soil_type_id);
            if ($soilType) {
                DB::table('fields')->where('id', $field->id)->update(['soil_type' => $soilType->name]);
            }
        }

        Schema::table('fields', function (Blueprint $table) {
            $table->dropConstrainedForeignId('soil_type_id');
        });
    }
};

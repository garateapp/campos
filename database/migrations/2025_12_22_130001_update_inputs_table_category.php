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
        Schema::table('inputs', function (Blueprint $table) {
            $table->foreignId('input_category_id')->nullable()->after('field_id')->constrained()->nullOnDelete();
        });

        // Migrate existing data
        $inputs = DB::table('inputs')->get();
        $categoriesMapping = [
            'fertilizer' => 'Fertilizante',
            'pesticide' => 'Pesticida',
            'herbicide' => 'Herbicida',
            'seed' => 'Semilla',
            'fuel' => 'Combustible',
            'other' => 'Otro',
        ];

        foreach ($inputs as $input) {
            $categoryName = $categoriesMapping[$input->category] ?? 'Otro';
            
            // Find or create the category for this company
            $categoryId = DB::table('input_categories')
                ->where('company_id', $input->company_id)
                ->where('name', $categoryName)
                ->value('id');

            if (!$categoryId) {
                $categoryId = DB::table('input_categories')->insertGetId([
                    'company_id' => $input->company_id,
                    'name' => $categoryName,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            DB::table('inputs')->where('id', $input->id)->update([
                'input_category_id' => $categoryId
            ]);
        }

        Schema::table('inputs', function (Blueprint $table) {
            // Drop old category column
            $table->dropColumn('category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inputs', function (Blueprint $table) {
            $table->enum('category', ['fertilizer', 'pesticide', 'herbicide', 'seed', 'fuel', 'other'])->after('field_id');
        });

        // Reverse data migration
        $inputs = DB::table('inputs')->whereNotNull('input_category_id')->get();
        $categoriesMapping = [
            'Fertilizante' => 'fertilizer',
            'Pesticida' => 'pesticide',
            'Herbicida' => 'herbicide',
            'Semilla' => 'seed',
            'Combustible' => 'fuel',
            'Otro' => 'other',
        ];

        foreach ($inputs as $input) {
            $categoryName = DB::table('input_categories')->where('id', $input->input_category_id)->value('name');
            $enumValue = $categoriesMapping[$categoryName] ?? 'other';

            DB::table('inputs')->where('id', $input->id)->update([
                'category' => $enumValue
            ]);
        }

        Schema::table('inputs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('input_category_id');
        });
    }
};

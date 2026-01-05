<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $exists = DB::table('roles')->where('name', 'superadmin')->exists();
        if (!$exists) {
            DB::table('roles')->insert([
                'name' => 'superadmin',
                'display_name' => 'Super Administrador',
                'description' => 'Acceso total a todas las compañías y módulos',
                'permissions' => json_encode(['*']),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('roles')->where('name', 'superadmin')->delete();
    }
};

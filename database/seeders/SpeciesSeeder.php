<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Species;
use App\Models\Variety;
use Illuminate\Database\Seeder;

class SpeciesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $companies = Company::all();

        if ($companies->isEmpty()) {
            return;
        }

        foreach ($companies as $company) {
            $cherry = Species::create([
                'company_id' => $company->id,
                'name' => 'Cereza',
                'scientific_name' => 'Prunus avium',
            ]);

            Variety::create(['species_id' => $cherry->id, 'name' => 'Regina']);
            Variety::create(['species_id' => $cherry->id, 'name' => 'Lapins']);
            Variety::create(['species_id' => $cherry->id, 'name' => 'Santina']);
            Variety::create(['species_id' => $cherry->id, 'name' => 'Bing']);
            Variety::create(['species_id' => $cherry->id, 'name' => 'Skeena']);

            $apple = Species::create([
                'company_id' => $company->id,
                'name' => 'Manzana',
                'scientific_name' => 'Malus domestica',
            ]);

            Variety::create(['species_id' => $apple->id, 'name' => 'Gala']);
            Variety::create(['species_id' => $apple->id, 'name' => 'Fuji']);
            Variety::create(['species_id' => $apple->id, 'name' => 'Granny Smith']);
            Variety::create(['species_id' => $apple->id, 'name' => 'Pink Lady']);

            $grape = Species::create([
                'company_id' => $company->id,
                'name' => 'Uva',
                'scientific_name' => 'Vitis vinifera',
            ]);

            Variety::create(['species_id' => $grape->id, 'name' => 'Thompson Seedless']);
            Variety::create(['species_id' => $grape->id, 'name' => 'Crimson Seedless']);
            Variety::create(['species_id' => $grape->id, 'name' => 'Red Globe']);
        }
    }
}

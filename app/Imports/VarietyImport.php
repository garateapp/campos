<?php

namespace App\Imports;

use App\Models\Variety;
use App\Models\Species;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Illuminate\Support\Facades\Auth;

class VarietyImport implements ToModel, WithHeadingRow
{
    /**
    * @param array $row
    *
    * @return \Illuminate\Database\Eloquent\Model|null
    */
    public function model(array $row)
    {
        $speciesName = $row['especie'] ?? $row['species'];
        $varietyName = $row['nombre'] ?? $row['name'];

        if (!$speciesName || !$varietyName) {
            return null;
        }

        $species = Species::where('name', $speciesName)
            ->where('company_id', Auth::user()->company_id)
            ->first();

        if (!$species) {
            // Option: Create species on the fly or skip
            // For now, let's skip or we could create it. 
            // Better to skip to ensure data integrity if master table is important.
            return null;
        }

        return new Variety([
            'company_id' => Auth::user()->company_id,
            'species_id' => $species->id,
            'name'       => $varietyName,
        ]);
    }
}

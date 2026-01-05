<?php

namespace App\Imports;

use App\Models\Worker;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Illuminate\Support\Facades\Auth;

class WorkerImport implements ToModel, WithHeadingRow
{
    /**
    * @param array $row
    *
    * @return \Illuminate\Database\Eloquent\Model|null
    */
    public function model(array $row)
    {
        return new Worker([
            'company_id'    => Auth::user()->company_id,
            'name'          => $row['nombre'] ?? $row['name'],
            'rut'           => $row['rut'],
            'phone'         => $row['telefono'] ?? $row['phone'] ?? null,
            'is_identity_validated' => 0,
        ]);
    }
}

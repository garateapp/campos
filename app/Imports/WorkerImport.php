<?php

namespace App\Imports;

use App\Models\Contractor;
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
        $companyId = Auth::user()->company_id;
        $contractorId = $row['contractor_id'] ?? $row['contratista_id'] ?? null;

        if (!empty($contractorId)) {
            $exists = Contractor::where('company_id', $companyId)
                ->where('id', $contractorId)
                ->exists();
            if (!$exists) {
                throw new \RuntimeException('El contratista indicado no existe para esta empresa.');
            }
        } else {
            $contractorName = $row['contratista'] ?? $row['contratista_nombre'] ?? $row['contractor'] ?? null;
            if (!empty($contractorName)) {
                $contractorId = Contractor::where('company_id', $companyId)
                    ->where('business_name', $contractorName)
                    ->value('id');
                if (!$contractorId) {
                    throw new \RuntimeException('El nombre de contratista no coincide con un registro.');
                }
            } else {
                $contractorIds = Contractor::where('company_id', $companyId)->pluck('id');
                if ($contractorIds->count() === 1) {
                    $contractorId = $contractorIds->first();
                } else {
                    throw new \RuntimeException('Debe incluir contractor_id o contratista en el archivo.');
                }
            }
        }

        return new Worker([
            'company_id'    => $companyId,
            'contractor_id' => $contractorId,
            'name'          => $row['nombre'] ?? $row['name'],
            'rut'           => $row['rut'],
            'phone'         => $row['telefono'] ?? $row['phone'] ?? null,
            'is_identity_validated' => 0,
        ]);
    }
}

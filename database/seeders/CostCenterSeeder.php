<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\CostCenter;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Log;

class CostCenterSeeder extends Seeder
{
    public function run(): void
    {
        $path = base_path('Ceco 25-26.xlsx - CeCo.csv');
        if (!file_exists($path)) {
            Log::warning('Cost centers CSV not found', ['path' => $path]);
            return;
        }

        $rows = $this->readCsv($path);
        if ($rows->isEmpty()) {
            return;
        }

        Company::all()->each(function ($company) use ($rows) {
            foreach ($rows as $row) {
                $code = $this->value($row, ['codigo', 'code']);
                $name = $this->value($row, ['nombre', 'name']);

                if ($code === '' || $name === '') {
                    continue;
                }

                CostCenter::updateOrCreate(
                    [
                        'company_id' => $company->id,
                        'code' => $code,
                    ],
                    [
                        'name' => $name,
                        'species' => $this->value($row, ['Esp', 'esp', 'species']),
                        'variety' => $this->value($row, ['Var', 'var', 'variety']),
                        'status' => $this->value($row, ['Estado', 'estado', 'status']),
                        'plant_year' => $this->parseInt($this->value($row, ['Año Plant', 'Ano Plant', 'plant_year'])),
                        'planting_frame' => $this->value($row, ['Marco Plantación', 'Marco Plantacion', 'planting_frame']),
                        'plants_count' => $this->parseInt($this->value($row, ['Cant Plantas', 'cant_plantas', 'plants_count'])),
                        'hectares' => $this->parseDecimal($this->value($row, ['has', 'hectares'])),
                    ]
                );
            }
        });
    }

    private function readCsv(string $path)
    {
        $handle = fopen($path, 'r');
        if ($handle === false) {
            return collect();
        }

        $rows = collect();
        $headers = null;

        while (($data = fgetcsv($handle, 0, ',')) !== false) {
            $data = array_map(
                fn ($value) => trim((string) mb_convert_encoding($value, 'UTF-8', 'ISO-8859-1')),
                $data
            );

            if ($headers === null) {
                $headers = $data;
                continue;
            }

            if (count(array_filter($data, fn ($v) => $v !== '')) === 0) {
                continue;
            }

            $row = [];
            foreach ($headers as $i => $header) {
                $row[$header] = $data[$i] ?? '';
            }
            $rows->push($row);
        }

        fclose($handle);

        return $rows;
    }

    private function value(array $row, array $keys): string
    {
        foreach ($keys as $key) {
            if (array_key_exists($key, $row)) {
                return trim((string) $row[$key]);
            }
        }

        return '';
    }

    private function parseInt(string $value): ?int
    {
        if ($value === '') {
            return null;
        }

        $value = str_replace(['.', ','], ['', ''], $value);
        return is_numeric($value) ? (int) $value : null;
    }

    private function parseDecimal(string $value): ?float
    {
        if ($value === '') {
            return null;
        }

        $value = str_replace(' ', '', $value);
        if (str_contains($value, ',') && !str_contains($value, '.')) {
            $value = str_replace(',', '.', $value);
        }

        return is_numeric($value) ? (float) $value : null;
    }
}

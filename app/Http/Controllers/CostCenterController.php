<?php

namespace App\Http\Controllers;

use App\Models\CostCenter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class CostCenterController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('MasterTables/CostCenters/Index', [
            'costCenters' => CostCenter::withCount(['crops', 'plantings', 'tasks'])
                ->orderBy('code')
                ->get(),
        ]);
    }

    public function downloadTemplate()
    {
        $headers = [
            'codigo',
            'nombre',
            'Esp',
            'Var',
            'Estado',
            'Año Plant',
            'Marco Plantación',
            'Cant Plantas',
            'has',
        ];

        $csv = implode(',', $headers) . "\n";

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="centros_costo_template.csv"',
        ]);
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt',
        ]);

        $companyId = auth()->user()->company_id;
        $path = $request->file('file')->getRealPath();

        Log::info('Cost centers import: recibido archivo', [
            'path' => $path,
            'company_id' => $companyId,
            'original_name' => $request->file('file')->getClientOriginalName(),
            'size' => $request->file('file')->getSize(),
        ]);

        $rows = $this->readCsv($path);
        if ($rows->isEmpty()) {
            return back()->with('error', 'El archivo esta vacio o no tiene filas.');
        }

        $errors = [];
        $created = 0;
        $total = $rows->count();

        DB::beginTransaction();
        try {
            foreach ($rows as $index => $row) {
                $rowNumber = $index + 2;
                $result = $this->processImportRow($row, $companyId);
                if ($result['status'] === 'error') {
                    $errors[] = "Fila {$rowNumber}: {$result['message']}";
                    continue;
                }
                $created++;
            }

            if ($errors) {
                DB::rollBack();
                return back()->with('import_errors', $errors);
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Cost centers import: fallo inesperado', ['error' => $e->getMessage()]);
            return back()->with('error', 'Fallo inesperado: ' . $e->getMessage());
        }

        return back()->with('success', "Importacion de centros de costo exitosa. Creados/actualizados: {$created} de {$total}");
    }

    private function processImportRow(array $row, int $companyId): array
    {
        $code = $this->value($row, ['codigo', 'code']);
        $name = $this->value($row, ['nombre', 'name']);

        if ($code === '' || $name === '') {
            return ['status' => 'error', 'message' => 'codigo y nombre son obligatorios'];
        }

        CostCenter::updateOrCreate(
            [
                'company_id' => $companyId,
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

        return ['status' => 'ok'];
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

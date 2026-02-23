<?php

namespace App\Console\Commands;

use App\Models\Crop;
use App\Models\Field;
use App\Models\Species;
use App\Models\Variety;
use Illuminate\Console\Command;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ImportCropsFromCsv extends Command
{
    protected $signature = 'crops:import {file : Ruta al CSV} {--company= : ID de la compañia (por defecto, compañía del usuario no aplica en CLI)}';

    protected $description = 'Importa cuarteles en masa usando nombres de especie, campo y variedades (separadas por |).';

    public function handle(): int
    {
        $path = $this->argument('file');
        if (!file_exists($path)) {
            $this->error("No se encontró el archivo: {$path}");
            return self::FAILURE;
        }

        $companyId = $this->option('company');
        if (!$companyId) {
            $this->error('Debe especificar --company con el ID de la compañía.');
            return self::FAILURE;
        }

        $rows = $this->readCsv($path);
        if ($rows->isEmpty()) {
            $this->warn('Archivo sin filas.');
            return self::SUCCESS;
        }

        $this->info("Procesando {$rows->count()} filas...");
        Log::info('Crops import CLI: filas leidas', ['count' => $rows->count(), 'company_id' => $companyId]);
        $errors = [];
        $created = 0;

        DB::beginTransaction();
        try {
            foreach ($rows as $index => $row) {
                $rowNumber = $index + 2; // considerando encabezado en fila 1
                $result = $this->processRow($row, $companyId);
                if ($result['status'] === 'error') {
                    $errors[] = "Fila {$rowNumber}: {$result['message']}";
                    continue;
                }
                $created++;
            }

            if ($errors) {
                DB::rollBack();
                $this->error('Se encontraron errores; no se creó ningún cuartel:');
                foreach ($errors as $error) {
                    $this->line(" - {$error}");
                }
                return self::FAILURE;
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            $this->error('Fallo inesperado: ' . $e->getMessage());
            return self::FAILURE;
        }

        $this->info("Importación exitosa. Cuarteles creados: {$created}");
        return self::SUCCESS;
    }

    private function readCsv(string $path): Collection
    {
        $handle = fopen($path, 'r');
        if ($handle === false) {
            return collect();
        }

        $firstLine = fgets($handle);
        if ($firstLine === false) {
            fclose($handle);
            return collect();
        }
        $delimiter = $this->detectDelimiter($firstLine);
        Log::info('Crops import CLI: delimitador detectado', ['delimiter' => $delimiter]);
        rewind($handle);

        $rows = collect();
        $headers = null;
        while (($data = fgetcsv($handle, 0, $delimiter)) !== false) {
            if ($headers === null) {
                $headers = array_map(function ($h) {
                    $h = trim($h);
                    return preg_replace('/^\xEF\xBB\xBF/', '', $h);
                }, $data);
                Log::info('Crops import CLI: headers detectados', ['headers' => $headers]);
                continue;
            }
            if (count(array_filter($data, fn ($v) => trim((string) $v) !== '')) === 0) {
                continue; // fila vacía
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

    private function detectDelimiter(string $line): string
    {
        $comma = substr_count($line, ',');
        $semicolon = substr_count($line, ';');
        return $semicolon > $comma ? ';' : ',';
    }

    private function processRow(array $row, int $companyId): array
    {
        $speciesName = trim($row['species_name'] ?? '');
        $fieldName = trim($row['field_name'] ?? '');
        $varietyNames = trim($row['variety_names'] ?? '');
        $name = trim($row['name'] ?? '');
        $scientificName = trim($row['scientific_name'] ?? '');
        $daysToHarvest = trim($row['days_to_harvest'] ?? '');
        $notes = trim($row['notes'] ?? '');

        if ($speciesName === '') {
            return ['status' => 'error', 'message' => 'species_name es obligatorio'];
        }

        $species = $this->findByName(Species::class, $speciesName, $companyId);
        if (!$species) {
            return ['status' => 'error', 'message' => "Especie '{$speciesName}' no encontrada o ambigua"];
        }

        $fieldId = null;
        if ($fieldName !== '') {
            $field = $this->findByName(Field::class, $fieldName, $companyId);
            if (!$field) {
                return ['status' => 'error', 'message' => "Campo '{$fieldName}' no encontrado o ambiguo"];
            }
            $fieldId = $field->id;
        }

        $varietyIds = [];
        if ($varietyNames !== '') {
            $names = array_filter(array_map('trim', explode('|', $varietyNames)));
            foreach ($names as $vn) {
                $variety = Variety::where('species_id', $species->id)
                    ->whereRaw('LOWER(name) = ?', [mb_strtolower($vn)])
                    ->first();
                if (!$variety) {
                    return ['status' => 'error', 'message' => "Variedad '{$vn}' no pertenece a la especie '{$speciesName}'"];
                }
                $varietyIds[] = $variety->id;
            }
        }

        if ($daysToHarvest !== '' && !is_numeric($daysToHarvest)) {
            return ['status' => 'error', 'message' => 'days_to_harvest debe ser numérico'];
        }

        $primaryVarietyId = Arr::first($varietyIds);

        $payload = [
            'company_id' => $companyId,
            'field_id' => $fieldId,
            'species_id' => $species->id,
            'variety_id' => $primaryVarietyId,
            'name' => $name !== '' ? $name : $species->name,
            'variety' => null,
            'scientific_name' => $scientificName ?: null,
            'days_to_harvest' => $daysToHarvest !== '' ? (int) $daysToHarvest : null,
            'notes' => $notes ?: null,
        ];

        $crop = Crop::create($payload);
        if ($varietyIds) {
            $crop->varieties()->sync($varietyIds);
        }

        return ['status' => 'ok'];
    }

    private function findByName(string $model, string $name, int $companyId)
    {
        return $model::where(function ($q) use ($name) {
            $q->whereRaw('LOWER(name) = ?', [mb_strtolower($name)]);
        })
            ->where(function ($q) use ($companyId) {
                $q->where('company_id', $companyId)
                    ->orWhereNull('company_id');
            })
            ->first();
    }
}

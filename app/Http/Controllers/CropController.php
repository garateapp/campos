<?php

namespace App\Http\Controllers;

use App\Models\Crop;
use App\Models\Family;
use App\Models\Species;
use App\Models\Variety;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class CropController extends Controller
{
    /**
     * Display a listing of crops.
     */
    public function index(): Response
    {
        $crops = Crop::with(['species.family', 'varietyEntity', 'varieties', 'field'])
            ->withCount('plantings')
            ->orderBy('name')
            ->get()
            ->map(fn ($crop) => [
                'id' => $crop->id,
                'name' => $crop->name,
                'family_name' => $crop->species?->family?->name,
                'species_name' => $crop->species?->name,
                'variety_name' => $crop->varieties->pluck('name')->filter()->unique()->implode(', ') ?: ($crop->varietyEntity?->name ?? $crop->variety),
                'scientific_name' => $crop->scientific_name,
                'days_to_harvest' => $crop->days_to_harvest,
                'plantings_count' => $crop->plantings_count,
                'field_name' => $crop->field?->name,
            ]);

        return Inertia::render('Crops/Index', [
            'crops' => $crops,
        ]);
    }

    /**
     * Show the form for creating a new crop.
     */
    public function create(): Response
    {
        $families = Family::with(['species.varieties'])->orderBy('name')->get();
        $fields = \App\Models\Field::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Crops/Form', [
            'crop' => null,
            'families' => $families,
            'fields' => $fields,
        ]);
    }

    /**
     * Store a newly created crop.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'field_id' => 'nullable|exists:fields,id',
            'species_id' => 'required|exists:species,id',
            'variety_ids' => 'nullable|array',
            'variety_ids.*' => 'exists:varieties,id',
            'name' => 'nullable|string|max:255', // Optional override
            'variety' => 'nullable|string|max:255', // Optional override
            'scientific_name' => 'nullable|string|max:255',
            'days_to_harvest' => 'nullable|integer|min:1',
            'notes' => 'nullable|string|max:1000',
        ]);

        $primaryVarietyId = Arr::first($validated['variety_ids'] ?? []) ?: null;
        $payload = Arr::except($validated, ['variety_ids']);

        // If name is not provided, use species name
        if (empty($payload['name'])) {
            $species = Species::find($payload['species_id']);
            $payload['name'] = $species->name;
        }

        $crop = Crop::create([
            'company_id' => auth()->user()->company_id,
            'variety_id' => $primaryVarietyId,
            ...$payload,
        ]);

        if (!empty($validated['variety_ids'])) {
            $crop->varieties()->sync($validated['variety_ids']);
        }

        return redirect()->route('crops.index')->with('success', 'Cultivo creado exitosamente.');
    }

    /**
     * Show the form for editing the specified crop.
     */
    public function edit(Crop $crop): Response
    {
        $families = Family::with(['species.varieties'])->orderBy('name')->get();
        $fields = \App\Models\Field::orderBy('name')->get(['id', 'name']);
        $crop->load(['species.family', 'varieties']);

        return Inertia::render('Crops/Form', [
            'crop' => array_merge($crop->toArray(), [
                'family_id' => $crop->species?->family_id,
                'variety_ids' => $crop->varieties->pluck('id'),
            ]),
            'families' => $families,
            'fields' => $fields,
        ]);
    }

    /**
     * Update the specified crop.
     */
    public function update(Request $request, Crop $crop)
    {
        $validated = $request->validate([
            'field_id' => 'nullable|exists:fields,id',
            'species_id' => 'required|exists:species,id',
            'variety_ids' => 'nullable|array',
            'variety_ids.*' => 'exists:varieties,id',
            'name' => 'nullable|string|max:255',
            'variety' => 'nullable|string|max:255',
            'scientific_name' => 'nullable|string|max:255',
            'days_to_harvest' => 'nullable|integer|min:1',
            'notes' => 'nullable|string|max:1000',
        ]);

        $primaryVarietyId = Arr::first($validated['variety_ids'] ?? []) ?: null;
        $payload = Arr::except($validated, ['variety_ids']);

        $crop->update([
            'company_id' => auth()->user()->company_id,
            'variety_id' => $primaryVarietyId,
            ...$payload,
        ]);

        if (array_key_exists('variety_ids', $validated)) {
            $crop->varieties()->sync($validated['variety_ids'] ?? []);
        }

        return redirect()->route('crops.index')->with('success', 'Cultivo actualizado.');
    }

    /**
     * Remove the specified crop.
     */
    public function destroy(Crop $crop)
    {
        if ($crop->plantings()->exists()) {
            return redirect()->back()->with('error', 'No se puede eliminar un cultivo con siembras asociadas.');
        }

        $crop->delete();

        return redirect()->route('crops.index')->with('success', 'Cultivo eliminado.');
    }

    /**
     * Import crops from a CSV using names (species_name, field_name, variety_names separated by |).
     */
    public function import(Request $request)
    {
        Log::info('Crops import: inicio controlador', [
            'has_file' => $request->hasFile('file'),
            'route' => $request->path(),
            'user_id' => optional($request->user())->id,
        ]);

        $request->validate([
            'file' => 'required|file|mimes:csv,txt',
        ]);

        $companyId = auth()->user()->company_id;
        $path = $request->file('file')->getRealPath();
        Log::info('Crops import: recibido archivo', [
            'path' => $path,
            'company_id' => $companyId,
            'original_name' => $request->file('file')->getClientOriginalName(),
            'size' => $request->file('file')->getSize(),
        ]);

        $rows = $this->readCsv($path);
        Log::info('Crops import: filas leidas', ['count' => $rows->count()]);

        if ($rows->isEmpty()) {
            return back()->with('error', 'El archivo esta vacio o no tiene filas.');
        }

        $errors = [];
        $created = 0;
        $total = $rows->count();

        DB::beginTransaction();
        try {
            foreach ($rows as $index => $row) {
                $rowNumber = $index + 2; // header is row 1
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
            Log::error('Crops import: fallo inesperado', ['error' => $e->getMessage()]);
            return back()->with('error', 'Fallo inesperado: ' . $e->getMessage());
        }

        return back()->with('success', "Importacion exitosa. Cultivos creados: {$created} de {$total}");
    }

    private function readCsv(string $path)
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
        Log::info('Crops import: delimitador detectado', ['delimiter' => $delimiter]);
        // Rebobinar luego de leer la primera linea
        rewind($handle);

        $rows = collect();
        $headers = null;
        while (($data = fgetcsv($handle, 0, $delimiter)) !== false) {
            if ($headers === null) {
                $headers = array_map(function ($h) {
                    $h = trim($h);
                    // remover BOM si existe
                    return preg_replace('/^\xEF\xBB\xBF/', '', $h);
                }, $data);
                Log::info('Crops import: headers detectados', ['headers' => $headers]);
                continue;
            }
            if (count(array_filter($data, fn ($v) => trim((string) $v) !== '')) === 0) {
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

    private function detectDelimiter(string $line): string
    {
        $commaCount = substr_count($line, ',');
        $semicolonCount = substr_count($line, ';');
        if ($semicolonCount > $commaCount) {
            return ';';
        }
        return ',';
    }

    private function processImportRow(array $row, int $companyId): array
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
            $field = $this->findByName(\App\Models\Field::class, $fieldName, $companyId);
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
            return ['status' => 'error', 'message' => 'days_to_harvest debe ser numerico'];
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

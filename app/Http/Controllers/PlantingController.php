<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\CostCenter;
use App\Models\Crop;
use App\Models\Field;
use App\Models\Harvest;
use App\Models\Planting;
use App\Models\Species;
use App\Models\Variety;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class PlantingController extends Controller
{
    /**
     * Display a listing of plantings.
     */
    public function index(Request $request): Response
    {
        $user = auth()->user();
        $fieldIds = $user->fieldScopeIds();
        $query = Planting::with(['field', 'crop.species.family', 'crop.varietyEntity'])
            ->withSum('harvests', 'quantity_kg');

        if ($fieldIds !== null) {
            $query->whereIn('field_id', $fieldIds);
        }

        // Filter by season
        if ($request->has('season')) {
            $query->where('season', $request->season);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by crop
        if ($request->has('crop_id')) {
            $query->where('crop_id', $request->crop_id);
        }

        $plantings = $query->orderByDesc('planted_date')->get()->map(fn ($p) => [
            'id' => $p->id,
            'field_name' => $p->field->name,
            'field_id' => $p->field_id,
            'crop_name' => $p->crop->name,
            'family_name' => $p->crop->species?->family?->name,
            'species_name' => $p->crop->species?->name,
            'variety_name' => $p->crop->varietyEntity?->name ?? $p->crop->variety,
            'season' => $p->season,
            'planted_date' => $p->planted_date->format('Y-m-d'),
            'expected_harvest_date' => $p->expected_harvest_date?->format('Y-m-d'),
            'planted_area_hectares' => $p->planted_area_hectares,
            'cc' => $p->cc,
            'cost_center_code' => $p->costCenter?->code,
            'status' => $p->status,
            'expected_yield_kg' => $p->expected_yield_kg,
            'total_harvested_kg' => $p->harvests_sum_quantity_kg ?? 0,
        ]);

        // Get available seasons for filter
        $seasons = Planting::distinct('season')->pluck('season')->sort()->reverse()->values();

        return Inertia::render('Plantings/Index', [
            'plantings' => $plantings,
            'seasons' => $seasons,
            'filters' => $request->only(['season', 'status', 'crop_id']),
        ]);
    }

    /**
     * Import plantings from CSV using names.
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt',
        ]);

        $companyId = auth()->user()->company_id;
        $path = $request->file('file')->getRealPath();
        Log::info('Plantings import: recibido archivo', [
            'path' => $path,
            'company_id' => $companyId,
            'original_name' => $request->file('file')->getClientOriginalName(),
            'size' => $request->file('file')->getSize(),
        ]);

        $rows = $this->readCsv($path);
        Log::info('Plantings import: filas leidas', ['count' => $rows->count()]);

        if ($rows->isEmpty()) {
            return back()->with('error', 'El archivo esta vacio o no tiene filas.');
        }

        $errors = [];
        $created = 0;
        $total = $rows->count();
        $allowedStatuses = ['plantado', 'creciendo', 'floreciendo', 'frutando', 'cosechando', 'completado', 'fallido'];

        DB::beginTransaction();
        try {
            foreach ($rows as $index => $row) {
                $rowNumber = $index + 2;
                $result = $this->processImportRow($row, $companyId, $allowedStatuses);
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
            Log::error('Plantings import: fallo inesperado', ['error' => $e->getMessage()]);
            return back()->with('error', 'Fallo inesperado: ' . $e->getMessage());
        }

        return back()->with('success', "Importacion de labores exitosa. Creadas: {$created} de {$total}");
    }

    /**
     * Show the form for creating a new planting.
     */
    public function create(): Response
    {
        $user = auth()->user();
        $fieldIds = $user->fieldScopeIds();
        $fields = Field::where('status', 'active')
            ->when($fieldIds !== null, fn ($q) => $q->whereIn('id', $fieldIds))
            ->orderBy('name')
            ->get(['id', 'name', 'area_hectares']);
        $crops = Crop::orderBy('name')->get(['id', 'name', 'variety', 'days_to_harvest']);
        $costCenters = CostCenter::orderBy('code')->get(['id', 'code', 'name', 'hectares', 'plants_count']);

        return Inertia::render('Plantings/Create', [
            'fields' => $fields,
            'crops' => $crops,
            'costCenters' => $costCenters,
        ]);
    }

    /**
     * Store a newly created planting.
     */
    public function store(Request $request)
    {
        $user = auth()->user();
        $fieldIds = $user->fieldScopeIds();
        $validated = $request->validate([
            'field_id' => 'required|exists:fields,id',
            'cost_center_id' => 'nullable|exists:cost_centers,id',
            'crop_id' => 'required|exists:crops,id',
            'season' => 'required|string|max:20',
            'planted_date' => 'required|date',
            'expected_harvest_date' => 'nullable|date|after:planted_date',
            'planted_area_hectares' => 'required|numeric|min:0.01',
            'cc' => 'nullable|string|max:50',
            'plants_count' => 'nullable|integer|min:1',
            'expected_yield_kg' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($fieldIds !== null && count($fieldIds) === 1) {
            $validated['field_id'] = $fieldIds[0];
        }

        $costCenter = null;
        if (!empty($validated['cost_center_id'])) {
            $costCenter = CostCenter::find($validated['cost_center_id']);
        } elseif (!empty($validated['cc'])) {
            $costCenter = CostCenter::where('company_id', auth()->user()->company_id)
                ->whereRaw('LOWER(code) = ?', [mb_strtolower($validated['cc'])])
                ->first();
            $validated['cost_center_id'] = $costCenter?->id;
        }

        Planting::create([
            'company_id' => auth()->user()->company_id,
            'cc' => $costCenter?->code ?? ($validated['cc'] ?? null),
            ...$validated,
        ]);

        return redirect()->route('plantings.index')->with('success', 'Labor registrada exitosamente.');
    }

    /**
     * Display the specified planting.
     */
    public function show(Planting $planting): Response
    {
        $user = auth()->user();
        $fieldIds = $user->fieldScopeIds();
        if ($fieldIds !== null && !in_array($planting->field_id, $fieldIds, true)) {
            abort(403, 'No tienes acceso a esta labor.');
        }

        $planting->load(['field', 'crop.species.family', 'crop.varietyEntity', 'activities.performer', 'harvests', 'costCenter']);

        return Inertia::render('Plantings/Show', [
            'planting' => [
                'id' => $planting->id,
                'field' => $planting->field,
                'crop' => $planting->crop,
                'season' => $planting->season,
                'planted_date' => $planting->planted_date->format('Y-m-d'),
                'expected_harvest_date' => $planting->expected_harvest_date?->format('Y-m-d'),
                'planted_area_hectares' => $planting->planted_area_hectares,
                'cc' => $planting->cc,
                'cost_center' => $planting->costCenter,
                'plants_count' => $planting->plants_count,
                'status' => $planting->status,
                'expected_yield_kg' => $planting->expected_yield_kg,
                'notes' => $planting->notes,
                'activities' => $planting->activities->map(fn ($a) => [
                    'id' => $a->id,
                    'type' => $a->type,
                    'activity_date' => $a->activity_date->format('Y-m-d'),
                    'description' => $a->description,
                    'performer_name' => $a->performer?->name,
                    'metadata' => $a->metadata,
                ]),
                'harvests' => $planting->harvests->map(fn ($h) => [
                    'id' => $h->id,
                    'harvest_date' => $h->harvest_date->format('Y-m-d'),
                    'quantity_kg' => $h->quantity_kg,
                    'quality_grade' => $h->quality_grade,
                    'price_per_kg' => $h->price_per_kg,
                    'notes' => $h->notes,
                ]),
                'total_harvested_kg' => $planting->harvests->sum('quantity_kg'),
            ],
        ]);
    }

    /**
     * Show the form for editing the specified planting.
     */
    public function edit(Planting $planting): Response
    {
        $user = auth()->user();
        $fieldIds = $user->fieldScopeIds();
        if ($fieldIds !== null && !in_array($planting->field_id, $fieldIds, true)) {
            abort(403, 'No tienes acceso a esta labor.');
        }

        $fields = Field::orderBy('name')
            ->when($fieldIds !== null, fn ($q) => $q->whereIn('id', $fieldIds))
            ->get(['id', 'name', 'area_hectares']);
        $crops = Crop::orderBy('name')->get(['id', 'name', 'variety']);
        $costCenters = CostCenter::orderBy('code')->get(['id', 'code', 'name', 'hectares', 'plants_count']);

        return Inertia::render('Plantings/Edit', [
            'planting' => array_merge($planting->toArray(), [
                'planted_date' => optional($planting->planted_date)->format('Y-m-d'),
                'expected_harvest_date' => optional($planting->expected_harvest_date)->format('Y-m-d'),
            ]),
            'fields' => $fields,
            'crops' => $crops,
            'costCenters' => $costCenters,
        ]);
    }

    /**
     * Update the specified planting.
     */
    public function update(Request $request, Planting $planting)
    {
        $user = auth()->user();
        $fieldIds = $user->fieldScopeIds();
        if ($fieldIds !== null && !in_array($planting->field_id, $fieldIds, true)) {
            abort(403, 'No tienes acceso a esta labor.');
        }

        $validated = $request->validate([
            'field_id' => 'required|exists:fields,id',
            'cost_center_id' => 'nullable|exists:cost_centers,id',
            'crop_id' => 'required|exists:crops,id',
            'season' => 'required|string|max:20',
            'planted_date' => 'required|date',
            'expected_harvest_date' => 'nullable|date|after:planted_date',
            'planted_area_hectares' => 'required|numeric|min:0.01',
            'cc' => 'nullable|string|max:50',
            'plants_count' => 'nullable|integer|min:1',
            'status' => 'required|in:plantado,creciendo,floreciendo,frutando,cosechando,completado,fallido',
            'expected_yield_kg' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($fieldIds !== null && count($fieldIds) === 1) {
            $validated['field_id'] = $fieldIds[0];
        }

        $costCenter = null;
        if (!empty($validated['cost_center_id'])) {
            $costCenter = CostCenter::find($validated['cost_center_id']);
        } elseif (!empty($validated['cc'])) {
            $costCenter = CostCenter::where('company_id', auth()->user()->company_id)
                ->whereRaw('LOWER(code) = ?', [mb_strtolower($validated['cc'])])
                ->first();
            $validated['cost_center_id'] = $costCenter?->id;
        }

        $planting->update([
            'company_id' => auth()->user()->company_id,
            'cc' => $costCenter?->code ?? ($validated['cc'] ?? null),
            ...$validated,
        ]);

        return redirect()->route('plantings.show', $planting)->with('success', 'Labor actualizada.');
    }

    /**
     * Remove the specified planting.
     */
    public function destroy(Planting $planting)
    {
        $user = auth()->user();
        $fieldIds = $user->fieldScopeIds();
        if ($fieldIds !== null && !in_array($planting->field_id, $fieldIds, true)) {
            abort(403, 'No tienes acceso a esta labor.');
        }

        $planting->delete();

        return redirect()->route('plantings.index')->with('success', 'Labor eliminada.');
    }

    private function processImportRow(array $row, int $companyId, array $allowedStatuses): array
    {
        $fieldName = trim($row['field_name'] ?? '');
        $cropName = trim($row['crop_name'] ?? '');
        $season = trim($row['season'] ?? '');
        $plantedDate = trim($row['planted_date'] ?? '');
        $expectedHarvest = trim($row['expected_harvest_date'] ?? '');
        $area = trim($row['planted_area_hectares'] ?? '');
        $cc = trim($row['cc'] ?? '');
        $plantsCount = trim($row['plants_count'] ?? '');
        $expectedYield = trim($row['expected_yield_kg'] ?? '');
        $notes = trim($row['notes'] ?? '');
        $status = trim($row['status'] ?? 'plantado');

        if ($fieldName === '' || $cropName === '' || $season === '' || $plantedDate === '' || $area === '') {
            return ['status' => 'error', 'message' => 'field_name, crop_name, season, planted_date y planted_area_hectares son obligatorios'];
        }

        $field = $this->findByName(Field::class, $fieldName, $companyId);
        if (!$field) {
            return ['status' => 'error', 'message' => "Campo '{$fieldName}' no encontrado"];
        }

        $crop = $this->findByName(Crop::class, $cropName, $companyId);
        if (!$crop) {
            return ['status' => 'error', 'message' => "Cuartel '{$cropName}' no encontrado"];
        }

        if (!in_array($status, $allowedStatuses)) {
            return ['status' => 'error', 'message' => "Estado '{$status}' no valido"];
        }

        $plantedAt = $this->parseDate($plantedDate, 'planted_date');
        if ($plantedAt === false) {
            return ['status' => 'error', 'message' => "Fecha de labor invalida: {$plantedDate}"];
        }

        $expectedAt = null;
        if ($expectedHarvest !== '') {
            $expectedAt = $this->parseDate($expectedHarvest, 'expected_harvest_date');
            if ($expectedAt === false) {
                return ['status' => 'error', 'message' => "Fecha esperada de cosecha invalida: {$expectedHarvest}"];
            }
        }

        if (!is_numeric($area)) {
            return ['status' => 'error', 'message' => 'planted_area_hectares debe ser numerico'];
        }

        if ($plantsCount !== '' && !is_numeric($plantsCount)) {
            return ['status' => 'error', 'message' => 'plants_count debe ser numerico'];
        }

        if ($expectedYield !== '' && !is_numeric($expectedYield)) {
            return ['status' => 'error', 'message' => 'expected_yield_kg debe ser numerico'];
        }

        Planting::create([
            'company_id' => $companyId,
            'field_id' => $field->id,
            'crop_id' => $crop->id,
            'season' => $season,
            'planted_date' => $plantedAt,
            'expected_harvest_date' => $expectedAt ?: null,
            'planted_area_hectares' => (float) $area,
            'cc' => $cc ?: null,
            'plants_count' => $plantsCount !== '' ? (int) $plantsCount : null,
            'status' => $status,
            'expected_yield_kg' => $expectedYield !== '' ? (float) $expectedYield : null,
            'notes' => $notes ?: null,
        ]);

        return ['status' => 'ok'];
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
        rewind($handle);

        $rows = collect();
        $headers = null;
        while (($data = fgetcsv($handle, 0, $delimiter)) !== false) {
            if ($headers === null) {
                $headers = array_map(function ($h) {
                    $h = trim($h);
                    return preg_replace('/^\xEF\xBB\xBF/', '', $h);
                }, $data);
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
        return $semicolonCount > $commaCount ? ';' : ',';
    }

    private function parseDate(string $value, string $field)
    {
        try {
            return Carbon::parse($value)->format('Y-m-d');
        } catch (\Throwable $e) {
            return false;
        }
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

    /**
     * Store a new activity for a planting.
     */
    public function storeActivity(Request $request, Planting $planting)
    {
        $validated = $request->validate([
            'type' => 'required|in:irrigation,fertilization,pest_control,pruning,scouting,other',
            'activity_date' => 'required|date',
            'description' => 'nullable|string|max:1000',
            'metadata' => 'nullable|array',
        ]);

        Activity::create([
            'company_id' => auth()->user()->company_id,
            'planting_id' => $planting->id,
            'performed_by' => auth()->id(),
            ...$validated,
        ]);

        return redirect()->back()->with('success', 'Actividad registrada.');
    }

    /**
     * Store a new harvest for a planting.
     */
    public function storeHarvest(Request $request, Planting $planting)
    {
        $validated = $request->validate([
            'harvest_date' => 'required|date',
            'quantity_kg' => 'required|numeric|min:0.01',
            'quality_grade' => 'nullable|string|max:50',
            'price_per_kg' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        Harvest::create([
            'company_id' => auth()->user()->company_id,
            'planting_id' => $planting->id,
            ...$validated,
        ]);

        // Update planting status to harvesting if still in previous states
        if (in_array($planting->status, ['planted', 'growing', 'flowering', 'fruiting'])) {
            $planting->update(['status' => 'harvesting']);
        }

        return redirect()->back()->with('success', 'Cosecha registrada.');
    }
}

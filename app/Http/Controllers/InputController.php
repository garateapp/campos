<?php

namespace App\Http\Controllers;

use App\Models\Input;
use App\Models\InputCategory;
use App\Models\InputLot;
use App\Models\InputUsage;
use App\Models\InputUsageLot;
use App\Models\Field;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class InputController extends Controller
{
    /**
     * Display a listing of inputs.
     */
    public function index(Request $request): Response
    {
        $user = auth()->user();
        $fieldIds = $user->fieldScopeIds();
        $query = Input::with('field');

        // Filter by category
        if ($request->has('input_category_id') && $request->input_category_id !== 'all') {
            $query->where('input_category_id', $request->input_category_id);
        }

        // Filter low stock
        if ($request->boolean('low_stock')) {
            $query->whereColumn('current_stock', '<=', 'min_stock_alert')
                  ->whereNotNull('min_stock_alert');
        }

        // Filter by field
        if ($request->has('field_id') && $request->field_id !== 'all') {
            $query->where('field_id', $request->field_id);
        }

        if ($fieldIds !== null) {
            $query->whereIn('field_id', $fieldIds);
        }

        $inputs = $query->orderBy('name')->get()->map(fn ($input) => [
            'id' => $input->id,
            'name' => $input->name,
            'category_name' => $input->category?->name,
            'unit' => $input->unit,
            'current_stock' => $input->current_stock,
            'min_stock_alert' => $input->min_stock_alert,
            'unit_cost' => $input->unit_cost,
            'is_low_stock' => $input->isLowStock(),
            'total_value' => $input->current_stock * ($input->unit_cost ?? 0),
            'field_name' => $input->field?->name ?? 'Bodega General',
            'field_id' => $input->field_id,
        ]);

        return Inertia::render('Inputs/Index', [
            'inputs' => $inputs,
            'fields' => Field::orderBy('name')
                ->when($fieldIds !== null, fn ($q) => $q->whereIn('id', $fieldIds))
                ->get(['id', 'name']),
            'categories' => InputCategory::orderBy('name')->get(['id', 'name']),
            'filters' => $request->only(['input_category_id', 'low_stock', 'field_id']),
        ]);
    }

    /**
     * Import inputs from CSV using names (no IDs).
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt',
        ]);

        $companyId = auth()->user()->company_id;
        $path = $request->file('file')->getRealPath();
        Log::info('Inputs import: recibido archivo', [
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
            Log::error('Inputs import: fallo inesperado', ['error' => $e->getMessage()]);
            return back()->with('error', 'Fallo inesperado: ' . $e->getMessage());
        }

        return back()->with('success', "Importacion de insumos exitosa. Creados: {$created} de {$total}");
    }

    /**
     * Download CSV template for inputs.
     */
    public function downloadTemplate()
    {
        $headers = [
            'nombre',
            'categoria',
            'unidad',
            'stock_actual',
            'alerta_minima',
            'costo_unitario',
            'fecha_factura',
            'periodo_devolucion_dias',
            'minimo_devolucion',
            'fecha_vencimiento',
            'campo',
            'notas',
        ];
        $csv = implode(',', $headers) . "\n";

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="inputs_template.csv"',
        ]);
    }

    /**
     * Show the form for creating a new input.
     */
    public function create(): Response
    {
        $user = auth()->user();
        $fieldIds = $user->fieldScopeIds();
        return Inertia::render('Inputs/Form', [
            'input' => null,
            'fields' => Field::orderBy('name')
                ->when($fieldIds !== null, fn ($q) => $q->whereIn('id', $fieldIds))
                ->get(['id', 'name']),
            'categories' => InputCategory::orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Store a newly created input.
     */
    public function store(Request $request)
    {
        $user = auth()->user();
        $fieldIds = $user->fieldScopeIds();
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'field_id' => 'nullable|exists:fields,id',
            'input_category_id' => 'required|exists:input_categories,id',
            'unit' => 'required|string|max:20',
            'current_stock' => 'required|numeric|min:0',
            'min_stock_alert' => 'nullable|numeric|min:0',
            'unit_cost' => 'nullable|numeric|min:0',
            'invoice_date' => 'nullable|date',
            'return_period_days' => 'nullable|integer|min:0',
            'return_min_quantity' => 'nullable|numeric|min:0',
            'expiration_date' => 'nullable|date',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($fieldIds !== null && count($fieldIds) === 1) {
            $validated['field_id'] = $fieldIds[0];
        }

        $input = Input::create(array_merge($validated, [
            'company_id' => auth()->user()->company_id,
        ]));

        if ($input->current_stock > 0) {
            InputLot::create([
                'company_id' => $input->company_id,
                'input_id' => $input->id,
                'quantity' => $input->current_stock,
                'remaining_quantity' => $input->current_stock,
            ]);
        }

        return redirect()->route('inputs.index')->with('success', 'Insumo creado exitosamente.');
    }

    /**
     * Display the specified input.
     */
    public function show(Input $input): Response
    {
        $user = auth()->user();
        $fieldIds = $user->fieldScopeIds();
        if ($fieldIds !== null && $input->field_id && !in_array($input->field_id, $fieldIds, true)) {
            abort(403, 'No tienes acceso a este insumo.');
        }

        $input->load('field');
        $recentUsages = InputUsage::where('input_id', $input->id)
            ->with('field')
            ->orderByDesc('usage_date')
            ->limit(20)
            ->get()
            ->map(fn ($u) => [
                'id' => $u->id,
                'usage_date' => $u->usage_date->format('Y-m-d'),
                'quantity' => $u->quantity,
                'total_cost' => $u->total_cost,
                'field_name' => $u->field?->name,
                'notes' => $u->notes,
            ]);

        return Inertia::render('Inputs/Show', [
            'input' => [
                ...$input->toArray(),
                'category_name' => $input->category?->name,
                'field_name' => $input->field?->name,
                'invoice_date' => $input->invoice_date?->format('Y-m-d'),
                'return_period_days' => $input->return_period_days,
                'return_min_quantity' => $input->return_min_quantity,
                'expiration_date' => $input->expiration_date?->format('Y-m-d'),
            ],
            'lots' => $input->lots()
                ->orderBy('created_at')
                ->get()
                ->map(fn ($lot) => [
                    'id' => $lot->id,
                    'quantity' => $lot->quantity,
                    'remaining_quantity' => $lot->remaining_quantity,
                    'created_at' => $lot->created_at->format('Y-m-d'),
                ]),
            'recentUsages' => $recentUsages,
            'fields' => Field::orderBy('name')
                ->when($fieldIds !== null, fn ($q) => $q->whereIn('id', $fieldIds))
                ->get(['id', 'name']),
        ]);
    }

    /**
     * Show the form for editing the specified input.
     */
    public function edit(Input $input): Response
    {
        $user = auth()->user();
        $fieldIds = $user->fieldScopeIds();
        if ($fieldIds !== null && $input->field_id && !in_array($input->field_id, $fieldIds, true)) {
            abort(403, 'No tienes acceso a este insumo.');
        }

        return Inertia::render('Inputs/Form', [
            'input' => array_merge($input->toArray(), [
                'invoice_date' => optional($input->invoice_date)->format('Y-m-d'),
                'expiration_date' => optional($input->expiration_date)->format('Y-m-d'),
            ]),
            'fields' => Field::orderBy('name')
                ->when($fieldIds !== null, fn ($q) => $q->whereIn('id', $fieldIds))
                ->get(['id', 'name']),
            'categories' => InputCategory::orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Update the specified input.
     */
    public function update(Request $request, Input $input)
    {
        $user = auth()->user();
        $fieldIds = $user->fieldScopeIds();
        if ($fieldIds !== null && $input->field_id && !in_array($input->field_id, $fieldIds, true)) {
            abort(403, 'No tienes acceso a este insumo.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'field_id' => 'nullable|exists:fields,id',
            'input_category_id' => 'required|exists:input_categories,id',
            'unit' => 'required|string|max:20',
            'current_stock' => 'required|numeric|min:0',
            'min_stock_alert' => 'nullable|numeric|min:0',
            'unit_cost' => 'nullable|numeric|min:0',
            'invoice_date' => 'nullable|date',
            'return_period_days' => 'nullable|integer|min:0',
            'return_min_quantity' => 'nullable|numeric|min:0',
            'expiration_date' => 'nullable|date',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($fieldIds !== null && count($fieldIds) === 1) {
            $validated['field_id'] = $fieldIds[0];
        }

        $originalStock = (float) $input->current_stock;
        $newStock = (float) $validated['current_stock'];

        DB::beginTransaction();
        try {
            $this->seedLotsIfMissing($input);
            $input->update($validated);

            $delta = $newStock - $originalStock;
            if ($delta > 0) {
                InputLot::create([
                    'company_id' => $input->company_id,
                    'input_id' => $input->id,
                    'quantity' => $delta,
                    'remaining_quantity' => $delta,
                ]);
            } elseif ($delta < 0) {
                $remaining = abs($delta);
                $lots = InputLot::where('input_id', $input->id)
                    ->where('remaining_quantity', '>', 0)
                    ->orderBy('created_at')
                    ->lockForUpdate()
                    ->get();

                foreach ($lots as $lot) {
                    if ($remaining <= 0) {
                        break;
                    }
                    $take = min($lot->remaining_quantity, $remaining);
                    $lot->decrement('remaining_quantity', $take);
                    $remaining -= $take;
                }

                if ($remaining > 0) {
                    DB::rollBack();
                    return redirect()->back()->with('error', 'No hay stock suficiente en lotes para ajustar el inventario.');
                }
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Inputs update FIFO: fallo inesperado', ['error' => $e->getMessage()]);
            return redirect()->back()->with('error', 'Fallo inesperado al actualizar el insumo.');
        }

        return redirect()->route('inputs.index')->with('success', 'Insumo actualizado.');
    }

    /**
     * Remove the specified input.
     */
    public function destroy(Input $input)
    {
        $user = auth()->user();
        $fieldIds = $user->fieldScopeIds();
        if ($fieldIds !== null && $input->field_id && !in_array($input->field_id, $fieldIds, true)) {
            abort(403, 'No tienes acceso a este insumo.');
        }

        $input->delete();

        return redirect()->route('inputs.index')->with('success', 'Insumo eliminado.');
    }

    /**
     * Record usage of an input.
     */
    public function recordUsage(Request $request, Input $input)
    {
        $user = auth()->user();
        $fieldIds = $user->fieldScopeIds();
        if ($fieldIds !== null && $input->field_id && !in_array($input->field_id, $fieldIds, true)) {
            abort(403, 'No tienes acceso a este insumo.');
        }

        $validated = $request->validate([
            'usage_date' => 'required|date',
            'quantity' => 'required|numeric|min:0.01',
            'field_id' => 'nullable|exists:fields,id',
            'activity_id' => 'nullable|exists:activities,id',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($fieldIds !== null && count($fieldIds) === 1) {
            $validated['field_id'] = $fieldIds[0];
        }

        $quantity = (float) $validated['quantity'];

        // Check if enough stock
        if ($input->current_stock < $quantity) {
            return redirect()->back()->with('error', 'Stock insuficiente.');
        }

        DB::beginTransaction();
        try {
            $this->seedLotsIfMissing($input);
            $lots = InputLot::where('input_id', $input->id)
                ->where('remaining_quantity', '>', 0)
                ->orderBy('created_at')
                ->lockForUpdate()
                ->get();

            $remaining = $quantity;
            $allocations = [];
            foreach ($lots as $lot) {
                if ($remaining <= 0) {
                    break;
                }
                $take = min($lot->remaining_quantity, $remaining);
                $lot->decrement('remaining_quantity', $take);
                $allocations[] = ['lot' => $lot, 'quantity' => $take];
                $remaining -= $take;
            }

            if ($remaining > 0) {
                DB::rollBack();
                return redirect()->back()->with('error', 'Stock insuficiente en lotes para aplicar FIFO.');
            }

            $usage = InputUsage::create([
                'company_id' => auth()->user()->company_id,
                'input_id' => $input->id,
                'usage_date' => $validated['usage_date'],
                'quantity' => $quantity,
                'field_id' => $validated['field_id'] ?? null,
                'activity_id' => $validated['activity_id'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($allocations as $allocation) {
                InputUsageLot::create([
                    'input_usage_id' => $usage->id,
                    'input_lot_id' => $allocation['lot']->id,
                    'quantity' => $allocation['quantity'],
                ]);
            }

            $input->decrement('current_stock', $quantity);
            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Inputs FIFO usage: fallo inesperado', ['error' => $e->getMessage()]);
            return redirect()->back()->with('error', 'Fallo inesperado al registrar la salida.');
        }

        return redirect()->back()->with('success', 'Uso registrado.');
    }

    /**
     * Transfer an input to another field (campo).
     */
    public function transfer(Request $request, Input $input)
    {
        $user = auth()->user();
        $fieldIds = $user->fieldScopeIds();
        if ($fieldIds !== null && $input->field_id && !in_array($input->field_id, $fieldIds, true)) {
            abort(403, 'No tienes acceso a este insumo.');
        }

        $validated = $request->validate([
            'field_id' => 'nullable|exists:fields,id',
            'quantity' => 'required|numeric|min:0.01',
        ]);

        if ($fieldIds !== null && count($fieldIds) === 1) {
            $validated['field_id'] = $fieldIds[0];
        }

        $destinationFieldId = $validated['field_id'] ?? null;
        $quantity = (float) $validated['quantity'];

        // Si no cambia, no hacemos nada
        if ($destinationFieldId === $input->field_id) {
            return redirect()->back()->with('warning', 'El insumo ya está en ese campo.');
        }

        if ($quantity > $input->current_stock) {
            return redirect()->back()->with('error', 'Stock insuficiente para mover esa cantidad.');
        }

        DB::beginTransaction();
        try {
            $this->seedLotsIfMissing($input);
            // Buscar si ya existe un insumo equivalente en el destino (mismo nombre/unidad/categoria)
            $destinationInput = Input::where('company_id', $input->company_id)
                ->where('field_id', $destinationFieldId)
                ->where('name', $input->name)
                ->where('unit', $input->unit)
                ->where('input_category_id', $input->input_category_id)
                ->lockForUpdate()
                ->first();

            if (!$destinationInput) {
                $destinationInput = Input::create([
                    'company_id' => $input->company_id,
                    'field_id' => $destinationFieldId,
                    'input_category_id' => $input->input_category_id,
                    'name' => $input->name,
                    'unit' => $input->unit,
                    'current_stock' => 0,
                    'min_stock_alert' => $input->min_stock_alert,
                    'unit_cost' => $input->unit_cost,
                    'invoice_date' => $input->invoice_date,
                    'return_period_days' => $input->return_period_days,
                    'return_min_quantity' => $input->return_min_quantity,
                    'expiration_date' => $input->expiration_date,
                    'notes' => $input->notes,
                ]);
            }

            $lots = InputLot::where('input_id', $input->id)
                ->where('remaining_quantity', '>', 0)
                ->orderBy('created_at')
                ->lockForUpdate()
                ->get();

            $remaining = $quantity;
            foreach ($lots as $lot) {
                if ($remaining <= 0) {
                    break;
                }
                $take = min($lot->remaining_quantity, $remaining);
                $lot->decrement('remaining_quantity', $take);
                InputLot::create([
                    'company_id' => $destinationInput->company_id,
                    'input_id' => $destinationInput->id,
                    'quantity' => $take,
                    'remaining_quantity' => $take,
                ]);
                $remaining -= $take;
            }

            if ($remaining > 0) {
                DB::rollBack();
                return redirect()->back()->with('error', 'Stock insuficiente en lotes para mover.');
            }

            // Actualizar stocks
            $input->decrement('current_stock', $quantity);
            $destinationInput->increment('current_stock', $quantity);
            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Inputs transfer FIFO: fallo inesperado', ['error' => $e->getMessage()]);
            return redirect()->back()->with('error', 'Fallo inesperado al mover el insumo.');
        }

        return redirect()->back()->with('success', 'Insumo movido al nuevo campo.');
    }
private function processImportRow(array $row, int $companyId): array
    {
        $name = $this->getRowValue($row, ['nombre', 'name']);
        $categoryName = $this->getRowValue($row, ['categoria', 'category', 'category_name']);
        $unit = $this->getRowValue($row, ['unidad', 'unit']);
        $currentStock = $this->getRowValue($row, ['stock_actual', 'current_stock']);
        $minStock = $this->getRowValue($row, ['alerta_minima', 'min_stock_alert']);
        $unitCost = $this->getRowValue($row, ['costo_unitario', 'unit_cost']);
        $invoiceDate = $this->getRowValue($row, ['fecha_factura', 'invoice_date']);
        $returnPeriodDays = $this->getRowValue($row, ['periodo_devolucion_dias', 'return_period_days']);
        $returnMinQuantity = $this->getRowValue($row, ['minimo_devolucion', 'return_min_quantity']);
        $expirationDate = $this->getRowValue($row, ['fecha_vencimiento', 'expiration_date']);
        $fieldName = $this->getRowValue($row, ['campo', 'parcela', 'field_name', 'field']);
        $notes = $this->getRowValue($row, ['notas', 'notes']);

        if ($name === '' || $categoryName === '' || $unit === '' || $currentStock === '') {
            return ['status' => 'error', 'message' => 'nombre, categoria, unidad y stock_actual son obligatorios'];
        }

        if (!is_numeric($currentStock)) {
            return ['status' => 'error', 'message' => 'stock_actual debe ser numerico'];
        }

        if ($minStock !== '' && !is_numeric($minStock)) {
            return ['status' => 'error', 'message' => 'alerta_minima debe ser numerico'];
        }

        if ($unitCost !== '' && !is_numeric($unitCost)) {
            return ['status' => 'error', 'message' => 'costo_unitario debe ser numerico'];
        }

        if ($returnPeriodDays !== '' && !is_numeric($returnPeriodDays)) {
            return ['status' => 'error', 'message' => 'periodo_devolucion_dias debe ser numerico'];
        }

        if ($returnMinQuantity !== '' && !is_numeric($returnMinQuantity)) {
            return ['status' => 'error', 'message' => 'minimo_devolucion debe ser numerico'];
        }

        $invoiceAt = $invoiceDate !== '' ? $this->parseDate($invoiceDate, 'fecha_factura') : null;
        if ($invoiceDate !== '' && $invoiceAt === false) {
            return ['status' => 'error', 'message' => "Fecha de factura invalida: {$invoiceDate}"];
        }

        $expiresAt = $expirationDate !== '' ? $this->parseDate($expirationDate, 'fecha_vencimiento') : null;
        if ($expirationDate !== '' && $expiresAt === false) {
            return ['status' => 'error', 'message' => "Fecha de vencimiento invalida: {$expirationDate}"];
        }

        $category = $this->findByName(InputCategory::class, $categoryName, $companyId);
        if (!$category) {
            return ['status' => 'error', 'message' => "Categoria '{$categoryName}' no encontrada"];
        }

        $field = null;
        if ($fieldName !== '' && !in_array(mb_strtolower($fieldName), ['bodega general', 'bodega', 'general'], true)) {
            $field = $this->findByName(Field::class, $fieldName, $companyId);
            if (!$field) {
                return ['status' => 'error', 'message' => "Campo '{$fieldName}' no encontrada"];
            }
        }

        $input = Input::create([
            'company_id' => $companyId,
            'field_id' => $field?->id,
            'input_category_id' => $category->id,
            'name' => $name,
            'unit' => $unit,
            'current_stock' => (float) $currentStock,
            'min_stock_alert' => $minStock !== '' ? (float) $minStock : null,
            'unit_cost' => $unitCost !== '' ? (float) $unitCost : null,
            'invoice_date' => $invoiceAt ?: null,
            'return_period_days' => $returnPeriodDays !== '' ? (int) $returnPeriodDays : null,
            'return_min_quantity' => $returnMinQuantity !== '' ? (float) $returnMinQuantity : null,
            'expiration_date' => $expiresAt ?: null,
            'notes' => $notes ?: null,
        ]);

        if ($input->current_stock > 0) {
            InputLot::create([
                'company_id' => $companyId,
                'input_id' => $input->id,
                'quantity' => $input->current_stock,
                'remaining_quantity' => $input->current_stock,
            ]);
        }

        return ['status' => 'ok'];
    }

    private function getRowValue(array $row, array $keys): string
    {
        foreach ($keys as $key) {
            foreach ($row as $rowKey => $value) {
                if (mb_strtolower((string) $rowKey) === mb_strtolower($key)) {
                    return trim((string) $value);
                }
            }
        }

        return '';
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

    private function seedLotsIfMissing(Input $input): void
    {
        if ($input->current_stock <= 0) {
            return;
        }

        if (InputLot::where('input_id', $input->id)->exists()) {
            return;
        }

        InputLot::create([
            'company_id' => $input->company_id,
            'input_id' => $input->id,
            'quantity' => $input->current_stock,
            'remaining_quantity' => $input->current_stock,
        ]);
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
}


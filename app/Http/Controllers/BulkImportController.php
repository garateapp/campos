<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\WorkerImport;
use App\Imports\VarietyImport;
use Illuminate\Support\Facades\Log;

class BulkImportController extends Controller
{
    public function import(Request $request, string $type)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,csv,xls,txt|max:10240',
        ]);

        try {
            $file = $request->file('file');

            switch ($type) {
                case 'workers':
                    Excel::import(new WorkerImport, $file);
                    break;
                case 'varieties':
                    Excel::import(new VarietyImport, $file);
                    break;
                default:
                    return response()->json(['message' => 'Tipo de importación no soportado.'], 400);
            }

            return response()->json(['message' => 'Importación completada exitosamente.']);
        } catch (\Exception $e) {
            Log::error("Error importando {$type}: " . $e->getMessage());
            return response()->json([
                'message' => 'Error durante la importación. Verifique el formato del archivo.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ImportAeshCsvRequest;
use App\Services\AeshCsvImportService;
use Illuminate\Http\JsonResponse;
use InvalidArgumentException;

class AeshImportController extends Controller
{
    public function __construct(private readonly AeshCsvImportService $importer) {}

    public function store(ImportAeshCsvRequest $request): JsonResponse
    {
        try {
            $report = $this->importer->import($request->file('file'));
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => sprintf(
                '%d profil(s) importé(s), %d ligne(s) en erreur.',
                count($report['imported']),
                count($report['errors']),
            ),
            'imported' => $report['imported'],
            'errors' => $report['errors'],
        ]);
    }
}

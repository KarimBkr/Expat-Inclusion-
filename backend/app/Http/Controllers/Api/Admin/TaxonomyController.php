<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreTaxonomyRequest;
use App\Http\Requests\Admin\UpdateTaxonomyRequest;
use App\Support\TaxonomyRegistry;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use InvalidArgumentException;

class TaxonomyController extends Controller
{
    public function index(string $type): JsonResponse
    {
        $model = $this->resolveModel($type);
        $query = $model::query();

        if ($type === 'school-levels') {
            $query->orderBy('order');
        } elseif ($type === 'countries') {
            $query->orderBy('name');
        } else {
            $query->orderBy('name');
        }

        return response()->json(['data' => $query->get()]);
    }

    public function store(StoreTaxonomyRequest $request, string $type): JsonResponse
    {
        $model = $this->resolveModel($type);
        $record = $model::create($request->validated());

        return response()->json([
            'message' => 'Entrée créée avec succès.',
            'data'    => $record,
        ], 201);
    }

    public function update(UpdateTaxonomyRequest $request, string $type, int $id): JsonResponse
    {
        $record = $this->findRecord($type, $id);
        $record->update($request->validated());

        return response()->json([
            'message' => 'Entrée mise à jour avec succès.',
            'data'    => $record->fresh(),
        ]);
    }

    public function destroy(string $type, int $id): JsonResponse
    {
        $record = $this->findRecord($type, $id);

        if (TaxonomyRegistry::isInUse($type, $record)) {
            return response()->json([
                'message' => 'Impossible de supprimer : cette entrée est utilisée par des profils.',
            ], 409);
        }

        $record->delete();

        return response()->json(['message' => 'Entrée supprimée avec succès.']);
    }

    private function resolveModel(string $type): string
    {
        try {
            return TaxonomyRegistry::model($type);
        } catch (InvalidArgumentException) {
            abort(404, 'Type de taxonomie inconnu.');
        }
    }

    private function findRecord(string $type, int $id): Model
    {
        $model = $this->resolveModel($type);

        return $model::findOrFail($id);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SearchAeshRequest;
use App\Http\Resources\AeshSearchResultResource;
use App\Models\AeshProfile;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AeshSearchController extends Controller
{
    private const PER_PAGE = 12;

    private const RELATIONS = ['user', 'specializations', 'languages', 'modalities', 'countries', 'schoolLevels'];

    public function index(SearchAeshRequest $request): AnonymousResourceCollection
    {
        $filters = $request->validated();

        $profiles = AeshProfile::published()
            ->with(self::RELATIONS)
            ->when($filters['country_id'] ?? null, fn ($q, $id) => $q->whereHas('countries', fn ($c) => $c->where('countries.id', $id)))
            ->when($filters['specialization_id'] ?? null, fn ($q, $id) => $q->whereHas('specializations', fn ($s) => $s->where('specializations.id', $id)))
            ->when($filters['modality_id'] ?? null, fn ($q, $id) => $q->whereHas('modalities', fn ($m) => $m->where('modalities.id', $id)))
            ->when($filters['school_level_id'] ?? null, fn ($q, $id) => $q->whereHas('schoolLevels', fn ($sl) => $sl->where('school_levels.id', $id)))
            ->when($filters['language_id'] ?? null, fn ($q, $id) => $q->whereHas('languages', fn ($l) => $l->where('languages.id', $id)))
            ->latest('published_at')
            ->paginate(self::PER_PAGE)
            ->withQueryString();

        return AeshSearchResultResource::collection($profiles);
    }
}

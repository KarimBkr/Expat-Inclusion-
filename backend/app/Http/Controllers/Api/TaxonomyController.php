<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Country;
use App\Models\Language;
use App\Models\Modality;
use App\Models\SchoolLevel;
use App\Models\Specialization;
use Illuminate\Http\JsonResponse;

class TaxonomyController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'countries'       => Country::query()->orderBy('name')->get(['id', 'code', 'name', 'is_aefe_network']),
            'specializations' => Specialization::query()->orderBy('name')->get(['id', 'slug', 'name']),
            'school_levels'   => SchoolLevel::query()->orderBy('order')->get(['id', 'slug', 'name', 'cycle', 'order']),
            'languages'       => Language::query()->orderBy('name')->get(['id', 'code', 'name']),
            'modalities'      => Modality::query()->orderBy('id')->get(['id', 'slug', 'name']),
        ]);
    }
}

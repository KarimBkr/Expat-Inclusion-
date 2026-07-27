<?php

namespace App\Http\Requests\Admin;

use App\Support\TaxonomyRegistry;

class UpdateTaxonomyRequest extends StoreTaxonomyRequest
{
    public function rules(): array
    {
        $type = $this->route('type');
        $id = (int) $this->route('id');

        return TaxonomyRegistry::rules($type, $id);
    }
}

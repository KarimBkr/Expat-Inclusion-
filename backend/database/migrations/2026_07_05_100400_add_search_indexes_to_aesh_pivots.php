<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Index sur la seconde colonne des pivots AESH : la clé primaire composite
 * indexe aesh_profile_id en tête, mais la recherche filtre par la taxonomie
 * (country_id, specialization_id, modality_id, school_level_id).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('aesh_profile_country', function (Blueprint $table) {
            $table->index('country_id');
        });
        Schema::table('aesh_profile_specialization', function (Blueprint $table) {
            $table->index('specialization_id');
        });
        Schema::table('aesh_profile_modality', function (Blueprint $table) {
            $table->index('modality_id');
        });
        Schema::table('aesh_profile_school_level', function (Blueprint $table) {
            $table->index('school_level_id');
        });
    }

    public function down(): void
    {
        Schema::table('aesh_profile_country', function (Blueprint $table) {
            $table->dropIndex(['country_id']);
        });
        Schema::table('aesh_profile_specialization', function (Blueprint $table) {
            $table->dropIndex(['specialization_id']);
        });
        Schema::table('aesh_profile_modality', function (Blueprint $table) {
            $table->dropIndex(['modality_id']);
        });
        Schema::table('aesh_profile_school_level', function (Blueprint $table) {
            $table->dropIndex(['school_level_id']);
        });
    }
};

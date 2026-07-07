<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('aesh_profile_specialization', function (Blueprint $table) {
            $table->foreignId('aesh_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('specialization_id')->constrained()->cascadeOnDelete();
            $table->primary(['aesh_profile_id', 'specialization_id']);
        });

        Schema::create('aesh_profile_language', function (Blueprint $table) {
            $table->foreignId('aesh_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('language_id')->constrained()->cascadeOnDelete();
            $table->primary(['aesh_profile_id', 'language_id']);
        });

        Schema::create('aesh_profile_modality', function (Blueprint $table) {
            $table->foreignId('aesh_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('modality_id')->constrained()->cascadeOnDelete();
            $table->primary(['aesh_profile_id', 'modality_id']);
        });

        Schema::create('aesh_profile_country', function (Blueprint $table) {
            $table->foreignId('aesh_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('country_id')->constrained()->cascadeOnDelete();
            $table->primary(['aesh_profile_id', 'country_id']);
        });

        Schema::create('aesh_profile_school_level', function (Blueprint $table) {
            $table->foreignId('aesh_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('school_level_id')->constrained()->cascadeOnDelete();
            $table->primary(['aesh_profile_id', 'school_level_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('aesh_profile_school_level');
        Schema::dropIfExists('aesh_profile_country');
        Schema::dropIfExists('aesh_profile_modality');
        Schema::dropIfExists('aesh_profile_language');
        Schema::dropIfExists('aesh_profile_specialization');
    }
};

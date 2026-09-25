<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Vérification renforcée par entretien (Teams/Meet/autre, hors plateforme) :
 * un niveau de confiance additionnel, distinct de la candidature (CV/LM),
 * que l'admin déclenche quand elle a un doute sur une compétence revendiquée
 * (ex. un profil qui met en avant le TSA).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('aesh_profiles', function (Blueprint $table) {
            $table->timestamp('interview_verified_at')->nullable()->after('published_at');
        });
    }

    public function down(): void
    {
        Schema::table('aesh_profiles', function (Blueprint $table) {
            $table->dropColumn('interview_verified_at');
        });
    }
};

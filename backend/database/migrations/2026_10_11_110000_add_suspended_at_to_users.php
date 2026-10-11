<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Action admin « suspendre un compte » (US-19) : bloque la connexion sans
 * supprimer le compte ni ses données. Pas de statut distinct — un simple
 * horodatage nullable, cohérent avec le reste du schéma (published_at,
 * responded_at...).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('suspended_at')->nullable()->after('scheduling_link');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('suspended_at');
        });
    }
};

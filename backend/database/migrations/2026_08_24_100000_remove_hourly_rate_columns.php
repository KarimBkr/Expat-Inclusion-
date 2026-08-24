<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Le tarif horaire disparaît du produit : la rémunération de l'AESH se règle
 * directement entre la famille et l'accompagnant, hors plateforme.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('aesh_profiles', function (Blueprint $table) {
            $table->dropColumn('hourly_rate');
        });

        Schema::table('booking_requests', function (Blueprint $table) {
            $table->dropColumn('hourly_rate');
        });
    }

    public function down(): void
    {
        Schema::table('aesh_profiles', function (Blueprint $table) {
            $table->decimal('hourly_rate', 8, 2)->nullable();
        });

        Schema::table('booking_requests', function (Blueprint $table) {
            $table->decimal('hourly_rate', 8, 2)->nullable();
        });
    }
};

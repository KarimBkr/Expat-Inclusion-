<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Lien de planification réutilisable (page de réservation Google Calendar,
 * Microsoft Bookings, ou équivalent) : évite à l'admin de créer un nouveau
 * rendez-vous et de copier son lien à chaque invitation à entretien. Reste
 * un simple lien externe mémorisé — aucune intégration calendrier, aucune
 * lecture/écriture d'agenda depuis la plateforme.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('scheduling_link')->nullable()->after('email');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('scheduling_link');
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Les notes internes admin (US-08) ne portaient jusqu'ici que sur un profil
 * AESH. Le cockpit admin (US-19) a aussi besoin de notes sur une demande de
 * réservation (ex. litige, suivi particulier). Plutôt qu'une table dupliquée
 * ou une relation polymorphique (sur-ingénierie pour deux cibles connues),
 * `aesh_profile_id` devient nullable et `booking_request_id` nullable
 * s'ajoute : une note référence l'un ou l'autre, jamais les deux, contrôlé
 * en validation (StoreAdminNoteRequest) plutôt qu'en contrainte SQL.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('admin_notes', function (Blueprint $table) {
            $table->foreignId('booking_request_id')->nullable()->after('aesh_profile_id')
                ->constrained()->cascadeOnDelete();
        });

        Schema::table('admin_notes', function (Blueprint $table) {
            $table->unsignedBigInteger('aesh_profile_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('admin_notes', function (Blueprint $table) {
            $table->dropForeign(['booking_request_id']);
            $table->dropColumn('booking_request_id');
            $table->unsignedBigInteger('aesh_profile_id')->nullable(false)->change();
        });
    }
};

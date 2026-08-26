<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Ajoute le statut `confirmed` (US-14/US-15), atteint uniquement via le
 * webhook de paiement — jamais par une action utilisateur directe.
 * `changed_by` devient nullable : la confirmation par webhook n'a pas
 * d'utilisateur Laravel authentifié à l'origine (US-15, acteur "Système").
 *
 * MySQL (dev/prod) : `ALTER TABLE ... MODIFY COLUMN` en SQL brut plutôt que
 * `Blueprint::change()` — doctrine/dbal n'est pas installé (et ne le sera
 * pas pour ce seul usage : son support des ENUM MySQL est fragile).
 *
 * SQLite (tests uniquement — jamais utilisé en dev/prod, voir .env) : Laravel
 * y compile `enum()` en contrainte CHECK et ne permet ni ALTER COLUMN ni
 * modification de CHECK après coup. On recrée les deux tables avec le schéma
 * final via le Schema Builder — sûr ici : SQLite ne sert qu'aux tests,
 * toujours rejoués depuis une base vide (RefreshDatabase), ces tables sont
 * donc systématiquement vides au moment où cette migration s'exécute.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            $this->upSqlite();

            return;
        }

        DB::statement("ALTER TABLE booking_requests MODIFY status ENUM('requested','accepted','declined','cancelled','confirmed') NOT NULL DEFAULT 'requested'");
        DB::statement("ALTER TABLE booking_status_histories MODIFY from_status ENUM('requested','accepted','declined','cancelled','confirmed') NULL");
        DB::statement("ALTER TABLE booking_status_histories MODIFY to_status ENUM('requested','accepted','declined','cancelled','confirmed') NOT NULL");
        DB::statement('ALTER TABLE booking_status_histories MODIFY changed_by BIGINT UNSIGNED NULL');
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            $this->downSqlite();

            return;
        }

        DB::statement('ALTER TABLE booking_status_histories MODIFY changed_by BIGINT UNSIGNED NOT NULL');
        DB::statement("ALTER TABLE booking_status_histories MODIFY to_status ENUM('requested','accepted','declined','cancelled') NOT NULL");
        DB::statement("ALTER TABLE booking_status_histories MODIFY from_status ENUM('requested','accepted','declined','cancelled') NULL");
        DB::statement("ALTER TABLE booking_requests MODIFY status ENUM('requested','accepted','declined','cancelled') NOT NULL DEFAULT 'requested'");
    }

    private function upSqlite(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::drop('booking_status_histories');
        Schema::drop('booking_requests');

        Schema::create('booking_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('aesh_profile_id')->constrained()->cascadeOnDelete();
            $table->enum('status', ['requested', 'accepted', 'declined', 'cancelled', 'confirmed'])
                ->default('requested');
            $table->string('message', 1000);
            $table->foreignId('modality_id')->constrained();
            $table->foreignId('school_level_id')->constrained();
            $table->date('start_date');
            $table->unsignedTinyInteger('hours_per_week');
            $table->string('response_reason', 500)->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();

            $table->index(['parent_id', 'status']);
            $table->index(['aesh_profile_id', 'status']);
        });

        Schema::create('booking_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_request_id')->constrained()->cascadeOnDelete();
            $table->enum('from_status', ['requested', 'accepted', 'declined', 'cancelled', 'confirmed'])->nullable();
            $table->enum('to_status', ['requested', 'accepted', 'declined', 'cancelled', 'confirmed']);
            $table->foreignId('changed_by')->nullable()->constrained('users');
            $table->string('reason', 500)->nullable();
            $table->timestamps();

            $table->index('booking_request_id');
        });

        Schema::enableForeignKeyConstraints();
    }

    private function downSqlite(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::drop('booking_status_histories');
        Schema::drop('booking_requests');

        Schema::create('booking_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('aesh_profile_id')->constrained()->cascadeOnDelete();
            $table->enum('status', ['requested', 'accepted', 'declined', 'cancelled'])->default('requested');
            $table->string('message', 1000);
            $table->foreignId('modality_id')->constrained();
            $table->foreignId('school_level_id')->constrained();
            $table->date('start_date');
            $table->unsignedTinyInteger('hours_per_week');
            $table->string('response_reason', 500)->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();

            $table->index(['parent_id', 'status']);
            $table->index(['aesh_profile_id', 'status']);
        });

        Schema::create('booking_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_request_id')->constrained()->cascadeOnDelete();
            $table->enum('from_status', ['requested', 'accepted', 'declined', 'cancelled'])->nullable();
            $table->enum('to_status', ['requested', 'accepted', 'declined', 'cancelled']);
            $table->foreignId('changed_by')->constrained('users');
            $table->string('reason', 500)->nullable();
            $table->timestamps();

            $table->index('booking_request_id');
        });

        Schema::enableForeignKeyConstraints();
    }
};

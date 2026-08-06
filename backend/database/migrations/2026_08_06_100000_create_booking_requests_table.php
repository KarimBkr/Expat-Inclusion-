<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('aesh_profile_id')->constrained()->cascadeOnDelete();
            $table->enum('status', ['requested', 'accepted', 'declined', 'cancelled'])
                ->default('requested');
            $table->string('message', 1000);
            $table->foreignId('modality_id')->constrained();
            $table->foreignId('school_level_id')->constrained();
            $table->date('start_date');
            $table->unsignedTinyInteger('hours_per_week');
            // Tarif figé à la création : le paiement (US-14) ne doit pas suivre
            // une révision de tarif faite après la demande.
            $table->decimal('hourly_rate', 8, 2);
            $table->string('response_reason', 500)->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();

            $table->index(['parent_id', 'status']);
            $table->index(['aesh_profile_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_requests');
    }
};

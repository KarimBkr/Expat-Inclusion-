<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_request_id')->constrained()->cascadeOnDelete();
            $table->string('stripe_checkout_session_id')->unique();
            $table->string('stripe_payment_intent_id')->nullable();
            // Frais de mise en relation fixe, en centimes — jamais un tarif
            // AESH : l'argent ne transite jamais vers l'AESH via la plateforme.
            $table->unsignedInteger('amount');
            $table->string('currency', 3)->default('eur');
            $table->enum('status', ['pending', 'paid', 'failed'])->default('pending')->index();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index('booking_request_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};

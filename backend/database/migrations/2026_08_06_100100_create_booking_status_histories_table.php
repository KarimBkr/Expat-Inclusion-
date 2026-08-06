<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
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
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_status_histories');
    }
};

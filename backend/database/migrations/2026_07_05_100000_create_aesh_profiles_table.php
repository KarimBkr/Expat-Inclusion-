<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('aesh_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->text('bio');
            $table->decimal('hourly_rate', 8, 2);
            $table->unsignedTinyInteger('experience_years')->nullable();
            $table->string('timezone');
            $table->string('phone', 30)->nullable();
            $table->enum('verification_status', ['pending', 'approved', 'rejected'])->default('pending')->index();
            $table->boolean('is_published')->default(false)->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('aesh_profiles');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parent_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('country_id')->constrained();
            $table->string('timezone');
            $table->string('phone', 30)->nullable();
            $table->string('child_first_name', 50);
            $table->foreignId('school_level_id')->constrained();
            $table->foreignId('specialization_id')->constrained();
            $table->string('child_brief', 500)->nullable();
            $table->boolean('consent_terms');
            $table->boolean('consent_data_processing');
            $table->boolean('consent_marketing')->default(false);
            $table->timestamp('consented_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parent_profiles');
    }
};

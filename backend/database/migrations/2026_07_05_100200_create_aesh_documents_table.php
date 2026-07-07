<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('aesh_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('aesh_profile_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->string('original_name');
            $table->string('path');
            $table->unsignedInteger('size');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending')->index();
            $table->string('rejection_reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('aesh_documents');
    }
};

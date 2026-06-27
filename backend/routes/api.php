<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ContactController;
use Illuminate\Support\Facades\Route;

// ── Public ────────────────────────────────────────────────────────────────────
Route::post('/contact', [ContactController::class, 'store'])->middleware('throttle:5,1');

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// ── Authentifié ───────────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::post('/email/resend', [AuthController::class, 'resendVerification'])
        ->middleware('throttle:6,1');
    Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
        ->middleware('signed')
        ->name('verification.verify');

    // Routes parent uniquement
    Route::middleware('role:parent')->prefix('parent')->group(function (): void {
        // US-04 et suivants
    });

    // Routes AESH uniquement
    Route::middleware('role:aesh')->prefix('aesh')->group(function (): void {
        // US-05 et suivants
    });

    // Routes admin uniquement
    Route::middleware('role:admin')->prefix('admin')->group(function (): void {
        // US-07 et suivants
    });
});

<?php

use App\Http\Controllers\Api\Admin\AeshProfileController as AdminAeshProfileController;
use App\Http\Controllers\Api\Admin\TaxonomyController as AdminTaxonomyController;
use App\Http\Controllers\Api\AeshDetailController;
use App\Http\Controllers\Api\AeshDocumentController;
use App\Http\Controllers\Api\AeshProfileController;
use App\Http\Controllers\Api\AeshSearchController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingRequestController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\ParentProfileController;
use App\Http\Controllers\Api\TaxonomyController;
use Illuminate\Support\Facades\Route;

// ── Public ────────────────────────────────────────────────────────────────────
Route::post('/contact', [ContactController::class, 'store'])->middleware('throttle:5,1');
Route::get('/taxonomies', [TaxonomyController::class, 'index']);

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

    // Demandes de réservation — parent auteur et AESH destinataire (policy)
    Route::prefix('bookings')->group(function (): void {
        Route::get('/', [BookingRequestController::class, 'index']);
        Route::post('/', [BookingRequestController::class, 'store'])->middleware('role:parent');
        Route::get('/{booking}', [BookingRequestController::class, 'show']);
        Route::post('/{booking}/accept', [BookingRequestController::class, 'accept'])->middleware('role:aesh');
        Route::post('/{booking}/decline', [BookingRequestController::class, 'decline'])->middleware('role:aesh');
        Route::post('/{booking}/cancel', [BookingRequestController::class, 'cancel']);
    });

    // Routes parent uniquement
    Route::middleware('role:parent')->prefix('parent')->group(function (): void {
        Route::get('/profile', [ParentProfileController::class, 'show']);
        Route::post('/profile', [ParentProfileController::class, 'store']);
        Route::put('/profile', [ParentProfileController::class, 'update']);

        Route::get('/aesh-search', [AeshSearchController::class, 'index']);
        Route::get('/aesh-profiles/{id}', [AeshDetailController::class, 'show'])->whereNumber('id');
    });

    // Routes AESH uniquement
    Route::middleware('role:aesh')->prefix('aesh')->group(function (): void {
        Route::get('/profile', [AeshProfileController::class, 'show']);
        Route::post('/profile', [AeshProfileController::class, 'store']);
        Route::put('/profile', [AeshProfileController::class, 'update']);

        Route::get('/documents', [AeshDocumentController::class, 'index']);
        Route::post('/documents', [AeshDocumentController::class, 'store']);
        Route::get('/documents/{document}/download', [AeshDocumentController::class, 'download']);
        Route::delete('/documents/{document}', [AeshDocumentController::class, 'destroy']);
    });

    // Routes admin uniquement
    Route::middleware('role:admin')->prefix('admin')->group(function (): void {
        Route::get('/taxonomies/{type}', [AdminTaxonomyController::class, 'index']);
        Route::post('/taxonomies/{type}', [AdminTaxonomyController::class, 'store']);
        Route::put('/taxonomies/{type}/{id}', [AdminTaxonomyController::class, 'update']);
        Route::delete('/taxonomies/{type}/{id}', [AdminTaxonomyController::class, 'destroy']);

        Route::get('/aesh-profiles', [AdminAeshProfileController::class, 'index']);
        Route::get('/aesh-profiles/{id}', [AdminAeshProfileController::class, 'show']);
        Route::post('/aesh-profiles/{id}/approve', [AdminAeshProfileController::class, 'approve']);
        Route::post('/aesh-profiles/{id}/reject', [AdminAeshProfileController::class, 'reject']);
        Route::post('/aesh-profiles/{id}/publish', [AdminAeshProfileController::class, 'publish']);
        Route::post('/aesh-profiles/{id}/notes', [AdminAeshProfileController::class, 'storeNote']);
    });
});

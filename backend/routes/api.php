<?php

use App\Http\Controllers\Api\ContactController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/contact', [ContactController::class, 'store'])->middleware('throttle:5,1');

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

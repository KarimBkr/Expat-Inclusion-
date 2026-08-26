<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'stripe' => [
        'key'             => env('STRIPE_KEY'),
        'secret'          => env('STRIPE_SECRET'),
        'webhook_secret'  => env('STRIPE_WEBHOOK_SECRET'),
        // Frais de mise en relation fixe, en centimes — pas un tarif AESH.
        // Valeur ajustable sans changement de code (décision commerciale de
        // la cliente, susceptible d'évoluer).
        'platform_fee_amount' => (int) env('STRIPE_PLATFORM_FEE_AMOUNT', 2000),
        'currency'        => env('STRIPE_CURRENCY', 'eur'),
    ],

];

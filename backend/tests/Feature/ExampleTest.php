<?php

namespace Tests\Feature;

// use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * A basic test example.
     */
    public function test_api_health_check_retourne_200(): void
    {
        $response = $this->get('/up');

        $response->assertStatus(200);
    }
}

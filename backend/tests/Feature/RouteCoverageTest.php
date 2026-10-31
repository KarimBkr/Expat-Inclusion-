<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Route;
use Tests\TestCase;

/**
 * Filet de sécurité transverse : chaque route de routes/api.php doit figurer
 * dans ROUTES avec son niveau d'accès. Une route ajoutée sans être déclarée ici
 * fait échouer la suite ; chaque route protégée est appelée en invité (401) et
 * avec chaque rôle non autorisé (403). L'ownership est testé dans les tests métier.
 */
class RouteCoverageTest extends TestCase
{
    use RefreshDatabase;

    private const ROLES = ['parent', 'aesh', 'admin'];

    /** 'public' = sans authentification, 'auth' = tout rôle connecté, sinon le rôle requis. */
    private const ROUTES = [
        // Public
        'POST api/contact'         => 'public',
        'GET api/taxonomies'       => 'public',
        'POST api/stripe/webhook'  => 'public',
        'POST api/register'        => 'public',
        'POST api/login'           => 'public',
        'POST api/forgot-password' => 'public',
        'POST api/reset-password'  => 'public',

        // Partagées (tout utilisateur connecté, ownership vérifié par policy)
        'POST api/logout'                          => 'auth',
        'GET api/me'                               => 'auth',
        'POST api/email/resend'                    => 'auth',
        'GET api/email/verify/{id}/{hash}'         => 'auth',
        'GET api/bookings'                         => 'auth',
        'GET api/bookings/{booking}'               => 'auth',
        'POST api/bookings/{booking}/cancel'       => 'auth',
        'GET api/bookings/{booking}/conversation'  => 'auth',
        'POST api/firebase/token'                  => 'auth',
        'GET api/conversations'                    => 'auth',
        'GET api/notifications'                    => 'auth',
        'POST api/notifications/read-all'          => 'auth',
        'POST api/notifications/{notification}/read' => 'auth',

        // Parent
        'POST api/bookings'                    => 'parent',
        'POST api/bookings/{booking}/pay'      => 'parent',
        'GET api/parent/profile'               => 'parent',
        'POST api/parent/profile'              => 'parent',
        'PUT api/parent/profile'               => 'parent',
        'GET api/parent/aesh-search'           => 'parent',
        'GET api/parent/aesh-profiles/{id}'    => 'parent',

        // AESH
        'POST api/bookings/{booking}/accept'          => 'aesh',
        'POST api/bookings/{booking}/decline'         => 'aesh',
        'GET api/aesh/profile'                        => 'aesh',
        'POST api/aesh/profile'                       => 'aesh',
        'PUT api/aesh/profile'                        => 'aesh',
        'GET api/aesh/documents'                      => 'aesh',
        'POST api/aesh/documents'                     => 'aesh',
        'GET api/aesh/documents/{document}/download'  => 'aesh',
        'DELETE api/aesh/documents/{document}'        => 'aesh',

        // Admin
        'GET api/admin/taxonomies/{type}'                       => 'admin',
        'POST api/admin/taxonomies/{type}'                      => 'admin',
        'PUT api/admin/taxonomies/{type}/{id}'                  => 'admin',
        'DELETE api/admin/taxonomies/{type}/{id}'               => 'admin',
        'GET api/admin/aesh-profiles'                           => 'admin',
        'GET api/admin/aesh-profiles/{id}'                      => 'admin',
        'POST api/admin/aesh-profiles/{id}/approve'             => 'admin',
        'POST api/admin/aesh-profiles/{id}/reject'              => 'admin',
        'POST api/admin/aesh-profiles/{id}/publish'             => 'admin',
        'POST api/admin/aesh-profiles/{id}/interview-invitation' => 'admin',
        'POST api/admin/aesh-profiles/{id}/interview-verify'    => 'admin',
        'DELETE api/admin/aesh-profiles/{id}/interview-verify'  => 'admin',
        'POST api/admin/aesh-profiles/{id}/notes'               => 'admin',
        'GET api/admin/aesh-documents/{document}/download'      => 'admin',
        'POST api/admin/aesh-import'                            => 'admin',
        'GET api/admin/bookings'                                => 'admin',
        'GET api/admin/bookings/{id}'                           => 'admin',
        'POST api/admin/bookings/{id}/notes'                    => 'admin',
        'GET api/admin/users'                                   => 'admin',
        'GET api/admin/users/{id}'                              => 'admin',
        'POST api/admin/users/{id}/suspend'                     => 'admin',
        'POST api/admin/users/{id}/reactivate'                  => 'admin',
    ];

    /** @return list<string> "METHOD uri" de chaque route enregistrée sous api/ */
    private function registeredApiRoutes(): array
    {
        $keys = [];
        foreach (app('router')->getRoutes() as $route) {
            /** @var Route $route */
            if (! str_starts_with($route->uri(), 'api/')) {
                continue;
            }
            foreach (array_diff($route->methods(), ['HEAD']) as $method) {
                $keys[] = "{$method} {$route->uri()}";
            }
        }

        return $keys;
    }

    private function statusFor(string $key, ?User $user = null): int
    {
        [$method, $uri] = explode(' ', $key, 2);
        // Identifiants inexistants : les contrôles d'accès doivent répondre avant toute recherche.
        $url = '/'.preg_replace('/\{[^}]+\}/', '999', $uri);
        if ($user) {
            $this->actingAs($user);
        }

        return $this->json($method, $url)->getStatusCode();
    }

    public function test_chaque_route_api_est_declaree_dans_la_table(): void
    {
        $registered = $this->registeredApiRoutes();

        $this->assertSame([], array_values(array_diff($registered, array_keys(self::ROUTES))), 'Routes sans test d\'accès : ajoutez-les à ROUTES.');
        $this->assertSame([], array_values(array_diff(array_keys(self::ROUTES), $registered)), 'Routes déclarées mais supprimées de api.php.');
    }

    public function test_chaque_route_protegee_refuse_un_invite(): void
    {
        foreach (self::ROUTES as $key => $access) {
            if ($access === 'public') {
                continue;
            }
            $this->assertSame(401, $this->statusFor($key), "{$key} doit répondre 401 à un invité.");
        }
    }

    public function test_chaque_route_de_role_refuse_les_autres_roles(): void
    {
        $users = [];
        foreach (self::ROLES as $role) {
            $users[$role] = User::factory()->create(['role' => $role]);
        }

        foreach (self::ROUTES as $key => $access) {
            if (! in_array($access, self::ROLES, true)) {
                continue;
            }
            foreach (array_diff(self::ROLES, [$access]) as $role) {
                $this->assertSame(403, $this->statusFor($key, $users[$role]), "{$key} doit répondre 403 au rôle {$role}.");
            }
        }
    }

    public function test_un_compte_suspendu_ne_peut_plus_appeler_l_api(): void
    {
        foreach (self::ROLES as $role) {
            $user = User::factory()->create(['role' => $role, 'suspended_at' => now()]);

            $this->actingAs($user)->getJson('/api/me')->assertForbidden();
            $this->actingAs($user)->getJson('/api/bookings')->assertForbidden();
        }

        $parent = User::factory()->create(['role' => 'parent', 'suspended_at' => now()]);
        $this->actingAs($parent)->getJson('/api/parent/profile')->assertForbidden();
    }

    public function test_inscription_connexion_et_mot_de_passe_oublie_sont_limites(): void
    {
        $limits = [
            '/api/register'        => 5,
            '/api/login'           => 10,
            '/api/forgot-password' => 5,
            '/api/reset-password'  => 5,
        ];

        foreach ($limits as $url => $max) {
            for ($i = 0; $i < $max; $i++) {
                $this->assertNotSame(429, $this->postJson($url, [])->getStatusCode(), "{$url} bloqué trop tôt.");
            }
            $this->postJson($url, [])->assertStatus(429);
        }
    }
}

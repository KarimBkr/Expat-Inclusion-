<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UploadAeshDocumentRequest;
use App\Http\Resources\AeshDocumentResource;
use App\Models\AeshDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AeshDocumentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $profile = $request->user()->aeshProfile;

        if (! $profile) {
            return response()->json(['documents' => []]);
        }

        return response()->json([
            'documents' => AeshDocumentResource::collection(
                $profile->documents()->latest()->get()
            ),
        ]);
    }

    public function store(UploadAeshDocumentRequest $request): JsonResponse
    {
        $profile = $request->user()->aeshProfile;

        if (! $profile) {
            return response()->json([
                'message' => 'Créez d\'abord votre profil AESH avant d\'ajouter des documents.',
            ], 409);
        }

        $file = $request->file('file');
        $path = $file->store("aesh-documents/{$profile->id}", 'local');

        $document = $profile->documents()->create([
            'type'          => $request->validated('type'),
            'original_name' => $file->getClientOriginalName(),
            'path'          => $path,
            'size'          => $file->getSize(),
        ]);

        return response()->json([
            'message'  => 'Document envoyé. Il sera examiné par notre équipe.',
            'document' => new AeshDocumentResource($document),
        ], 201);
    }

    public function destroy(Request $request, AeshDocument $document): JsonResponse
    {
        $this->authorizeOwnership($request, $document);

        if ($document->status === AeshDocument::STATUS_APPROVED) {
            return response()->json([
                'message' => 'Un document déjà validé ne peut pas être supprimé.',
            ], 403);
        }

        Storage::disk('local')->delete($document->path);
        $document->delete();

        return response()->json(['message' => 'Document supprimé.']);
    }

    public function download(Request $request, AeshDocument $document): StreamedResponse
    {
        $this->authorizeOwnership($request, $document);

        abort_unless(Storage::disk('local')->exists($document->path), 404);

        return Storage::disk('local')->download($document->path, $document->original_name);
    }

    private function authorizeOwnership(Request $request, AeshDocument $document): void
    {
        abort_unless(
            $document->aeshProfile->user_id === $request->user()->id,
            403,
            'Accès refusé.'
        );
    }
}

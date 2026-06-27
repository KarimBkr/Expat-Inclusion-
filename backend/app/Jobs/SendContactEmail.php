<?php

namespace App\Jobs;

use App\Mail\ContactReceived;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendContactEmail implements ShouldQueue
{
    use Queueable, InteractsWithQueue, SerializesModels;

    public function __construct(private readonly array $data) {}

    public function handle(): void
    {
        Mail::to(config('mail.from.address'))
            ->send(new ContactReceived($this->data));
    }
}

"use client";

import { useState } from "react";

/** Saisie du motif obligatoire lors d'un refus ou d'une annulation. */
export function ReasonForm({
  label,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  label: string;
  submitLabel: string;
  onSubmit: (reason: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(reason);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 bg-cream border border-line rounded-xl">
      <label htmlFor="reason" className="block text-xs font-medium text-subtle mb-1.5">
        {label}
      </label>
      <textarea
        id="reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        minLength={5}
        maxLength={500}
        required
        className="w-full px-3 py-2 rounded-xl border border-line bg-white text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
      />
      <div className="flex gap-3 mt-3">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark disabled:opacity-50 transition-colors"
        >
          {submitting ? "Envoi…" : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-line text-sm font-medium rounded-xl hover:border-primary transition-colors"
        >
          Retour
        </button>
      </div>
    </form>
  );
}

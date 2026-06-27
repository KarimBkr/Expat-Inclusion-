"use client";

import { AlertCircle, CheckCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { type ContactPayload, sendContactMessage } from "@/services/contact";

const roles = [
  { value: "parent", label: "Parent / Famille" },
  { value: "aesh", label: "AESH" },
  { value: "autre", label: "Autre" },
];

const emptyForm: ContactPayload = {
  name: "",
  email: "",
  role: "",
  subject: "",
  message: "",
};

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-line bg-card text-ink text-sm placeholder:text-subtle/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

export default function ContactPage() {
  const [form, setForm] = useState<ContactPayload>(emptyForm);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      await sendContactMessage(form);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Une erreur est survenue.");
    }
  };

  if (status === "success") {
    return (
      <div className="py-32 px-4 text-center">
        <CheckCircle size={52} className="text-primary mx-auto mb-5" />
        <h1 className="text-3xl font-bold text-ink mb-3">Message envoyé !</h1>
        <p className="text-subtle max-w-sm mx-auto">
          Notre équipe vous répondra dans les plus brefs délais. Pensez à vérifier vos spams.
        </p>
      </div>
    );
  }

  return (
    <div className="py-16 px-4">
      <div className="max-w-xl mx-auto">
        <h1 className="text-4xl font-bold text-ink mb-3">Contactez-nous</h1>
        <p className="text-subtle mb-10">
          Une question, une suggestion ou besoin d&apos;aide ? Remplissez le formulaire ci-dessous.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-sm font-medium text-ink">
                Nom complet <span className="text-danger">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                autoComplete="name"
                placeholder="Jean Dupont"
                value={form.name}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-ink">
                Email <span className="text-danger">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="jean@exemple.com"
                value={form.email}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="role" className="text-sm font-medium text-ink">
              Vous êtes <span className="text-danger">*</span>
            </label>
            <select
              id="role"
              name="role"
              required
              value={form.role}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="" disabled>
                Sélectionnez votre profil
              </option>
              {roles.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="subject" className="text-sm font-medium text-ink">
              Objet <span className="text-danger">*</span>
            </label>
            <input
              id="subject"
              name="subject"
              type="text"
              required
              placeholder="Objet de votre message"
              value={form.subject}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="message" className="text-sm font-medium text-ink">
              Message <span className="text-danger">*</span>
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={6}
              placeholder="Décrivez votre demande en détail…"
              value={form.message}
              onChange={handleChange}
              className={`${inputClass} resize-none`}
            />
          </div>

          {status === "error" && (
            <div className="flex items-start gap-3 px-4 py-3 bg-danger/10 border border-danger/20 rounded-xl text-sm text-danger">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              {errorMsg}
            </div>
          )}

          <Button type="submit" disabled={status === "loading"} size="lg" className="w-full">
            {status === "loading" ? "Envoi en cours…" : "Envoyer le message"}
          </Button>
        </form>
      </div>
    </div>
  );
}

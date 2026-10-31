"use client";

import Link from "next/link";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Spinner } from "@/components/ui/Spinner";
import {
  createTaxonomy,
  deleteTaxonomy,
  listTaxonomy,
  updateTaxonomy,
} from "@/services/admin-taxonomies";
import type { TaxonomyMeta, TaxonomyRecord, TaxonomyType } from "@/types/admin";
import type { ApiError } from "@/types/auth";

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-line bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary";

type FieldDef = {
  key: string;
  label: string;
  type: "text" | "number" | "checkbox";
  maxLength?: number;
  placeholder?: string;
};

const FIELDS: Record<TaxonomyType, FieldDef[]> = {
  countries: [
    {
      key: "code",
      label: "Code ISO (2 lettres)",
      type: "text",
      maxLength: 2,
      placeholder: "FR",
    },
    { key: "name", label: "Nom", type: "text", placeholder: "France" },
    { key: "is_aefe_network", label: "Réseau AEFE", type: "checkbox" },
  ],
  specializations: [
    { key: "slug", label: "Slug", type: "text", placeholder: "tsa" },
    { key: "name", label: "Nom", type: "text", placeholder: "TSA" },
  ],
  languages: [
    {
      key: "code",
      label: "Code",
      type: "text",
      maxLength: 5,
      placeholder: "fr",
    },
    { key: "name", label: "Nom", type: "text", placeholder: "Français" },
  ],
  "school-levels": [
    { key: "slug", label: "Slug", type: "text", placeholder: "cp" },
    { key: "name", label: "Nom", type: "text", placeholder: "CP" },
    { key: "cycle", label: "Cycle", type: "text", placeholder: "Cycle 2" },
    { key: "order", label: "Ordre", type: "number", placeholder: "1" },
  ],
  modalities: [
    { key: "slug", label: "Slug", type: "text", placeholder: "presentiel" },
    { key: "name", label: "Nom", type: "text", placeholder: "Présentiel" },
  ],
};

function emptyForm(type: TaxonomyType): Record<string, string | boolean> {
  const form: Record<string, string | boolean> = {};
  for (const field of FIELDS[type]) {
    form[field.key] = field.type === "checkbox" ? false : "";
  }
  return form;
}

function recordToForm(
  type: TaxonomyType,
  record: TaxonomyRecord
): Record<string, string | boolean> {
  const form = emptyForm(type);
  for (const field of FIELDS[type]) {
    const val = record[field.key];
    if (field.type === "checkbox") {
      form[field.key] = Boolean(val);
    } else {
      form[field.key] = val != null ? String(val) : "";
    }
  }
  return form;
}

export function TaxonomyManager({ meta }: { meta: TaxonomyMeta }) {
  const [items, setItems] = useState<TaxonomyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState<Record<string, string | boolean>>(() => emptyForm(meta.type));
  const [editingId, setEditingId] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      setItems(await listTaxonomy(meta.type));
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [meta.type]);

  useEffect(() => {
    load();
  }, [load]);

  function resetForm() {
    setForm(emptyForm(meta.type));
    setEditingId(null);
    setFieldErrors({});
  }

  function startEdit(record: TaxonomyRecord) {
    setEditingId(record.id);
    setForm(recordToForm(meta.type, record));
    setFieldErrors({});
    setSuccess("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setFieldErrors({});
    setGlobalError("");
    setSuccess("");

    const payload: Record<string, unknown> = {};
    for (const field of FIELDS[meta.type]) {
      const val = form[field.key];
      if (field.type === "checkbox") {
        payload[field.key] = Boolean(val);
      } else if (field.type === "number") {
        payload[field.key] = Number(val);
      } else {
        payload[field.key] = String(val).trim();
      }
    }

    try {
      const result =
        editingId != null
          ? await updateTaxonomy(meta.type, editingId, payload)
          : await createTaxonomy(meta.type, payload);
      setSuccess(result.message);
      resetForm();
      await load();
    } catch (err) {
      const apiErr = err as ApiError & { errors?: Record<string, string[]> };
      if (apiErr.errors) {
        const flat: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(apiErr.errors)) {
          flat[key] = msgs[0];
        }
        setFieldErrors(flat);
      } else {
        setGlobalError(apiErr.message ?? "Une erreur est survenue.");
      }
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(id: number) {
    setConfirmId(null);
    setGlobalError("");
    setSuccess("");
    try {
      const result = await deleteTaxonomy(meta.type, id);
      if (editingId === id) resetForm();
      setSuccess(result.message);
      await load();
    } catch (err) {
      setGlobalError((err as Error).message);
    }
  }

  const columns = FIELDS[meta.type];

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard/admin" className="text-sm text-subtle hover:text-ink">
          ← Administration
        </Link>
        <h1 className="text-2xl font-bold text-ink mt-3">{meta.label}</h1>
        <p className="text-sm text-subtle mt-1">
          Gérer les {meta.label.toLowerCase()} du référentiel métier.
        </p>
      </div>

      {globalError && (
        <div role="alert" className="mb-4 p-3 bg-danger/10 text-danger text-sm rounded-lg">
          {globalError}
        </div>
      )}
      {success && (
        <div role="status" className="mb-4 p-3 bg-primary-light text-primary text-sm rounded-lg">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-card border border-line rounded-2xl p-6 h-fit">
          <h2 className="font-semibold text-ink mb-4">
            {editingId ? "Modifier" : "Ajouter"} un {meta.singular}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {FIELDS[meta.type].map((field) => (
              <div key={field.key}>
                {field.type === "checkbox" ? (
                  <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(form[field.key])}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.checked })}
                      className="accent-primary"
                    />
                    {field.label}
                  </label>
                ) : (
                  <>
                    <label htmlFor={field.key} className="block text-sm font-medium text-ink mb-1">
                      {field.label}
                    </label>
                    <input
                      id={field.key}
                      type={field.type}
                      value={String(form[field.key] ?? "")}
                      maxLength={field.maxLength}
                      placeholder={field.placeholder}
                      required
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      className={inputClass}
                    />
                  </>
                )}
                {fieldErrors[field.key] && (
                  <p className="mt-1 text-xs text-danger">{fieldErrors[field.key]}</p>
                )}
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={pending}
                className="flex-1 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark disabled:opacity-60"
              >
                {pending ? "Enregistrement…" : editingId ? "Mettre à jour" : "Ajouter"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2.5 text-sm text-subtle border border-line rounded-xl hover:bg-cream"
                >
                  Annuler
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="lg:col-span-2 bg-card border border-line rounded-2xl overflow-hidden">
          {loading ? (
            <Spinner label="Chargement des entrées…" />
          ) : loadError ? (
            <ErrorState message="Impossible de charger les données." onRetry={load} />
          ) : items.length === 0 ? (
            <EmptyState
              title="Aucune entrée pour le moment."
              hint="Ajoutez la première avec le formulaire."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-cream/50">
                    {columns.map((col) => (
                      <th key={col.key} className="text-left px-4 py-3 font-medium text-subtle">
                        {col.label}
                      </th>
                    ))}
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-line last:border-0">
                      {columns.map(({ key }) => (
                        <td key={key} className="px-4 py-3 text-ink">
                          {typeof item[key] === "boolean"
                            ? item[key]
                              ? "Oui"
                              : "Non"
                            : String(item[key] ?? "—")}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {confirmId === item.id ? (
                          <>
                            <span className="text-xs text-subtle mr-3">Supprimer ?</span>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="text-danger text-xs font-semibold hover:underline mr-3"
                            >
                              Confirmer la suppression
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmId(null)}
                              className="text-subtle text-xs font-medium hover:underline"
                            >
                              Annuler
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              className="text-primary text-xs font-medium hover:underline mr-3"
                            >
                              Modifier
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmId(item.id)}
                              className="text-danger text-xs font-medium hover:underline"
                            >
                              Supprimer
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

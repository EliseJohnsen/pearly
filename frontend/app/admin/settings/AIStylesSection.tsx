"use client";

import { useState, useEffect } from "react";
import { authenticatedFetch } from "@/lib/auth";
import { PencilIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";

interface AIStyle {
  id: number;
  code: string;
  name: string;
  description: string;
  style_prompt: string;
  negative_prompt: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface ValidationResult {
  valid: boolean;
  message?: string;
}

interface StyleFormData {
  code: string;
  name: string;
  description: string;
  style_prompt: string;
  negative_prompt: string;
  is_active: boolean;
  sort_order: number;
}

const EMPTY_FORM: StyleFormData = {
  code: "",
  name: "",
  description: "",
  style_prompt: "",
  negative_prompt: "",
  is_active: true,
  sort_order: 0,
};

export default function AIStylesSection() {
  const [styles, setStyles] = useState<AIStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<StyleFormData>(EMPTY_FORM);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [styleToDelete, setStyleToDelete] = useState<AIStyle | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  useEffect(() => {
    fetchStyles();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchStyles = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await authenticatedFetch(`${apiUrl}/api/admin/ai-styles`);

      if (!response.ok) {
        throw new Error("Kunne ikke laste AI-stiler");
      }

      const data = await response.json();
      setStyles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noe gikk galt");
    } finally {
      setLoading(false);
    }
  };

  const validateCode = (code: string, originalCode?: string): ValidationResult => {
    if (!code) return { valid: false, message: "Kode er påkrevd" };
    if (!/^[a-z0-9-]{1,50}$/.test(code)) {
      return { valid: false, message: "1-50 små bokstaver, tall og bindestrek" };
    }
    const existingCodes = styles.map((s) => s.code);
    if (code !== originalCode && existingCodes.includes(code)) {
      return { valid: false, message: "Kode finnes allerede" };
    }
    return { valid: true };
  };

  const validateName = (name: string): ValidationResult => {
    if (!name) return { valid: false, message: "Navn er påkrevd" };
    if (name.length > 100) {
      return { valid: false, message: "Navn må være maks 100 tegn" };
    }
    return { valid: true };
  };

  const validateDescription = (desc: string): ValidationResult => {
    if (!desc) return { valid: false, message: "Beskrivelse er påkrevd" };
    return { valid: true };
  };

  const validatePrompt = (prompt: string): ValidationResult => {
    if (!prompt) return { valid: false, message: "Prompt er påkrevd" };
    return { valid: true };
  };

  const isFormValid = (form: StyleFormData, isEdit: boolean = false): boolean => {
    return (
      validateCode(form.code, isEdit ? editingCode || undefined : undefined).valid &&
      validateName(form.name).valid &&
      validateDescription(form.description).valid &&
      validatePrompt(form.style_prompt).valid &&
      validatePrompt(form.negative_prompt).valid
    );
  };

  const handleSaveStyle = async () => {
    if (!isFormValid(form, isEditMode)) return;

    try {
      setActionInProgress(true);
      setError(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      if (isEditMode && editingCode) {
        // Update existing style
        const response = await authenticatedFetch(`${apiUrl}/api/admin/ai-styles/${editingCode}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            description: form.description,
            style_prompt: form.style_prompt,
            negative_prompt: form.negative_prompt,
            is_active: form.is_active,
            sort_order: form.sort_order,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Kunne ikke oppdatere stil");
        }

        setSuccessMessage("Stil oppdatert!");
      } else {
        // Create new style
        const response = await authenticatedFetch(`${apiUrl}/api/admin/ai-styles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Kunne ikke legge til stil");
        }

        setSuccessMessage("Stil lagt til!");
      }

      setShowForm(false);
      setForm(EMPTY_FORM);
      setIsEditMode(false);
      setEditingCode(null);
      await fetchStyles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noe gikk galt");
    } finally {
      setActionInProgress(false);
    }
  };

  const startEdit = (style: AIStyle) => {
    setEditingCode(style.code);
    setIsEditMode(true);
    setShowForm(true);
    setForm({
      code: style.code,
      name: style.name,
      description: style.description,
      style_prompt: style.style_prompt,
      negative_prompt: style.negative_prompt,
      is_active: style.is_active,
      sort_order: style.sort_order,
    });
  };

  const startAdd = () => {
    setIsEditMode(false);
    setEditingCode(null);
    setShowForm(true);
    setForm(EMPTY_FORM);
  };

  const cancelForm = () => {
    setShowForm(false);
    setForm(EMPTY_FORM);
    setIsEditMode(false);
    setEditingCode(null);
  };

  const handleDeleteClick = (style: AIStyle) => {
    setStyleToDelete(style);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!styleToDelete) return;

    try {
      setActionInProgress(true);
      setError(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await authenticatedFetch(`${apiUrl}/api/admin/ai-styles/${styleToDelete.code}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Kunne ikke slette stil");
      }

      setSuccessMessage("Stil slettet!");
      setDeleteModalOpen(false);
      setStyleToDelete(null);
      await fetchStyles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noe gikk galt");
      setDeleteModalOpen(false);
      setStyleToDelete(null);
    } finally {
      setActionInProgress(false);
    }
  };

  const truncate = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple"></div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">AI-genereringsstiler</h1>
        <p className="text-gray-600">
          Administrer stiler for AI-bildegenerering. Disse stilene brukes når brukere laster opp bilder.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      <div className="mb-4">
        <button
          onClick={() => showForm ? cancelForm() : startAdd()}
          className="px-4 py-2 bg-purple text-white rounded-md hover:bg-purple/90 font-medium flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          {showForm && !isEditMode ? "Avbryt" : "Legg til ny stil"}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-6 bg-white shadow-md rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">
            {isEditMode ? "Rediger stil" : "Legg til ny stil"}
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toLowerCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple focus:border-transparent font-mono"
                  placeholder="f.eks. wpap"
                  disabled={isEditMode}
                />
                {isEditMode && (
                  <p className="text-xs text-gray-500 mt-1">Kan ikke endres</p>
                )}
                {!isEditMode && form.code && !validateCode(form.code).valid && (
                  <p className="text-xs text-red-600 mt-1">{validateCode(form.code).message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Navn <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple focus:border-transparent"
                  placeholder="F.eks. WPAP Pop Art"
                />
                {form.name && !validateName(form.name).valid && (
                  <p className="text-xs text-red-600 mt-1">{validateName(form.name).message}</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Beskrivelse (vises til sluttbruker) <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple focus:border-transparent"
                rows={2}
                placeholder="Moderne pop art-stil med flate geometriske former..."
              />
              {form.description && !validateDescription(form.description).valid && (
                <p className="text-xs text-red-600 mt-1">{validateDescription(form.description).message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Style Prompt <span className="text-red-500">*</span>
                <span className="text-gray-500 text-xs ml-2">Prompt sendt til AI-modellen</span>
              </label>
              <textarea
                value={form.style_prompt}
                onChange={(e) => setForm({ ...form, style_prompt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple focus:border-transparent font-mono text-sm"
                rows={4}
                placeholder="create modern pop art illustration, flat geometric shapes..."
              />
              {form.style_prompt && !validatePrompt(form.style_prompt).valid && (
                <p className="text-xs text-red-600 mt-1">{validatePrompt(form.style_prompt).message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Negative Prompt <span className="text-red-500">*</span>
                <span className="text-gray-500 text-xs ml-2">Det AI-modellen skal unngå</span>
              </label>
              <textarea
                value={form.negative_prompt}
                onChange={(e) => setForm({ ...form, negative_prompt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple focus:border-transparent font-mono text-sm"
                rows={3}
                placeholder="realistic photo, smooth gradients..."
              />
              {form.negative_prompt && !validatePrompt(form.negative_prompt).valid && (
                <p className="text-xs text-red-600 mt-1">{validatePrompt(form.negative_prompt).message}</p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 text-purple border-gray-300 rounded focus:ring-purple"
                  />
                  <span className="text-sm font-medium text-gray-700">Aktiv</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rekkefølge
                  <span className="text-gray-500 text-xs ml-2">Lavere tall vises først</span>
                </label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple focus:border-transparent"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSaveStyle}
              disabled={!isFormValid(form, isEditMode) || actionInProgress}
              className="px-4 py-2 bg-purple text-white rounded-md hover:bg-purple/90 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
              {actionInProgress ? (isEditMode ? "Oppdaterer..." : "Legger til...") : (isEditMode ? "Oppdater" : "Legg til")}
            </button>
            <button
              onClick={cancelForm}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium"
            >
              Avbryt
            </button>
          </div>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-primary-light">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Kode</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Navn</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Beskrivelse</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Aktiv</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Rekkefølge</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Handlinger</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {styles.map((style) => (
              <tr key={style.code} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-mono text-sm font-medium text-gray-900">{style.code}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">{style.name}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{truncate(style.description, 100)}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-sm ${style.is_active ? "text-green-600" : "text-gray-400"}`}>
                    {style.is_active ? "✓" : "✗"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600">{style.sort_order}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => startEdit(style)}
                    className="text-purple hover:text-purple/80 mr-3"
                    title="Rediger"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(style)}
                    className="text-red-600 hover:text-red-900"
                    title="Slett"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-600">Totalt {styles.length} stil(er)</p>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && styleToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Bekreft sletting</h2>
            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                Er du sikker på at du vil slette stilen <strong>{styleToDelete.name}</strong> (
                <code className="bg-gray-100 px-1 rounded font-mono text-sm">{styleToDelete.code}</code>)?
              </p>
              <p className="text-sm text-red-600 mt-2">
                Denne handlingen kan ikke angres. Hvis stilen er i bruk av mønstre, vil slettingen blokkeres.
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setStyleToDelete(null);
                }}
                disabled={actionInProgress}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Avbryt
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={actionInProgress}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionInProgress ? "Sletter..." : "Slett"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

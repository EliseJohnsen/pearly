"use client";

import { useState, useEffect } from "react";
import { authenticatedFetch } from "@/lib/auth";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { PencilIcon, TrashIcon, XMarkIcon, CheckIcon, PlusIcon } from "@heroicons/react/24/outline";

interface Color {
  name: string;
  code: string;
  hex: string;
}

interface ValidationResult {
  valid: boolean;
  message?: string;
}

interface EditFormData {
  name: string;
  code: string;
  hex: string;
}

const ColorSwatch = ({ hex }: { hex: string }) => (
  <div
    className="w-6 h-6 rounded-full border border-gray-300 flex-shrink-0"
    style={{ backgroundColor: hex }}
    title={hex}
  />
);

export default function SettingsPage() {
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormData>({ name: "", code: "", hex: "" });
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<EditFormData>({ name: "", code: "", hex: "" });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [colorToDelete, setColorToDelete] = useState<Color | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  useEffect(() => {
    fetchColors();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchColors = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await authenticatedFetch(`${apiUrl}/api/perle-colors`);

      if (!response.ok) {
        throw new Error("Kunne ikke laste farger");
      }

      const data = await response.json();
      setColors(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noe gikk galt");
    } finally {
      setLoading(false);
    }
  };

  const validateHex = (hex: string): ValidationResult => {
    if (!hex) return { valid: false, message: "Hex-kode er påkrevd" };
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      return { valid: false, message: "Ugyldig format (f.eks. #FF0000)" };
    }
    return { valid: true };
  };

  const validateCode = (code: string, originalCode?: string): ValidationResult => {
    if (!code) return { valid: false, message: "Kode er påkrevd" };
    if (!/^[A-Za-z0-9]{1,10}$/.test(code)) {
      return { valid: false, message: "1-10 alfanumeriske tegn" };
    }
    const existingCodes = colors.map((c) => c.code);
    if (code !== originalCode && existingCodes.includes(code)) {
      return { valid: false, message: "Kode finnes allerede" };
    }
    return { valid: true };
  };

  const validateName = (name: string): ValidationResult => {
    if (!name) return { valid: false, message: "Navn er påkrevd" };
    if (name.length > 50) {
      return { valid: false, message: "Navn må være maks 50 tegn" };
    }
    return { valid: true };
  };

  const isFormValid = (form: EditFormData, originalCode?: string): boolean => {
    return (
      validateName(form.name).valid &&
      validateCode(form.code, originalCode).valid &&
      validateHex(form.hex).valid
    );
  };

  const handleEditClick = (color: Color) => {
    setEditingCode(color.code);
    setEditForm({ ...color });
  };

  const handleCancelEdit = () => {
    setEditingCode(null);
    setEditForm({ name: "", code: "", hex: "" });
  };

  const handleSaveEdit = async () => {
    if (!editingCode || !isFormValid(editForm, editingCode)) return;

    setActionInProgress(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await authenticatedFetch(
        `${apiUrl}/api/admin/colors/${editingCode}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editForm),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Kunne ikke oppdatere farge");
      }

      await fetchColors();
      setSuccessMessage("Farge oppdatert!");
      setEditingCode(null);
      setEditForm({ name: "", code: "", hex: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noe gikk galt");
    } finally {
      setActionInProgress(false);
    }
  };

  const handleAddColor = async () => {
    if (!isFormValid(addForm)) return;

    setActionInProgress(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await authenticatedFetch(`${apiUrl}/api/admin/colors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Kunne ikke legge til farge");
      }

      await fetchColors();
      setSuccessMessage("Ny farge lagt til!");
      setAddForm({ name: "", code: "", hex: "" });
      setShowAddForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noe gikk galt");
    } finally {
      setActionInProgress(false);
    }
  };

  const handleDeleteClick = (color: Color) => {
    setColorToDelete(color);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!colorToDelete) return;

    setActionInProgress(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await authenticatedFetch(
        `${apiUrl}/api/admin/colors/${colorToDelete.code}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Kunne ikke slette farge");
      }

      await fetchColors();
      setSuccessMessage("Farge slettet!");
      setDeleteModalOpen(false);
      setColorToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noe gikk galt");
    } finally {
      setActionInProgress(false);
    }
  };

  if (loading) {
    return <LoadingSpinner loadingMessage="Laster innstillinger..." />;
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Innstillinger</h1>
          <p className="mt-2 text-gray-600">Administrer perlefarger</p>
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
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-purple text-white rounded-md hover:bg-purple/90 font-medium flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            {showAddForm ? "Avbryt" : "Legg til ny farge"}
          </button>
        </div>

        {showAddForm && (
          <div className="mb-6 p-6 bg-white shadow-md rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Legg til ny farge</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Forhåndsvisning
                </label>
                <ColorSwatch hex={addForm.hex || "#CCCCCC"} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Navn
                </label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple focus:border-transparent"
                  placeholder="F.eks. Sky Blue"
                />
                {addForm.name && !validateName(addForm.name).valid && (
                  <p className="text-xs text-red-600 mt-1">
                    {validateName(addForm.name).message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kode
                </label>
                <input
                  type="text"
                  value={addForm.code}
                  onChange={(e) => setAddForm({ ...addForm, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple focus:border-transparent"
                  placeholder="F.eks. 117"
                />
                {addForm.code && !validateCode(addForm.code).valid && (
                  <p className="text-xs text-red-600 mt-1">
                    {validateCode(addForm.code).message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hex-kode
                </label>
                <input
                  type="text"
                  value={addForm.hex}
                  onChange={(e) => setAddForm({ ...addForm, hex: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple focus:border-transparent font-mono"
                  placeholder="#87CEEB"
                />
                {addForm.hex && !validateHex(addForm.hex).valid && (
                  <p className="text-xs text-red-600 mt-1">
                    {validateHex(addForm.hex).message}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleAddColor}
                disabled={!isFormValid(addForm) || actionInProgress}
                className="px-4 py-2 bg-purple text-white rounded-md hover:bg-purple/90 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                {actionInProgress ? "Legger til..." : "Legg til"}
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setAddForm({ name: "", code: "", hex: "" });
                }}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Farge
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Navn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Kode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Hex
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Handlinger
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {colors.map((color) => (
                <tr key={color.code} className="hover:bg-gray-50">
                  {editingCode === color.code ? (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ColorSwatch hex={editForm.hex || "#CCCCCC"} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm({ ...editForm, name: e.target.value })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple focus:border-transparent"
                        />
                        {editForm.name && !validateName(editForm.name).valid && (
                          <p className="text-xs text-red-600 mt-1">
                            {validateName(editForm.name).message}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          value={editForm.code}
                          onChange={(e) =>
                            setEditForm({ ...editForm, code: e.target.value })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple focus:border-transparent"
                        />
                        {editForm.code && !validateCode(editForm.code, color.code).valid && (
                          <p className="text-xs text-red-600 mt-1">
                            {validateCode(editForm.code, color.code).message}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          value={editForm.hex}
                          onChange={(e) =>
                            setEditForm({ ...editForm, hex: e.target.value.toUpperCase() })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple focus:border-transparent font-mono"
                        />
                        {editForm.hex && !validateHex(editForm.hex).valid && (
                          <p className="text-xs text-red-600 mt-1">
                            {validateHex(editForm.hex).message}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={handleSaveEdit}
                          disabled={!isFormValid(editForm, color.code) || actionInProgress}
                          className="text-green-600 hover:text-green-900 mr-3 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Lagre"
                        >
                          <CheckIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={actionInProgress}
                          className="text-gray-600 hover:text-gray-900"
                          title="Avbryt"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ColorSwatch hex={color.hex} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {color.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {color.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {color.hex}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditClick(color)}
                          disabled={editingCode !== null || actionInProgress}
                          className="text-purple hover:text-purple/80 mr-4 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Rediger"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(color)}
                          disabled={editingCode !== null || actionInProgress}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Slett"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Totalt {colors.length} farger
        </div>
      </div>

      {deleteModalOpen && colorToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Bekreft sletting</h3>
            <div className="mb-4 flex items-center gap-3">
              <ColorSwatch hex={colorToDelete.hex} />
              <div>
                <p className="text-gray-900">
                  Er du sikker på at du vil slette fargen <strong>{colorToDelete.name}</strong>?
                </p>
                <p className="text-sm text-gray-600">
                  Kode: {colorToDelete.code}, Hex: {colorToDelete.hex}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Denne handlingen kan ikke angres.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setColorToDelete(null);
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

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "../components/LoadingSpinner";
import { authenticatedFetch } from "@/lib/auth";

interface Pattern {
  id: number;
  uuid: string;
  pattern_image_url: string;
  grid_size: number;
  colors_used: Array<{
    hex: string;
    name: string;
    count: number;
    code?: string;
  }>;
  created_at: string;
  boards_width?: number;
  boards_height?: number;
  pattern_data?: {
    ai_generated?: boolean;
    ai_prompt?: string;
    styled?: boolean;
    style?: string;
    sanity_product_id?: string;
  };
}

type SortField = "id" | "created_at" | null;
type SortDirection = "asc" | "desc";

export default function PatternsListPage() {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [patternToDelete, setPatternToDelete] = useState<Pattern | null>(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchPatterns = async () => {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('[patterns] Starting to fetch patterns')
          console.log('[patterns] All cookies before fetch:', document.cookie)
        }
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const response = await authenticatedFetch(`${apiUrl}/api/patterns`);

        if (!response.ok) {
          throw new Error("Kunne ikke hente mønstre");
        }

        const data = await response.json();
        setPatterns(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "En feil oppstod");
      } finally {
        setLoading(false);
      }
    };

    fetchPatterns();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("no-NO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedPatterns = React.useMemo(() => {
    if (!sortField) return patterns;

    return [...patterns].sort((a, b) => {
      let comparison = 0;

      if (sortField === "id") {
        comparison = a.id - b.id;
      } else if (sortField === "created_at") {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [patterns, sortField, sortDirection]);

  const handleRowClick = (uuid: string) => {
    router.push(`/patterns/${uuid}`);
  };

  const handleDeleteClick = (pattern: Pattern, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click navigation
    setPatternToDelete(pattern);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!patternToDelete) return;

    setDeleting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await authenticatedFetch(
        `${apiUrl}/api/patterns/${patternToDelete.uuid}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Kunne ikke slette mønster");
      }

      // Remove pattern from list
      setPatterns(patterns.filter((p) => p.uuid !== patternToDelete.uuid));
      setDeleteModalOpen(false);
      setPatternToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "En feil oppstod ved sletting");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setPatternToDelete(null);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="ml-1 text-gray-400">⇅</span>;
    }
    return (
      <span className="ml-1">
        {sortDirection === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner loadingMessage="Laster inn alle mønster..."/>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-800 font-semibold mb-2">Feil</p>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Alle perlemønstre</h1>
          <p className="mt-2 text-gray-600">
            Totalt {patterns.length} {patterns.length === 1 ? "mønster" : "mønstre"}
          </p>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Forhåndsvisning
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort("id")}
                  >
                    <div className="flex items-center">
                      ID
                      <SortIcon field="id" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    UUID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Størrelse
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Farger
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Type
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort("created_at")}
                  >
                    <div className="flex items-center">
                      Opprettet
                      <SortIcon field="created_at" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Handlinger
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedPatterns.map((pattern) => (
                  <tr
                    key={pattern.uuid}
                    onClick={() => handleRowClick(pattern.uuid)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-16 w-16 relative">
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${pattern.pattern_image_url}`}
                          alt="Pattern thumbnail"
                          className="h-full w-full object-cover rounded border border-gray-200"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900">
                        {pattern.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900">
                        {pattern.uuid.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {pattern.boards_width && pattern.boards_height ? (
                          <>
                            {pattern.boards_width * 29} × {pattern.boards_height * 29} perler
                            <div className="text-xs text-gray-500">
                              {pattern.boards_width} × {pattern.boards_height} brett
                            </div>
                          </>
                        ) : (
                          <>{pattern.grid_size} × {pattern.grid_size} perler</>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900">
                          {pattern.colors_used.length}
                        </span>
                        <div className="ml-2 flex -space-x-1">
                          {pattern.colors_used.slice(0, 3).map((color, idx) => (
                            <div
                              key={idx}
                              className="w-6 h-6 rounded-full border-2 border-white"
                              style={{ backgroundColor: color.hex }}
                              title={color.name}
                            />
                          ))}
                          {pattern.colors_used.length > 3 && (
                            <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center">
                              <span className="text-xs text-gray-600">
                                +{pattern.colors_used.length - 3}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {pattern.pattern_data?.ai_generated && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            ✨ AI-generert
                          </span>
                        )}
                        {pattern.pattern_data?.styled && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            🎨 {pattern.pattern_data.style}
                          </span>
                        )}
                        {!pattern.pattern_data?.ai_generated && !pattern.pattern_data?.styled && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            Opplastet
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(pattern.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={(e) => handleDeleteClick(pattern, e)}
                        className="text-red-600 hover:text-red-800 font-medium"
                        title="Slett mønster"
                      >
                        Slett
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {patterns.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Ingen mønstre funnet</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && patternToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Bekreft sletting
            </h2>

            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Er du sikker på at du vil slette dette mønsteret?
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-4">
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${patternToDelete.pattern_image_url}`}
                    alt="Pattern thumbnail"
                    className="h-16 w-16 object-cover rounded border border-gray-200"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      ID: {patternToDelete.id}
                    </p>
                    <p className="text-xs text-gray-500">
                      UUID: {patternToDelete.uuid.substring(0, 8)}...
                    </p>
                  </div>
                </div>
              </div>

              {patternToDelete.pattern_data?.sanity_product_id && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-yellow-800 mb-1">
                    ⚠️ Advarsel
                  </p>
                  <p className="text-sm text-yellow-700">
                    Dette mønsteret har et produkt koblet til seg i Sanity CMS.
                    Produktet vil ikke bli slettet automatisk.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleDeleteCancel}
                disabled={deleting}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium disabled:opacity-50"
              >
                Avbryt
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium disabled:opacity-50"
              >
                {deleting ? "Sletter..." : "Ja, slett mønster"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

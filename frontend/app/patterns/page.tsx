"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "../components/LoadingSpinner";

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
  const router = useRouter();

  useEffect(() => {
    const fetchPatterns = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const response = await fetch(`${apiUrl}/api/patterns`);

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
    </div>
  );
}

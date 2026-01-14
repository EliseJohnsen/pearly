"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import BeadPatternDisplay from "@/app/components/BeadPatternDisplay";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { ArrowDownTrayIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

interface Pattern {
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
    grid: string[][];
    width: number;
    height: number;
    boards_width?: number;
    boards_height?: number;
    board_size?: number;
    ai_generated?: boolean;
    ai_prompt?: string;
    ai_style?: string;
    ai_model?: string;
    styled?: boolean;
    style?: string;
    styled_image_path?: string;
  };
}

export default function PatternDetailPage() {
  const params = useParams();
  const router = useRouter();
  const uuid = params?.uuid as string;

  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    const fetchPattern = async () => {
      if (!uuid) return;

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const response = await fetch(`${apiUrl}/api/patterns/${uuid}`);

        if (!response.ok) {
          throw new Error("Kunne ikke hente mønster");
        }

        const data = await response.json();
        setPattern(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "En feil oppstod");
      } finally {
        setLoading(false);
      }
    };

    fetchPattern();
  }, [uuid]);

  const handleDownloadPDF = async () => {

    if(pattern && pattern.uuid) {
      try {
        setDownloadingPDF(true);

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const response = await fetch(`${apiUrl}/api/patterns/${pattern.uuid}/pdf`);

        if (!response.ok) {
          throw new Error("Kunne ikke generere PDF");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `perlemønster_${pattern.uuid}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error("Feil ved nedlasting av PDF:", error);
        alert("Kunne ikke laste ned PDF. Prøv igjen.");
      } finally {
        setDownloadingPDF(false);
      }
    }
    alert("Fant ikke pattern.uuid");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner loadingMessage="Laster inn mønsteret..."/>
      </div>
    );
  }

  if (error || !pattern) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-800 font-semibold mb-2">Feil</p>
          <p className="text-red-600">{error || "Mønster ikke funnet"}</p>
          <button
            onClick={() => router.push("/patterns")}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark-pink transition-colors"
          >
            Tilbake til oversikt
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push("/patterns")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Tilbake til oversikt</span>
          </button>
        </div>

        <div className="grid grid-cols-1">
          
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPDF}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              <span>{downloadingPDF ? "Genererer PDF..." : "Last ned PDF"}</span>
            </button>
          <div>
            <BeadPatternDisplay pattern={pattern} showPDFButton={true} beadSize={10} />
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Farger du trenger
            </h3>
            <div className="grid grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-2">
              {pattern.colors_used.map((color) => (
                <div
                  key={color.hex}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div
                    className="w-12 h-12 rounded-full border-2 border-gray-300 flex-shrink-0"
                    style={{ backgroundColor: color.hex }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {color.name}
                    </p>
                    {color.code && (
                      <p className="text-xs text-gray-500 font-mono">
                        {color.code}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      {color.count} perler
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Oppsummering
              </h4>
              <dl className="space-y-2">
                <div className="flex text-sm">
                  <dt className="text-gray-600 mr-3">Totalt antall farger:</dt>
                  <dd className="font-semibold text-gray-900">
                    {pattern.colors_used.length}
                  </dd>
                </div>
                <div className="flex text-sm">
                  <dt className="text-gray-600 mr-3">Totalt antall perler:</dt>
                  <dd className="font-semibold text-gray-900">
                    {pattern.colors_used.reduce((sum, color) => sum + color.count, 0)}
                  </dd>
                </div>
                {pattern.boards_width && pattern.boards_height && (
                  <div className="flex text-sm">
                    <dt className="text-gray-600 mr-3">Antall brett:</dt>
                    <dd className="font-semibold text-gray-900">
                      {pattern.boards_width * pattern.boards_height}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

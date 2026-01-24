"use client";

import React, { useState, useEffect } from "react";
import {useUIString} from '@/app/hooks/useSanityData'
import { ShoppingBagIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import CreateProductModal from "./CreateProductModal";

interface BeadPatternDisplayProps {
  pattern: {
    id: string;
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
    pattern_image_base64?: string;
    styled_image_base64?: string;
  };
  beadSize?: number;
  pop_art_url?: string;
  showPDFButton?: boolean;
}

const BeadPatternDisplay: React.FC<BeadPatternDisplayProps> = ({
  pattern,
  beadSize = 10,
  pop_art_url,
  showPDFButton = false
}) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const imageUrl = `${apiUrl}${pattern.pattern_image_url}`;
  const [patternGrid, setPatternGrid] = useState<string[][] | null>(
    pattern.pattern_data?.grid || null
  );

  const [showProductModal, setShowProductModal] = useState(false);
  const [productCreated, setProductCreated] = useState(false);
  const [productId, setProductId] = useState<number | null>(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const pearlsText = useUIString('pearls')

  // Update pattern grid when pattern data changes
  useEffect(() => {
    if (pattern.pattern_data?.grid) {
      setPatternGrid(pattern.pattern_data.grid);
    }
  }, [pattern.pattern_data]);



  const colorInfoMap = pattern.colors_used.reduce(
    (acc, color) => {
      const info = { name: color.name, hex: color.hex, code: color.code };
      acc[color.hex] = info;
      if (color.code) {
        acc[color.code] = info;
      }
      return acc;
    },
    {} as Record<string, { name: string; hex: string; code?: string }>,
  );

  const calculateTotal = (boardsWidth: number, boardsHeight: number) => {
    return boardsWidth * boardsHeight;
  }

  const handleProductCreated = (createdProductId: number) => {
    setProductId(createdProductId);
    setProductCreated(true);
    setShowProductModal(false);
  };

  const handleDownloadPDF = async () => {
    setDownloadingPDF(true);
    try {
      const response = await fetch(`${apiUrl}/api/patterns/${pattern.id}/pdf`);

      if (!response.ok) {
        throw new Error("Kunne ikke generere PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `perlemønster_${pattern.id}.pdf`;
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
  };

  return (
    <>
      {showProductModal && (
        <CreateProductModal
          pattern={pattern}
          onClose={() => setShowProductModal(false)}
          onSuccess={handleProductCreated}
        />
      )}

      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Ditt perlemønster
          </h2>
          <div className="flex items-center gap-3">
            {pattern.pattern_data?.ai_generated && (
              <div className="flex items-center gap-2 px-3 py-1 bg-purple/10 rounded-full">
                <span className="text-xl">✨</span>
                <span className="text-sm font-semibold text-purple">
                  AI-generert
                </span>
              </div>
            )}

          {showPDFButton && (
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPDF}
              className="flex items-center gap-2 px-4 py-2 bg-purple text-white hover:bg-primary-dark-pink rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              <span>{downloadingPDF ? "Genererer PDF..." : "Last ned PDF"}</span>
            </button>
          )}

            <button
              onClick={() => setShowProductModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark-pink text-white rounded-lg font-semibold transition-colors"
            >
              <ShoppingBagIcon className="w-5 h-5" />
              <span>Opprett produkt</span>
            </button>
          </div>
        </div>

        {productCreated && productId && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            ✅ Produkt opprettet! Du kan nå redigere produktet i Sanity Studio.
          </p>
        </div>
        )}

      {pattern.pattern_data?.ai_generated && pattern.pattern_data?.ai_prompt && (
        <div className="mb-6 p-4 bg-purple/5 rounded-lg border border-purple/20">
          <p className="text-sm text-gray-700">
            <strong>AI Prompt:</strong> {pattern.pattern_data.ai_prompt}
          </p>
          {pattern.pattern_data.ai_style && (
            <p className="text-xs text-gray-600 mt-1">
              Stil: {pattern.pattern_data.ai_style} | Modell: {pattern.pattern_data.ai_model || 'sdxl'}
            </p>
          )}
        </div>
      )}

        <div className="grid grid-cols-1 gap-6 mb-6">
          {pattern.pattern_data?.styled && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Stilisert bilde ({pattern.pattern_data.style})
              </h3>
              <div className="overflow-auto">
                <img
                  src={`${apiUrl}/api/patterns/${pattern.uuid}/styled-image`}
                  alt="Stilisert versjon"
                  className="w-full h-auto rounded-lg border-2 border-gray-300 shadow-md"
                />
              </div>
            </div>
          )}

          {pop_art_url && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Pop-art forhåndsvisning
              </h3>
              <div className="overflow-auto">
                <img
                  src={pop_art_url}
                  alt="Pop-art version"
                  className="w-full h-auto rounded-lg border-2 border-gray-300 shadow-md"
                />
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Perlemønster
            </h3>
            {patternGrid && patternGrid.length > 0 ? (
              <div className="overflow-auto">
                <div
                  className="grid border border-slate-300 shadow-inner bg-white rounded-md mx-auto"
                  style={{
                    gridTemplateColumns: `repeat(${patternGrid[0]?.length || 0}, ${beadSize}px)`,
                    gridTemplateRows: `repeat(${patternGrid.length}, ${beadSize}px)`,
                    width: `${(patternGrid[0]?.length || 0) * beadSize + 2}px`,
                    height: `${patternGrid.length * beadSize + 2}px`,
                    imageRendering: "pixelated",
                  }}
                >
                  {patternGrid.map((row, rowIndex) =>
                    row.map((colorCode, colIndex) => {
                      const beadInfo = colorInfoMap[colorCode] || { name: "Unknown Color", hex: "#FFFFFF" };
                      const tooltipText = `${beadInfo.name}${beadInfo.code ? ` (${beadInfo.code})` : ''} | Row: ${rowIndex + 1}, Col: ${colIndex + 1}`;

                      return (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          title={tooltipText}
                          style={{
                            width: `${beadSize}px`,
                            height: `${beadSize}px`,
                            backgroundColor: beadInfo.hex,
                            borderRadius: "50%",
                            cursor: "pointer",
                          }}
                        />
                      );
                    }),
                  )}
                </div>
              </div>
            ) : (
              <div>
                <img
                  src={imageUrl}
                  alt="Pattern"
                  className="max-w-full h-auto rounded-lg border-2 border-gray-300"
                />
              </div>
            )}
          </div>
        </div>

        <div className="mb-6 space-y-2">
          {pattern.boards_width && pattern.boards_height && (
            <>
              <p className="text-sm">
                <strong>Brett:</strong> {pattern.boards_width} × {pattern.boards_height} brett ({calculateTotal(pattern.boards_width, pattern.boards_height)} totalt)
              </p>
            </>
          )}
          { pattern.pattern_data?.width && pattern.pattern_data?.height && (
            <div>
              <p className="text-sm mb-2">
                <strong>Størrelse: </strong> {pattern.pattern_data?.width} x {pattern.pattern_data.height} { pearlsText }
              </p>
              <p className="text-sm">
                <strong>Antall perler: </strong> {pattern.pattern_data?.height * pattern.pattern_data.width} { pearlsText }
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BeadPatternDisplay;

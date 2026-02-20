"use client";

import React, { useState, useEffect } from "react";
import {useUIString} from '@/app/hooks/useSanityData'
import { ShoppingBagIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import CreateProductModal from "./CreateProductModal";
import ColorPickerModal from "./ColorPickerModal";
import { Pattern } from "../models/patternModels";

interface BeadPatternDisplayProps {
  pattern: Pattern;
  beadSize?: number;
  pop_art_url?: string;
  showPDFButton?: boolean;
  onPatternUpdate?: () => void;
}

const BeadPatternDisplay: React.FC<BeadPatternDisplayProps> = ({
  pattern,
  beadSize = 10,
  pop_art_url,
  showPDFButton = false,
  onPatternUpdate,
}) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const imageUrl = `${apiUrl}${pattern.pattern_image_url}`;
  const storageVersion = pattern.pattern_data?.storage_version || 1;
  const [patternGrid, setPatternGrid] = useState<string[][] | null>(
    pattern.pattern_data?.grid || null
  );

  const [showProductModal, setShowProductModal] = useState(false);
  const [productCreated, setProductCreated] = useState(false);
  const [productId, setProductId] = useState<number | null>(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedBead, setSelectedBead] = useState<{ row: number; col: number } | null>(null);
  const [perleColors, setPerleColors] = useState<Array<{ name: string; code: string; hex: string }>>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalGrid, setOriginalGrid] = useState<string[][] | null>(pattern.pattern_data?.grid || null);
  const [isSaving, setIsSaving] = useState(false);

  const pearlsText = useUIString('pearls')

  // Update pattern grid when pattern data changes
  useEffect(() => {
    if (pattern.pattern_data?.grid) {
      setPatternGrid(pattern.pattern_data.grid);
      setOriginalGrid(pattern.pattern_data.grid);
      setHasUnsavedChanges(false);
    }
  }, [pattern.pattern_data]);

  useEffect(() => {
    const loadColors = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/perle-colors`);
        if (response.ok) {
          const colors = await response.json();
          setPerleColors(colors);
        }
      } catch (error) {
        console.error("Failed to load perle colors:", error);
      }
    };
    loadColors();
  }, [apiUrl]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        return (e.returnValue = "");
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);


  const colorInfoMap = perleColors.reduce(
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

  const getSurroundingColors = (row: number, col: number): (string | null)[][] => {
    if (!patternGrid) return [];

    // Create a 3x3 grid with the center being the selected color
    const grid: (string | null)[][] = [
      [null, null, null],
      [null, patternGrid[row][col], null],
      [null, null, null]
    ];

    const directions = [
      [-1, -1, 0, 0], [-1, 0, 0, 1], [-1, 1, 0, 2],  // top row
      [0, -1, 1, 0],                 [0, 1, 1, 2],    // middle row (left & right)
      [1, -1, 2, 0],  [1, 0, 2, 1],  [1, 1, 2, 2]     // bottom row
    ];

    for (const [dRow, dCol, gridRow, gridCol] of directions) {
      const newRow = row + dRow;
      const newCol = col + dCol;

      if (newRow >= 0 && newRow < patternGrid.length &&
          newCol >= 0 && newCol < patternGrid[0].length) {
        grid[gridRow][gridCol] = patternGrid[newRow][newCol];
      }
    }

    // Convert color codes to hex values for display
    return grid.map(row =>
      row.map(colorCode => {
        if (!colorCode) return null;
        return colorInfoMap[colorCode]?.hex || colorCode;
      })
    );
  };

  const handleBeadClick = (row: number, col: number) => {
    setSelectedBead({ row, col });
    setShowColorPicker(true);
  };

  const calculateColorsUsed = (grid: string[][]) => {
    const colorCounts = new Map<string, number>();

    grid.forEach(row => {
      row.forEach(colorCode => {
        colorCounts.set(colorCode, (colorCounts.get(colorCode) || 0) + 1);
      });
    });

    return Array.from(colorCounts.entries()).map(([colorCode, count]) => {
      const colorInfo = colorInfoMap[colorCode];
      return {
        name: colorInfo?.name || "Unknown",
        hex: colorInfo?.hex || "#FFFFFF",
        count,
        code: colorInfo?.code || colorCode
      };
    });
  };

  const handleColorSelect = (changes: Array<{ row: number; col: number; hex: string }>) => {
    if (!patternGrid || changes.length === 0) return;

    // Create a map of changes for quick lookup
    const changeMap = new Map(
      changes.map(change => [
        `${change.row}-${change.col}`,
        storageVersion === 2
          ? (perleColors.find(c => c.hex === change.hex)?.code || "99")
          : change.hex
      ])
    );

    // Apply all changes at once
    const newGrid = patternGrid.map((row, rowIndex) =>
      row.map((color, colIndex) => {
        const key = `${rowIndex}-${colIndex}`;
        return changeMap.get(key) || color;
      })
    );

    setPatternGrid(newGrid);
    setHasUnsavedChanges(true);
    setShowColorPicker(false);
    setSelectedBead(null);
  };

  const handleSaveChanges = async () => {
    if (!patternGrid || !pattern.id) return;

    setIsSaving(true);
    try {
      const colorsUsed = calculateColorsUsed(patternGrid);

      const response = await fetch(`${apiUrl}/api/patterns/${pattern.id}/grid`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grid: patternGrid,
          colors_used: colorsUsed
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save grid changes");
      }

      setOriginalGrid(patternGrid);
      setHasUnsavedChanges(false);

      if (onPatternUpdate) {
        onPatternUpdate();
      }
    } catch (error) {
      console.error("Failed to save grid changes:", error);
      alert("Kunne ikke lagre endringene. Prøv igjen.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    if (originalGrid) {
      setPatternGrid(originalGrid);
      setHasUnsavedChanges(false);
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

      {showColorPicker && selectedBead && patternGrid && (
        <ColorPickerModal
          colors={perleColors}
          currentColor={colorInfoMap[patternGrid[selectedBead.row][selectedBead.col]]?.hex || patternGrid[selectedBead.row][selectedBead.col]}
          surroundingColors={getSurroundingColors(selectedBead.row, selectedBead.col)}
          onSelectColor={handleColorSelect}
          onClose={() => {
            setShowColorPicker(false);
            setSelectedBead(null);
          }}
          position={selectedBead}
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

        {hasUnsavedChanges && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-amber-600 font-medium">⚠️ Du har ulagrede endringer</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDiscardChanges}
                disabled={isSaving}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Forkast
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="px-4 py-2 bg-success text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "Lagrer..." : "Lagre endringer"}
              </button>
            </div>
          </div>
        )}

        {productCreated && productId && (
        <div className="mb-6 p-4 bg-success border border-green-200 rounded-lg">
          <p>
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
                          onClick={() => handleBeadClick(rowIndex, colIndex)}
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

"use client";

import React, { useState, useMemo } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface Color {
  name: string;
  code: string;
  hex: string;
}

interface ColorSwapModalProps {
  colors: Color[];
  currentGrid: string[][];
  colorInfoMap: Record<string, { name: string; hex: string; code?: string }>;
  onSwapColors: (sourceColor: string, targetColor: string) => void;
  onClose: () => void;
}

const ColorSwapModal: React.FC<ColorSwapModalProps> = ({
  colors,
  currentGrid,
  colorInfoMap,
  onSwapColors,
  onClose,
}) => {
  const [sourceColor, setSourceColor] = useState<string | null>(null);
  const [targetColor, setTargetColor] = useState<string | null>(null);

  // Get all colors that actually exist in the pattern
  const colorsInPattern = useMemo(() => {
    const colorSet = new Set<string>();
    currentGrid.forEach(row => {
      row.forEach(colorCode => {
        colorSet.add(colorCode);
      });
    });
    return colorSet;
  }, [currentGrid]);

  // Filter colors to only show those that exist in the pattern for source selection
  const availableSourceColors = useMemo(() => {
    return colors.filter(color => {
      // Check both code and hex to support both storage versions
      const colorCode = colorInfoMap[color.code]?.code || color.code;
      const colorHex = colorInfoMap[color.code]?.hex || color.hex;
      return colorsInPattern.has(colorCode) || colorsInPattern.has(colorHex);
    });
  }, [colors, colorInfoMap, colorsInPattern]);

  // Calculate how many beads will be affected by the swap
  const affectedBeadsCount = useMemo(() => {
    if (!sourceColor) return 0;

    let count = 0;
    currentGrid.forEach(row => {
      row.forEach(colorCode => {
        if (colorCode === sourceColor) {
          count++;
        }
      });
    });
    return count;
  }, [sourceColor, currentGrid]);

  // Get color info for display
  const getColorInfo = (colorValue: string | null) => {
    if (!colorValue) return null;
    return colorInfoMap[colorValue];
  };

  const handleSwap = () => {
    if (!sourceColor || !targetColor) return;
    onSwapColors(sourceColor, targetColor);
  };

  const canSwap = sourceColor && targetColor && sourceColor !== targetColor && affectedBeadsCount > 0;

  const sourceColorInfo = getColorInfo(sourceColor);
  const targetColorInfo = getColorInfo(targetColor);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Bytt farger</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Velg hvilken farge du vil erstatte, og deretter hvilken farge du vil bruke som erstatning.
        </p>

        {/* Two-column layout for source and target */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Source color picker */}
          <div className="border-2 border-gray-200 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">
              1. Erstatt denne fargen
            </h4>
            {sourceColorInfo && (
              <div className="mb-3 p-3 bg-purple/10 border border-purple/30 rounded-lg flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full border-2 border-purple shadow-sm"
                  style={{ backgroundColor: sourceColorInfo.hex }}
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{sourceColorInfo.name}</p>
                  <p className="text-xs text-gray-600">
                    {sourceColorInfo.code && `Kode: ${sourceColorInfo.code}`}
                  </p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
              {availableSourceColors.map((color) => {
                // Use whichever format exists in the pattern (code or hex)
                const colorCode = colorInfoMap[color.code]?.code || color.code;
                const colorHex = colorInfoMap[color.code]?.hex || color.hex;
                const colorValue = colorsInPattern.has(colorCode) ? colorCode : colorHex;

                return (
                  <button
                    key={`source-${color.code}`}
                    onClick={() => setSourceColor(colorValue)}
                    className={`
                      flex flex-col items-center p-2 rounded-lg border-2 transition-all
                      ${
                        colorValue === sourceColor
                          ? "border-purple bg-purple/10"
                          : "border-gray-200 hover:border-purple/50 hover:bg-gray-50"
                      }
                    `}
                  >
                    <div
                      className="w-10 h-10 rounded-full border-2 border-gray-300 shadow-sm mb-1"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="text-xs font-semibold text-gray-700 text-center line-clamp-1">
                      {color.name}
                    </span>
                    <span className="text-xs text-gray-500">{color.code}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target color picker */}
          <div className="border-2 border-gray-200 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">
              2. Med denne fargen
            </h4>
            {targetColorInfo && (
              <div className="mb-3 p-3 bg-purple/10 border border-purple/30 rounded-lg flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full border-2 border-purple shadow-sm"
                  style={{ backgroundColor: targetColorInfo.hex }}
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{targetColorInfo.name}</p>
                  <p className="text-xs text-gray-600">
                    {targetColorInfo.code && `Kode: ${targetColorInfo.code}`}
                  </p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
              {colors.map((color) => {
                // Determine which format to use based on what's in the pattern
                // If pattern uses codes, use codes; if it uses hex, use hex
                const colorCode = colorInfoMap[color.code]?.code || color.code;
                const colorHex = colorInfoMap[color.code]?.hex || color.hex;

                // Check if any color in the pattern uses code format (has DMC- prefix or similar)
                const patternUsesCodeFormat = Array.from(colorsInPattern).some(c =>
                  typeof c === 'string' && (c.startsWith('DMC-') || c.startsWith('P-'))
                );

                const colorValue = patternUsesCodeFormat ? colorCode : colorHex;

                return (
                  <button
                    key={`target-${color.code}`}
                    onClick={() => setTargetColor(colorValue)}
                    className={`
                      flex flex-col items-center p-2 rounded-lg border-2 transition-all
                      ${
                        colorValue === targetColor
                          ? "border-purple bg-purple/10"
                          : "border-gray-200 hover:border-purple/50 hover:bg-gray-50"
                      }
                    `}
                  >
                    <div
                      className="w-10 h-10 rounded-full border-2 border-gray-300 shadow-sm mb-1"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="text-xs font-semibold text-gray-700 text-center line-clamp-1">
                      {color.name}
                    </span>
                    <span className="text-xs text-gray-500">{color.code}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Preview section */}
        {sourceColor && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>📊 Forhåndsvisning:</strong> Dette vil endre{" "}
              <span className="font-bold text-blue-600">{affectedBeadsCount}</span>{" "}
              {affectedBeadsCount === 1 ? "perle" : "perler"}
              {targetColor && " i mønsteret"}
            </p>
          </div>
        )}

        {/* Validation message */}
        {sourceColor && targetColor && sourceColor === targetColor && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-700">
              <strong>⚠️</strong> Du kan ikke bytte en farge med seg selv. Velg en annen målfarge.
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Avbryt
          </button>
          <button
            onClick={handleSwap}
            disabled={!canSwap}
            className="flex-1 px-4 py-2 bg-purple text-white rounded-lg font-semibold hover:bg-purple/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {canSwap ? `Bytt farger (${affectedBeadsCount})` : "Velg farger"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColorSwapModal;

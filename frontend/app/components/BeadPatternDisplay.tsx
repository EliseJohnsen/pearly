"use client";

import React, { useState, useEffect } from "react";

interface BeadPatternDisplayProps {
  pattern: {
    uuid: string;
    pattern_image_url: string;
    grid_size: number;
    colors_used: Array<{
      hex: string;
      name: string;
      count: number;
      code?: string;
    }>;
    is_paid: boolean;
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
    };
  };
  beadSize?: number;
}

const BeadPatternDisplay: React.FC<BeadPatternDisplayProps> = ({
  pattern,
  beadSize = 10
}) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const imageUrl = `${apiUrl}${pattern.pattern_image_url}`;
  const [patternGrid, setPatternGrid] = useState<string[][] | null>(
    pattern.pattern_data?.grid || null
  );

  // Update pattern grid when pattern data changes
  useEffect(() => {
    if (pattern.pattern_data?.grid) {
      setPatternGrid(pattern.pattern_data.grid);
    }
  }, [pattern.pattern_data]);

  // Create color map for the interactive grid
  // Map both hex and code to color info for flexible lookup
  const colorInfoMap = pattern.colors_used.reduce(
    (acc, color) => {
      const info = { name: color.name, hex: color.hex };
      // Map by hex (primary key in grid)
      acc[color.hex] = info;
      // Also map by code if available
      if (color.code) {
        acc[color.code] = info;
      }
      return acc;
    },
    {} as Record<string, { name: string; hex: string }>,
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Ditt perlemønster
      </h2>

      {/* Interactive Grid Display */}
      {patternGrid && patternGrid.length > 0 ? (
        <div className="mb-6 overflow-auto">
          <div
            className="grid border border-slate-300 shadow-inner bg-white dark:bg-gray-700 rounded-md p-1 mx-auto"
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
                const tooltipText = `${beadInfo.name} (${colorCode}) | Row: ${rowIndex + 1}, Col: ${colIndex + 1}`;

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    title={tooltipText}
                    style={{
                      width: `${beadSize}px`,
                      height: `${beadSize}px`,
                      backgroundColor: beadInfo.hex,
                      border: "1px solid rgba(0, 0, 0, 0.1)",
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
        <div className="mb-6">
          <img
            src={imageUrl}
            alt="Pattern"
            className="max-w-full h-auto rounded-lg border-2 border-gray-300 dark:border-gray-600"
          />
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Farger du trenger
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {pattern.colors_used.map((color, idx) => (
            <div
              key={color.code || color.hex || idx}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div
                className="w-10 h-10 rounded-full border-2 border-gray-300 dark:border-gray-500"
                style={{ backgroundColor: color.hex }}
              />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {color.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {color.count} perler
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6 space-y-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Mønster ID: <span className="font-mono">{pattern.uuid}</span>
        </p>
        {pattern.boards_width && pattern.boards_height ? (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Brett:</strong> {pattern.boards_width} × {pattern.boards_height} brett ({pattern.boards_width * pattern.boards_height} totalt)
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Størrelse:</strong> {pattern.boards_width * 29} × {pattern.boards_height * 29} perler
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Størrelse: {pattern.grid_size}x{pattern.grid_size} perler
          </p>
        )}
      </div>

      <div className="flex gap-4">
        <a
          href={imageUrl}
          download={`perlemønster-${pattern.uuid}.png`}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg text-center transition-colors"
        >
          Last ned mønster
        </a>
        <button
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          onClick={() => alert("Vipps-betaling kommer snart!")}
        >
          Kjøp perlepakke
        </button>
      </div>

      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Del dette mønsteret:{" "}
          <span className="font-mono text-blue-600 dark:text-blue-400">
            {typeof window !== "undefined" && `${window.location.origin}/pattern/${pattern.uuid}`}
          </span>
        </p>
      </div>
    </div>
  );
};

export default BeadPatternDisplay;

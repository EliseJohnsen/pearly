"use client";

import React, { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface Color {
  name: string;
  code: string;
  hex: string;
}

interface ColorChange {
  row: number;
  col: number;
  hex: string;
}

interface ColorPickerModalProps {
  colors: Color[];
  currentColor: string;
  surroundingColors?: (string | null)[][];
  onSelectColor: (changes: ColorChange[]) => void;
  onClose: () => void;
  position: { row: number; col: number };
}

const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
  colors,
  currentColor,
  surroundingColors = [],
  onSelectColor,
  onClose,
  position,
}) => {
  // Track which bead in the 3x3 grid is selected for editing (starts with center)
  const [selectedGridPos, setSelectedGridPos] = useState<{ gridRow: number; gridCol: number }>({
    gridRow: 1,
    gridCol: 1
  });

  // Track pending color changes
  const [pendingChanges, setPendingChanges] = useState<Map<string, string>>(new Map());

  // Get the current color for the selected bead (considering pending changes)
  const getDisplayColor = (gridRow: number, gridCol: number): string | null => {
    const key = `${gridRow}-${gridCol}`;
    if (pendingChanges.has(key)) {
      return pendingChanges.get(key)!;
    }
    return surroundingColors[gridRow]?.[gridCol] || null;
  };

  // Convert grid position to actual pattern position
  const gridToPatternPosition = (gridRow: number, gridCol: number) => {
    return {
      row: position.row + (gridRow - 1),
      col: position.col + (gridCol - 1)
    };
  };

  const handleBeadClick = (gridRow: number, gridCol: number) => {
    // Check if this position is within the pattern bounds
    const color = surroundingColors[gridRow]?.[gridCol];
    if (color !== undefined) {
      setSelectedGridPos({ gridRow, gridCol });
    }
  };

  const handleColorSelect = (hex: string) => {
    const key = `${selectedGridPos.gridRow}-${selectedGridPos.gridCol}`;
    setPendingChanges(new Map(pendingChanges.set(key, hex)));
  };

  const handleSaveChanges = () => {
    const changes: ColorChange[] = [];

    pendingChanges.forEach((hex, key) => {
      const [gridRow, gridCol] = key.split('-').map(Number);
      const patternPos = gridToPatternPosition(gridRow, gridCol);
      changes.push({
        row: patternPos.row,
        col: patternPos.col,
        hex
      });
    });

    onSelectColor(changes);
  };

  const selectedColor = getDisplayColor(selectedGridPos.gridRow, selectedGridPos.gridCol);
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            Velg farge for rad {position.row + 1}, kolonne {position.col + 1}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4 p-3 border border-gray-300 rounded-lg">
          {surroundingColors && surroundingColors.length > 0 ? (
            <>
              <p className="text-sm text-gray-600 mb-2 text-center">
                Klikk på en perle for å endre fargen
              </p>
              <div className="grid grid-cols-3 gap-1 w-fit mx-auto">
                {surroundingColors.map((row, rowIndex) =>
                  row.map((color, colIndex) => {
                    const isCenter = rowIndex === 1 && colIndex === 1;
                    const isSelected = selectedGridPos.gridRow === rowIndex && selectedGridPos.gridCol === colIndex;
                    const displayColor = getDisplayColor(rowIndex, colIndex);
                    const hasPendingChange = pendingChanges.has(`${rowIndex}-${colIndex}`);
                    const isClickable = color !== undefined;

                    return (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        onClick={() => isClickable && handleBeadClick(rowIndex, colIndex)}
                        disabled={!isClickable}
                        className={`w-10 h-10 rounded-full border-2 shadow-sm transition-all ${
                          isSelected
                            ? "border-purple ring-4 ring-purple/40 scale-110"
                            : hasPendingChange
                            ? "border-amber-500 ring-2 ring-amber-300"
                            : isCenter
                            ? "border-purple ring-2 ring-purple/30"
                            : color
                            ? "border-gray-300 hover:border-purple/50 hover:scale-105"
                            : "border-dashed border-gray-200 bg-gray-50 cursor-not-allowed"
                        }`}
                        style={{ backgroundColor: displayColor || "transparent" }}
                        title={
                          !isClickable
                            ? "Utenfor mønster"
                            : hasPendingChange
                            ? "Endret (ikke lagret)"
                            : displayColor || "Ingen farge"
                        }
                      />
                    );
                  })
                )}
              </div>
              {pendingChanges.size > 0 && (
                <p className="text-xs text-amber-600 mt-2 text-center">
                  ⚠️ {pendingChanges.size} endring(er) - trykk "Lagre endringer"
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-700 mb-2">
              <strong>Nåværende farge:</strong>{" "}
              <span
                className="inline-block w-6 h-6 rounded-full border border-gray-300 align-middle ml-2"
                style={{ backgroundColor: currentColor }}
              />
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-6">
          {colors.map((color) => (
            <button
              key={color.code}
              onClick={() => handleColorSelect(color.hex)}
              className={`
                flex flex-col items-center p-3 rounded-lg border-2 transition-all
                ${
                  color.hex === selectedColor
                    ? "border-purple bg-purple/10"
                    : "border-gray-200 hover:border-purple/50 hover:bg-gray-50"
                }
              `}
            >
              <div
                className="w-12 h-12 rounded-full border-2 border-gray-300 shadow-sm mb-2"
                style={{ backgroundColor: color.hex }}
              />
              <span className="text-xs font-semibold text-gray-700 text-center">
                {color.name}
              </span>
              <span className="text-xs text-gray-500">{color.code}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Avbryt
          </button>
          <button
            onClick={handleSaveChanges}
            disabled={pendingChanges.size === 0}
            className="flex-1 px-4 py-2 bg-purple text-white rounded-lg font-semibold hover:bg-purple/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Lagre endringer {pendingChanges.size > 0 && `(${pendingChanges.size})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColorPickerModal;

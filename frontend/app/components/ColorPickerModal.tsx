"use client";

import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface Color {
  name: string;
  code: string;
  hex: string;
}

interface ColorPickerModalProps {
  colors: Color[];
  currentColor: string;
  surroundingColors?: (string | null)[][];
  onSelectColor: (hex: string) => void;
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
            <div className="grid grid-cols-3 gap-1 w-fit mx-auto">
              {surroundingColors.map((row, rowIndex) =>
                row.map((color, colIndex) => {
                  const isCenter = rowIndex === 1 && colIndex === 1;
                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`w-10 h-10 rounded-full border-2 shadow-sm ${
                        isCenter
                          ? "border-purple ring-2 ring-purple/30"
                          : color
                          ? "border-gray-300"
                          : "border-dashed border-gray-200 bg-gray-50"
                      }`}
                      style={{ backgroundColor: color || "transparent" }}
                      title={color || "Ingen farge (utenfor mønster)"}
                    />
                  );
                })
              )}
            </div>
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

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {colors.map((color) => (
            <button
              key={color.code}
              onClick={() => onSelectColor(color.hex)}
              className={`
                flex flex-col items-center p-3 rounded-lg border-2 transition-all
                ${
                  color.hex === currentColor
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
      </div>
    </div>
  );
};

export default ColorPickerModal;

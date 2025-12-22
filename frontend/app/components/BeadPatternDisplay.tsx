"use client";

import React, { useState, useEffect } from "react";
import {useUIString} from '@/app/hooks/useSanityData'
import { EnvelopeIcon } from "@heroicons/react/24/outline";

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
  const [email, setEmail] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const colorsYouNeedText = useUIString('colors_you_need')
  const pearlsText = useUIString('pearls')

  // Update pattern grid when pattern data changes
  useEffect(() => {
    if (pattern.pattern_data?.grid) {
      setPatternGrid(pattern.pattern_data.grid);
    }
  }, [pattern.pattern_data]);

  const handleSendEmail = async () => {
    if (!email) {
      setEmailError("Vennligst oppgi en e-postadresse");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Vennligst oppgi en gyldig e-postadresse");
      return;
    }

    setSendingEmail(true);
    setEmailError(null);

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: email,
          type: "pattern",
          patternUuid: pattern.uuid,
          templateId: "pattern-generated",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Kunne ikke sende e-post");
      }

      setEmailSent(true);
      setEmail("");
    } catch (error) {
      console.error("Error sending email:", error);
      setEmailError(
        error instanceof Error ? error.message : "En feil oppstod ved sending av e-post"
      );
    } finally {
      setSendingEmail(false);
    }
  };

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

  const calculateBrett = (numberOfBeads: number) => {
    return ((numberOfBeads / 29)).toPrecision(1)
  }

  const calculateTotal = (boardsWidth: number, boardsHeight: number) => {
    return ((boardsWidth / 29) + (boardsHeight / 29)).toPrecision(1)
  }

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

      <div className="mb-6 space-y-2">
        {pattern.boards_width && pattern.boards_height ? (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Brett:</strong> {calculateBrett(pattern.boards_width)} × {calculateBrett(pattern.boards_height)} brett ({calculateTotal(pattern.boards_width, pattern.boards_height)} totalt)
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Størrelse:</strong> {pattern.boards_width * 29} × {pattern.boards_height * 29} perler
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Størrelse: {pattern.grid_size}x{pattern.grid_size} { pearlsText }
          </p>
        )}
      </div>
    </div>
  );
};

export default BeadPatternDisplay;

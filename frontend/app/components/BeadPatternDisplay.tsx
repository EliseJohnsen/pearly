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
          { colorsYouNeedText }
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
                  {color.count} { pearlsText }
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
            Størrelse: {pattern.grid_size}x{pattern.grid_size} { pearlsText }
          </p>
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <EnvelopeIcon className="w-5 h-5" />
          Send mønster på e-post
        </h3>

        {emailSent ? (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-700 dark:text-green-300">
              ✓ E-posten er sendt! Sjekk innboksen din.
            </p>
            <button
              onClick={() => setEmailSent(false)}
              className="mt-2 text-sm text-green-600 dark:text-green-400 hover:underline"
            >
              Send til en annen adresse
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label
                htmlFor="email-input"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                E-postadresse
              </label>
              <input
                id="email-input"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(null);
                }}
                placeholder="din.epost@eksempel.no"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={sendingEmail}
              />
            </div>

            {emailError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300">{emailError}</p>
              </div>
            )}

            <button
              onClick={handleSendEmail}
              disabled={sendingEmail || !email}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {sendingEmail ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Sender...
                </>
              ) : (
                <>
                  <EnvelopeIcon className="w-5 h-5" />
                  Send e-post
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Du vil motta mønsterbildet og fargeliste på e-post
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BeadPatternDisplay;

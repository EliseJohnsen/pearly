"use client";

import { useState, useRef } from "react";
import LoadingSpinner from "./LoadingSpinner";

interface ImageUploadProps {
  onPatternGenerated: (data: any) => void;
}

export default function ImageUpload({ onPatternGenerated }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [boardsWidth, setBoardsWidth] = useState(1);
  const [boardsHeight, setBoardsHeight] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Advanced preprocessing options
  const [useAdvancedPreprocessing, setUseAdvancedPreprocessing] = useState(true);
  const [removeBackground, setRemoveBackground] = useState(false);
  const [enhanceColors, setEnhanceColors] = useState(true);
  const [colorBoost, setColorBoost] = useState(1.5);
  const [contrastBoost, setContrastBoost] = useState(1.3);
  const [brightnessBoost, setBrightnessBoost] = useState(1.0);
  const [simplifyDetails, setSimplifyDetails] = useState(true);
  const [simplificationMethod, setSimplificationMethod] = useState<"bilateral" | "mean_shift" | "gaussian">("bilateral");
  const [simplificationStrength, setSimplificationStrength] = useState<"light" | "medium" | "strong">("medium");
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Get board suggestions from backend
      setAnalyzing(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${apiUrl}/api/patterns/suggest-boards`, {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const suggestion = await response.json();
          setBoardsWidth(suggestion.boards_width);
          setBoardsHeight(suggestion.boards_height);
        }
      } catch (error) {
        console.error("Error getting board suggestions:", error);
        // Keep default values on error
      } finally {
        setAnalyzing(false);
      }
    }
  };

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", fileInputRef.current.files[0]);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      // Build query parameters
      const params = new URLSearchParams({
        boards_width: boardsWidth.toString(),
        boards_height: boardsHeight.toString(),
        use_advanced_preprocessing: useAdvancedPreprocessing.toString(),
        remove_bg: removeBackground.toString(),
        enhance_colors: enhanceColors.toString(),
        color_boost: colorBoost.toString(),
        contrast_boost: contrastBoost.toString(),
        brightness_boost: brightnessBoost.toString(),
        simplify_details: simplifyDetails.toString(),
        simplification_method: simplificationMethod,
        simplification_strength: simplificationStrength,
      });

      const response = await fetch(
        `${apiUrl}/api/patterns/upload?${params.toString()}`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      onPatternGenerated(data);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Feil ved opplasting av bilde. Prøv igjen.");
    } finally {
      setUploading(false);
    }
  };

  if (uploading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Velg et bilde
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-dark-pink file:app-primary hover:file:bg-purple hover:file:text-primary-light dark:file:bg-blue-900 dark:file:text-blue-300"
        />
      </div>

      {preview && (
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Forhåndsvisning:
          </p>
          <img
            src={preview}
            alt="Preview"
            className="max-w-full h-auto rounded-lg border border-gray-300 dark:border-gray-600"
          />
        </div>
      )}

      {analyzing && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Analyserer bilde og foreslår brett-dimensjoner...
          </p>
        </div>
      )}

      {preview && !analyzing && (
        <div className="mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Antall brett i bredden: {boardsWidth} ({boardsWidth * 29} perler)
            </label>
            <input
              type="range"
              min="1"
              max="6"
              value={boardsWidth}
              onChange={(e) => setBoardsWidth(Number(e.target.value))}
              className="w-full h-2 bg-primary-dark-pink text: rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-xs text-primary dark:text-gray-400 mt-1">
              <span>1 brett</span>
              <span>6 brett</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary dark:text-gray-300 mb-2">
              Antall brett i høyden: {boardsHeight} ({boardsHeight * 29} perler)
            </label>
            <input
              type="range"
              min="1"
              max="6"
              value={boardsHeight}
              onChange={(e) => setBoardsHeight(Number(e.target.value))}
              className="w-full h-2 bg-purple rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-xs text-purple dark:text-gray-400 mt-1">
              <span>1 brett</span>
              <span>6 brett</span>
            </div>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Total størrelse:</strong> {boardsWidth * 29} × {boardsHeight * 29} perler
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {boardsWidth} × {boardsHeight} = {boardsWidth * boardsHeight} brett totalt
            </p>
          </div>

          {/* Advanced Preprocessing Options */}
          <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4">
            <button
              type="button"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <span>Avanserte bildebehandlingsinnstillinger</span>
              <span className="text-xl">{showAdvancedOptions ? "−" : "+"}</span>
            </button>

            {showAdvancedOptions && (
              <div className="mt-4 space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                {/* Enable Advanced Preprocessing */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Bruk avansert forbehandling
                  </label>
                  <input
                    type="checkbox"
                    checked={useAdvancedPreprocessing}
                    onChange={(e) => setUseAdvancedPreprocessing(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>

                {useAdvancedPreprocessing && (
                  <>
                    {/* Remove Background */}
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Fjern bakgrunn
                      </label>
                      <input
                        type="checkbox"
                        checked={removeBackground}
                        onChange={(e) => setRemoveBackground(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>

                    {/* Enhance Colors */}
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Forsterke farger
                      </label>
                      <input
                        type="checkbox"
                        checked={enhanceColors}
                        onChange={(e) => setEnhanceColors(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>

                    {enhanceColors && (
                      <>
                        {/* Color Boost */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Fargemetning: {colorBoost.toFixed(1)}x
                          </label>
                          <input
                            type="range"
                            min="1.0"
                            max="2.0"
                            step="0.1"
                            value={colorBoost}
                            onChange={(e) => setColorBoost(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                          />
                          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <span>Normal (1.0x)</span>
                            <span>Maks (2.0x)</span>
                          </div>
                        </div>

                        {/* Contrast Boost */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Kontrast: {contrastBoost.toFixed(1)}x
                          </label>
                          <input
                            type="range"
                            min="1.0"
                            max="2.0"
                            step="0.1"
                            value={contrastBoost}
                            onChange={(e) => setContrastBoost(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                          />
                          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <span>Normal (1.0x)</span>
                            <span>Maks (2.0x)</span>
                          </div>
                        </div>

                        {/* Brightness Boost */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Lysstyrke: {brightnessBoost.toFixed(1)}x
                          </label>
                          <input
                            type="range"
                            min="0.5"
                            max="1.5"
                            step="0.1"
                            value={brightnessBoost}
                            onChange={(e) => setBrightnessBoost(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                          />
                          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <span>Mørk (0.5x)</span>
                            <span>Lys (1.5x)</span>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Simplify Details */}
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Forenkle detaljer
                      </label>
                      <input
                        type="checkbox"
                        checked={simplifyDetails}
                        onChange={(e) => setSimplifyDetails(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>

                    {simplifyDetails && (
                      <>
                        {/* Simplification Method */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Forenklings-metode
                          </label>
                          <select
                            value={simplificationMethod}
                            onChange={(e) => setSimplificationMethod(e.target.value as "bilateral" | "mean_shift" | "gaussian")}
                            className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="bilateral">Bilateral (bevarer kanter)</option>
                            <option value="mean_shift">Mean Shift (kunstnerisk)</option>
                            <option value="gaussian">Gaussian (enkel blur)</option>
                          </select>
                        </div>

                        {/* Simplification Strength */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Forenklings-styrke
                          </label>
                          <select
                            value={simplificationStrength}
                            onChange={(e) => setSimplificationStrength(e.target.value as "light" | "medium" | "strong")}
                            className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="light">Lett</option>
                            <option value="medium">Medium</option>
                            <option value="strong">Sterk</option>
                          </select>
                        </div>
                      </>
                    )}
                  </>
                )}

                <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    💡 Tips: Start med standardinnstillingene og juster etter behov.
                    Fjern bakgrunn fungerer best med enkle motiver på ensfarget bakgrunn.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!preview || uploading}
        className="w-full bg-primary hover:bg-primary-dark-pink disabled:bg-disabled disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
      >
        Generer perlemønster
      </button>
    </div>
  );
}

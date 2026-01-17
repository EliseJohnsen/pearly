"use client";

import { useState, useRef, useEffect } from "react";
import LoadingSpinner from "./LoadingSpinner";
import { useUIString } from '@/app/hooks/useSanityData';
import { getSessionToken } from "@/lib/auth";

interface ImageUploadProps {
  onPatternGenerated: (data: any) => void;
  onUploadStatusChange?: (isUploading: boolean) => void;
}

interface SizeOption {
  boards_width: number;
  boards_height: number;
  total_beads: number;
}

interface SizeOptions {
  small: SizeOption;
  medium: SizeOption;
  large: SizeOption;
}

type ProcessingMode = "realistic" | "ai-style";
type Style = "wpap";

const styleInfo: Record<Style, { name: string; description: string; icon: string }> = {
  "wpap": {
    name: "WPAP",
    description: "Angular facets, geometric portrait style",
    icon: "🔷"
  }
};

export default function ImageUpload({ onPatternGenerated, onUploadStatusChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [sizeOptions, setSizeOptions] = useState<SizeOptions | null>(null);
  const [selectedSize, setSelectedSize] = useState<"small" | "medium" | "large">("medium");
  const [suggestedSize, setSuggestedSize] = useState<"small" | "medium" | "large">("medium");
  const [processingMode, setProcessingMode] = useState<ProcessingMode>("ai-style");
  const [selectedStyle, setSelectedStyle] = useState<Style>("wpap");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Advanced preprocessing options (for realistic mode)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [useAdvancedPreprocessing, setUseAdvancedPreprocessing] = useState(true);
  const [removeBackground, setRemoveBackground] = useState(false);
  const [enhanceColors, setEnhanceColors] = useState(true);
  const [colorBoost, setColorBoost] = useState(1.5);
  const [contrastBoost, setContrastBoost] = useState(1.3);
  const [brightnessBoost, setBrightnessBoost] = useState(1.0);
  const [simplifyDetails, setSimplifyDetails] = useState(true);
  const [simplificationMethod, setSimplificationMethod] = useState<"bilateral" | "mean_shift" | "gaussian">("bilateral");
  const [simplificationStrength, setSimplificationStrength] = useState<"light" | "medium" | "strong">("strong");

  const chooseAPhotoText = useUIString('choose_a_photo');
  const previewText = useUIString('preview');

  useEffect(() => {
    onUploadStatusChange?.(uploading);
  }, [uploading, onUploadStatusChange]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

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
          setSizeOptions(suggestion.sizes);
          setSuggestedSize(suggestion.suggested_size);
          setSelectedSize(suggestion.suggested_size);
        }
      } catch (error) {
        console.error("Error getting board suggestions:", error);
      } finally {
        setAnalyzing(false);
      }
    }
  };

  const handleGenerateWithAIStyle = async () => {
    if (!uploadedFile || !sizeOptions) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", uploadedFile);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const selectedDimensions = sizeOptions[selectedSize];

      const params = new URLSearchParams({
        style: selectedStyle,
        boards_width: selectedDimensions.boards_width.toString(),
        boards_height: selectedDimensions.boards_height.toString(),
      });

      const token = getSessionToken();
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${apiUrl}/api/patterns/upload-with-style?${params.toString()}`,
        {
          method: "POST",
          headers,
          credentials: 'include',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const patternData = await response.json();
      onPatternGenerated(patternData);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Feil ved opplasting av bilde. Prøv igjen.");
    } finally {
      setUploading(false);
    }
  };


  const handleGenerateRealistic = async () => {
    if (!uploadedFile || !sizeOptions) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", uploadedFile);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const selectedDimensions = sizeOptions[selectedSize];

      const params = new URLSearchParams({
        boards_width: selectedDimensions.boards_width.toString(),
        boards_height: selectedDimensions.boards_height.toString(),
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

      const patternResponse = await fetch(
        `${apiUrl}/api/patterns/upload?${params.toString()}`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!patternResponse.ok) {
        throw new Error("Pattern upload failed");
      }

      const patternData = await patternResponse.json();
      onPatternGenerated(patternData);
    } catch (error) {
      alert("Feil ved opplasting av bilde. Prøv igjen.");
    } finally {
      setUploading(false);
    }
  };

  const handleGeneratePattern = () => {
    if (processingMode === "ai-style") {
      handleGenerateWithAIStyle();
    } else {
      handleGenerateRealistic();
    }
  };

  if (uploading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <LoadingSpinner loadingMessage="Genererer mønster..." description="Dette kan ta noen sekunder"/>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          1. Last opp bilde
        </h3>
        <div className="flex items-center gap-4">
          <input
            id="upload-image-unified"
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="upload-image-unified"
            className="cursor-pointer inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-primary-dark-pink text-white hover:bg-purple hover:text-primary-light transition-colors"
          >
            {chooseAPhotoText}
          </label>
          {preview && (
            <span className="text-sm text-gray-600">
              Bilde valgt ✓
            </span>
          )}
        </div>
      </div>

      {preview && (
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-2">
            {previewText}
          </p>
          <img
            src={preview}
            alt="Preview"
            className="max-w-full h-auto rounded-lg border border-gray-300"
          />
        </div>
      )}

      {analyzing && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            Analyserer bilde og foreslår brett-dimensjoner...
          </p>
        </div>
      )}

      {preview && !analyzing && sizeOptions && (
        <div className="mb-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              2. Velg størrelse
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(["small", "medium", "large"] as const).map((size) => {
                const option = sizeOptions[size];
                const isSelected = selectedSize === size;
                const isSuggested = suggestedSize === size;
                const sizeLabel = size === "small" ? "Liten" : size === "medium" ? "Medium" : "Stor";

                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`relative p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-gray-300 hover:border-primary-dark-pink"
                    }`}
                  >
                    {isSuggested && (
                      <span className="absolute -top-2 -right-2 bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                        Anbefalt
                      </span>
                    )}
                    <div className="text-center">
                      <p className="font-semibold text-gray-900 mb-1">
                        {sizeLabel}
                      </p>
                      <p className="text-sm text-gray-600">
                        {option.boards_width} × {option.boards_height} brett
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Max {option.total_beads} perler
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              3. Velg stil
            </h3>
            <div className="space-y-3">
              <label
                className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  processingMode === "ai-style"
                    ? "border-primary bg-primary/10"
                    : "border-gray-300 hover:border-primary-dark-pink"
                }`}
              >
                <input
                  type="radio"
                  name="processing-mode"
                  value="ai-style"
                  checked={processingMode === "ai-style"}
                  onChange={(e) => setProcessingMode(e.target.value as ProcessingMode)}
                  className="mt-1 w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{styleInfo[selectedStyle].icon}</span>
                    <p className="font-semibold text-gray-900">
                      Med AI-stil (redigert)
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {styleInfo[selectedStyle].description} - Gir bildet en kunstnerisk, geometrisk stil
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  processingMode === "realistic"
                    ? "border-primary bg-primary/10"
                    : "border-gray-300 hover:border-primary-dark-pink"
                }`}
              >
                <input
                  type="radio"
                  name="processing-mode"
                  value="realistic"
                  checked={processingMode === "realistic"}
                  onChange={(e) => setProcessingMode(e.target.value as ProcessingMode)}
                  className="mt-1 w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📸</span>
                    <p className="font-semibold text-gray-900">
                      Realistisk
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Bevarer originalbildets utseende med avanserte bildebehandlingsinnstillinger
                  </p>
                </div>
              </label>
            </div>
          </div>

          {processingMode === "realistic" && (
            <div className="border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                <span>Avanserte innstillinger</span>
                <span className="text-xl">{showAdvancedOptions ? "−" : "+"}</span>
              </button>

              {showAdvancedOptions && (
                <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
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
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">
                          Fjern bakgrunn
                        </label>
                        <input
                          type="checkbox"
                          checked={removeBackground}
                          onChange={(e) => setRemoveBackground(e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">
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
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Fargemetning: {colorBoost.toFixed(1)}x
                            </label>
                            <input
                              type="range"
                              min="1.0"
                              max="2.0"
                              step="0.1"
                              value={colorBoost}
                              onChange={(e) => setColorBoost(Number(e.target.value))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>Normal (1.0x)</span>
                              <span>Maks (2.0x)</span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Kontrast: {contrastBoost.toFixed(1)}x
                            </label>
                            <input
                              type="range"
                              min="1.0"
                              max="2.0"
                              step="0.1"
                              value={contrastBoost}
                              onChange={(e) => setContrastBoost(Number(e.target.value))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>Normal (1.0x)</span>
                              <span>Maks (2.0x)</span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Lysstyrke: {brightnessBoost.toFixed(1)}x
                            </label>
                            <input
                              type="range"
                              min="0.5"
                              max="1.5"
                              step="0.1"
                              value={brightnessBoost}
                              onChange={(e) => setBrightnessBoost(Number(e.target.value))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>Mørk (0.5x)</span>
                              <span>Lys (1.5x)</span>
                            </div>
                          </div>
                        </>
                      )}

                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">
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
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Forenklings-metode
                            </label>
                            <select
                              value={simplificationMethod}
                              onChange={(e) => setSimplificationMethod(e.target.value as "bilateral" | "mean_shift" | "gaussian")}
                              className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="bilateral">Bilateral (bevarer kanter)</option>
                              <option value="mean_shift">Mean Shift (kunstnerisk)</option>
                              <option value="gaussian">Gaussian (enkel blur)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Forenklings-styrke
                            </label>
                            <select
                              value={simplificationStrength}
                              onChange={(e) => setSimplificationStrength(e.target.value as "light" | "medium" | "strong")}
                              className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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

                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      💡 Tips: Start med standardinnstillingene og juster etter behov.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Valgt:</strong> {processingMode === "ai-style" ? `${styleInfo[selectedStyle].name} stil` : "Realistisk"}, {sizeOptions[selectedSize].boards_width} × {sizeOptions[selectedSize].boards_height} brett
            </p>
          </div>
        </div>
      )}

      <button
        onClick={handleGeneratePattern}
        disabled={!preview || uploading || !sizeOptions}
        className="w-full bg-primary hover:bg-primary-dark-pink disabled:bg-disabled disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
      >
        {uploading ? 'Genererer...' : 'Generer perlemønster'}
      </button>
    </div>
  );
}

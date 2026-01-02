"use client";

import { useState, useRef } from "react";
import LoadingSpinner from "./LoadingSpinner";
import { useUIString } from '@/app/hooks/useSanityData';

interface ImageUploadWithStyleProps {
  onPatternGenerated: (data: any) => void;
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

type Style = "wpap";

const styleInfo: Record<Style, { name: string; description: string; icon: string }> = {
  "wpap": {
    name: "WPAP",
    description: "Angular facets, geometric portrait style",
    icon: "🔷"
  }
};

export default function ImageUploadWithStyle({ onPatternGenerated }: ImageUploadWithStyleProps) {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [sizeOptions, setSizeOptions] = useState<SizeOptions | null>(null);
  const [selectedSize, setSelectedSize] = useState<"small" | "medium" | "large">("medium");
  const [suggestedSize, setSuggestedSize] = useState<"small" | "medium" | "large">("medium");
  const [selectedStyle, setSelectedStyle] = useState<Style>("wpap");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chooseAPhotoText = useUIString('choose_a_photo');
  const previewText = useUIString('preview');

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

  const handleGeneratePattern = async () => {
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

      const response = await fetch(
        `${apiUrl}/api/patterns/upload-with-style?${params.toString()}`,
        {
          method: "POST",
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

  if (uploading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
        <LoadingSpinner />
        <p className="text-center mt-4 text-gray-600 dark:text-gray-400">
          Transformerer bildet ditt til {styleInfo[selectedStyle].name} stil...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <input
            id="upload-image-style"
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="upload-image-style"
            className="cursor-pointer inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-primary-dark-pink text-white hover:bg-purple hover:text-primary-light dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 transition-colors"
          >
            {chooseAPhotoText}
          </label>
          {preview && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Bilde valgt
            </span>
          )}
        </div>
      </div>

      {preview && (
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {previewText}
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

      {preview && !analyzing && sizeOptions && (
        <div className="mb-6 space-y-6">
          {/* Style Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Velg stil:
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {(Object.keys(styleInfo) as Style[]).map((style) => {
                const info = styleInfo[style];
                const isSelected = selectedStyle === style;

                return (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setSelectedStyle(style)}
                    className={`p-4 rounded-lg border-2 transition-all text-center ${
                      isSelected
                        ? "border-primary bg-primary/10 dark:border-blue-500 dark:bg-blue-900/30"
                        : "border-gray-300 dark:border-gray-600 hover:border-primary-dark-pink dark:hover:border-blue-400"
                    }`}
                  >
                    <div className="text-3xl mb-2">{info.icon}</div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">
                      {info.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {info.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Velg størrelse på mønsteret:
            </label>
            <div className="grid grid-cols-3 gap-3">
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
                        ? "border-primary bg-primary/10 dark:border-blue-500 dark:bg-blue-900/30"
                        : "border-gray-300 dark:border-gray-600 hover:border-primary-dark-pink dark:hover:border-blue-400"
                    }`}
                  >
                    {isSuggested && (
                      <span className="absolute -top-2 -right-2 bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                        Anbefalt
                      </span>
                    )}
                    <div className="text-center">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {sizeLabel}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {option.boards_width} × {option.boards_height} brett
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {option.total_beads} perler
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Valgt:</strong> {styleInfo[selectedStyle].name} stil, {sizeOptions[selectedSize].boards_width} × {sizeOptions[selectedSize].boards_height} brett
            </p>
          </div>
        </div>
      )}

      {uploading && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center gap-3">
          <LoadingSpinner />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Transformerer bildet ditt til {styleInfo[selectedStyle].name} stil...
          </p>
        </div>
      )}

      <button
        onClick={handleGeneratePattern}
        disabled={!preview || uploading}
        className="w-full bg-primary hover:bg-primary-dark-pink disabled:bg-disabled disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
      >
        {uploading ? 'Genererer...' : `Generer perlemønster med ${selectedStyle && styleInfo[selectedStyle].name}`}
      </button>
    </div>
  );
}

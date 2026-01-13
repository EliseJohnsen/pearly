"use client";
import { getAuthHeaders } from "@/lib/auth";

import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface PatternData {
  uuid: string;
  pattern_image_url: string;
  grid_size: number;
  colors_used: Array<{
    hex: string;
    name: string;
    count: number;
    code?: string;
  }>;
  created_at: string;
  boards_width?: number;
  boards_height?: number;
  pattern_data?: any;
  pattern_image_base64?: string;
  styled_image_base64?: string;
}

interface CreateProductModalProps {
  pattern: PatternData;
  onClose: () => void;
  onSuccess: (productId: number) => void;
}

export default function CreateProductModal({
  pattern,
  onClose,
  onSuccess,
}: CreateProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pattern?.uuid) {
      setError("Mønster UUID mangler. Kan ikke opprette produkt.");
    }
  }, [pattern]);

  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  const [variantName, setVariantName] = useState("Standard perlekit");
  const [price, setPrice] = useState<number>(299);
  const [compareAtPrice, setCompareAtPrice] = useState<number | null>(null);

  const generateSKU = (name: string) => {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "-")
      .substring(0, 20) + `-${Date.now().toString().slice(-6)}`;
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const convertImageToBase64 = async (imageUrl: string): Promise<string> => {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove the data:image/png;base64, prefix
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!pattern?.uuid) {
      setError("Mønster UUID mangler. Kan ikke opprette produkt.");
      setLoading(false);
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      // Use base64 images from pattern response if available
      // Otherwise fall back to fetching from the API (for backwards compatibility)
      let patternImageBase64 = pattern.pattern_image_base64;
      if (!patternImageBase64) {
        const patternImageUrl = `${apiUrl}${pattern.pattern_image_url}`;
        patternImageBase64 = await convertImageToBase64(patternImageUrl);
      }

      // Use styled image base64 if available
      let styledImageBase64: string | undefined = pattern.styled_image_base64;
      if (!styledImageBase64 && pattern.pattern_data?.styled) {
        const styledImageUrl = `${apiUrl}/api/patterns/${pattern.uuid}/styled-image`;
        styledImageBase64 = await convertImageToBase64(styledImageUrl);
      }

      const productData = {
        // Pattern data
        pattern_image_base64: patternImageBase64,
        styled_image_base64: styledImageBase64,
        pattern_data: pattern.pattern_data || {},
        colors_used: pattern.colors_used,

        // Product information
        sku: generateSKU(productName),
        name: productName,
        description,
        long_description: description,
        status: "coming_soon",
        slug: generateSlug(productName),
        difficulty_level: difficulty,
        currency: "NOK",
        vat_rate: 25.0,
        tags: ["perlemønster", "håndlaget"],

        // Variants
        variants: [
          {
            sku: generateSKU(`${productName}-${variantName}`),
            name: variantName,
            price,
            compare_at_price: compareAtPrice,
            weight: 500,
            shipping_class: "package",
            stock_quantity: 10,
            is_active: true,
            options: [],
          },
        ],
        category_ids: [],
      };

      const response = await fetch(
        `${apiUrl}/api/products/create-from-pattern-data`,
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(productData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Kunne ikke opprette produkt");
      }

      const patternResponse = await response.json();
      onSuccess(patternResponse.id);
    } catch (err) {
      console.error("Error creating product:", err);
      setError(err instanceof Error ? err.message : "En feil oppstod");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Opprett produkt fra mønster
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Product Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Produktinformasjon</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Produktnavn *
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
                placeholder="F.eks. 'Katte-mønster perlekit'"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beskrivelse *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                placeholder="Beskriv produktet..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vanskelighetsgrad
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="easy">Lett</option>
                <option value="medium">Medium</option>
                <option value="hard">Vanskelig</option>
              </select>
            </div>
          </div>

          {/* Variant Information */}
          <div className="space-y-4 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900">Produktvariant</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Variantnavn *
              </label>
              <input
                type="text"
                value={variantName}
                onChange={(e) => setVariantName(e.target.value)}
                required
                placeholder="F.eks. 'Standard perlekit'"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pris (NOK) *
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  required
                  min="0"
                  step="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Før-pris (valgfritt)
                </label>
                <input
                  type="number"
                  value={compareAtPrice || ""}
                  onChange={(e) => setCompareAtPrice(e.target.value ? Number(e.target.value) : null)}
                  min="0"
                  step="1"
                  placeholder="F.eks. 399"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Forhåndsvisning</h3>
            <div className="p-4 bg-gray-50 rounded-lg">
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${pattern.pattern_image_url}`}
                alt="Pattern preview"
                className="w-full h-auto rounded-lg border border-gray-300"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark-pink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Oppretter..." : "Opprett produkt"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

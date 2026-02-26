"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import PatternFlowStepper from "@/app/components/PatternFlowStepper";
import LoadingSpinner from "../components/LoadingSpinner";
import ProductCard from "../components/ProductCard";
import { useUIString } from "../hooks/useSanityData";

const STORAGE_KEY = "pearly_pattern_flow";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface PatternFlowData {
  imagePreview: string | null;
  imageFile: string | null;
  style: "realistic" | "ai-style" | null;
  size: "small" | "medium" | "large" | null;
}

interface PatternSize {
  size: string;
  boardsWidth: number;
  boardsHeight: number;
  patternBase64: string;
  mockupBase64: string | null;
  colorsUsed: any[];
  patternData: any;
  beadCount: number;
}

interface CustomKit {
  _id: string;
  title: string;
  slug: string;
  productType: string;
  productSize: number;
  sizeName: string;
  status: string;
  price: number;
  description: string;
}

export default function VelgStorrelsePage() {
  const router = useRouter();
  const [flowData, setFlowData] = useState<PatternFlowData>({
    imagePreview: null,
    imageFile: null,
    style: null,
    size: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [patterns, setPatterns] = useState<PatternSize[]>([]);
  const [customKits, setCustomKits] = useState<CustomKit[]>([]);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMockups, setLoadingMockups] = useState<Set<string>>(new Set());
  const [hoveredPattern, setHoveredPattern] = useState<string | null>(null);
  const chooseSizeHeader = useUIString("velg_størrelse_header");
  const chooseSizeText = useUIString("velg_størrelse_tekst");

  const fetchCustomKits = async () => {
    try {
      const response = await fetch(`${API_URL}/api/products/custom-kits`);
      if (!response.ok) {
        throw new Error("Failed to fetch custom kits");
      }
      const result = await response.json();
      setCustomKits(result.kits);
    } catch (err) {
      console.error("Error fetching custom kits:", err);
      // Don't show error to user - prices will just not display
    }
  };

  // Load data from localStorage and generate patterns
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (!data.imageFile || !data.style) {
          router.push("/last-opp-bilde");
          return;
        }
        setFlowData(data);
        generatePatterns(data);
        fetchCustomKits();
      } catch (e) {
        console.error("Failed to parse stored flow data", e);
        router.push("/last-opp-bilde");
      }
    } else {
      router.push("/last-opp-bilde");
    }
  }, [router]);

  const generatePatterns = async (data: PatternFlowData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/patterns/generate-three-sizes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: data.imageFile,
          style: data.style,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate patterns");
      }

      const result = await response.json();
      setPatterns(result.patterns);
    } catch (err) {
      console.error("Error generating patterns:", err);
      setError("Kunne ikke generere perlemønstre. Vennligst prøv igjen.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadMockup = async (pattern: PatternSize) => {
    // Skip if mockup already loaded or is currently loading
    if (pattern.mockupBase64 || loadingMockups.has(pattern.size)) {
      return;
    }

    // Mark as loading
    setLoadingMockups((prev) => new Set(prev).add(pattern.size));

    try {
      const response = await fetch(`${API_URL}/api/patterns/generate-mockup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patternBase64: pattern.patternBase64,
          boardsWidth: pattern.boardsWidth,
          boardsHeight: pattern.boardsHeight,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate mockup");
      }

      const result = await response.json();

      // Update pattern with mockup
      setPatterns((prevPatterns) =>
        prevPatterns.map((p) =>
          p.size === pattern.size ? { ...p, mockupBase64: result.mockupBase64 } : p
        )
      );
    } catch (err) {
      console.error(`Error generating mockup for ${pattern.size}:`, err);
      // Don't show error to user - just continue without mockup
    } finally {
      // Remove from loading set
      setLoadingMockups((prev) => {
        const next = new Set(prev);
        next.delete(pattern.size);
        return next;
      });
    }
  };

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
  };

  const handleContinue = async () => {
    if (!selectedSize) return;

    const selectedPattern = patterns.find((p) => p.size === selectedSize);
    if (!selectedPattern) return;

    try {
      // Save pattern to localStorage
      const updatedData = { ...flowData, size: selectedSize };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
      localStorage.setItem("custom_pattern", JSON.stringify(selectedPattern));

      // Find the custom kit from the cached list
      const customKit = customKits.find((kit) => kit.sizeName === selectedSize);

      if (!customKit) {
        // Fallback: fetch from API if not found in cached list
        const sizeMap: Record<string, number> = { small: 1, medium: 2, large: 3 };
        const productSize = sizeMap[selectedSize];
        const response = await fetch(
          `${API_URL}/api/products/custom-kit-by-size?product_size=${productSize}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch custom kit product");
        }

        const fetchedKit = await response.json();

        // Store the custom kit info for the product page
        localStorage.setItem("custom_kit", JSON.stringify(fetchedKit));

        router.push(`/produkter/${fetchedKit.slug}?custom=true`);
      } else {
        // Store the custom kit info for the product page
        localStorage.setItem("custom_kit", JSON.stringify(customKit));

        // Navigate to product page with custom flag
        router.push(`/produkter/${customKit.slug}?custom=true`);
      }
    } catch (err) {
      console.error("Error navigating to product:", err);
      setError("Kunne ikke hente produktinformasjon. Vennligst prøv igjen.");
    }
  };

  const getSizeLabel = (size: string, boardsW: number, boardsH: number) => {
    const labels: Record<string, string> = {
      small: "Liten",
      medium: "Medium",
      large: "Stor",
    };
    return `${labels[size] || size} (ca ${boardsW * 15}x${boardsH * 15} cm)`;
  };

  if (!flowData.imageFile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />
      <main className="min-h-screen bg-[#F5EDE8] py-4">
        <PatternFlowStepper currentStep={2} />

        <div className="max-w-4xl mx-auto px-4 pb-12">

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16">
              <LoadingSpinner
                loadingMessage="Genererer dine perlemønster..."
                description="Dette tar ca. 10-15 sekunder"></LoadingSpinner>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border-2 border-red-400 text-red-700 px-6 py-4 rounded-2xl mb-8">
              <p>{error}</p>
            </div>
          )}

          {!isLoading && patterns.length > 0 && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-[#6B4E71] mb-3">
                  {chooseSizeHeader}
                </h1>
                <p className="text-[#6B4E71] text-base">
                  {chooseSizeText}
                </p>
              </div>
              <div className="flex flex-col-reverse md:grid md:grid-cols-3 gap-6 mb-8">
                {patterns.map((pattern) => {
                  const isHovered = hoveredPattern === pattern.size;
                  const showMockup = isHovered && pattern.mockupBase64;
                  const isLoadingMockup = loadingMockups.has(pattern.size);
                  const customKit = customKits.find((kit) => kit.sizeName === pattern.size);
                  const priceInKr = customKit ? customKit.price.toFixed(0) : null;

                  return (
                    <ProductCard
                      key={pattern.size}
                      title={getSizeLabel(pattern.size, pattern.boardsWidth, pattern.boardsHeight)}
                      imageUrl={showMockup ? pattern.mockupBase64! : pattern.patternBase64}
                      imageAlt={`${pattern.size} ${showMockup ? "mockup" : "pattern"}`}
                      imageOverlay={
                        isLoadingMockup && isHovered ? (
                          <div className="absolute inset-0 bg-primary-pink bg-opacity-30 flex items-center justify-center rounded-lg">
                            <LoadingSpinner loadingMessage="Henter interiørbilder" />
                          </div>
                        ) : null
                      }
                      isSelected={selectedSize === pattern.size}
                      onClick={() => handleSizeSelect(pattern.size)}
                      onMouseEnter={() => {
                        setHoveredPattern(pattern.size);
                        loadMockup(pattern);
                      }}
                      onMouseLeave={() => setHoveredPattern(null)}
                      className="h-full"
                    >
                      {priceInKr && (
                        <p className="text-lg font-bold text-[#6B4E71] mt-2">
                          {priceInKr}
                        </p>
                      )}
                      {isHovered && !pattern.mockupBase64 && !isLoadingMockup && (
                        <p className="text-xs text-[#6B4E71] opacity-60 mt-1">
                          Hold musepekeren for interiørbilde
                        </p>
                      )}
                    </ProductCard>
                  );
                })}
              </div>

              <div className="mt-8">
                <button
                  onClick={handleContinue}
                  disabled={!selectedSize}
                  className="w-full bg-dark-purple hover:bg-[#5A3E5F] disabled:bg-[#C4B5C7] disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-full transition-colors text-lg"
                >
                  Gå til bestilling
                </button>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

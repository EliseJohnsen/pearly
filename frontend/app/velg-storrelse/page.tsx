"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import PatternFlowStepper from "@/app/components/PatternFlowStepper";
import LoadingSpinner from "../components/LoadingSpinner";

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
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMockups, setLoadingMockups] = useState<Set<string>>(new Set());
  const [hoveredPattern, setHoveredPattern] = useState<string | null>(null);

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

  const handleContinue = () => {
    if (selectedSize) {
      const selectedPattern = patterns.find((p) => p.size === selectedSize);
      if (selectedPattern) {
        // TODO: Navigate to product page or create product
        // For now, just save to localStorage
        const updatedData = { ...flowData, size: selectedSize };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
        localStorage.setItem("selected_pattern", JSON.stringify(selectedPattern));

        // Navigate to product page (placeholder)
        alert("Pattern selected! Navigate to product page next.");
      }
    }
  };

  const getSizeLabel = (size: string, boardsW: number, boardsH: number) => {
    const labels: Record<string, string> = {
      small: "Liten",
      medium: "Medium",
      large: "Stor",
    };
    return `${labels[size] || size} (${boardsW}x${boardsH} perlebrett)`;
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
                loadingMessage="Genererer ditt perlemønster..."
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
                  Velg størrelse
                </h1>
                <p className="text-[#6B4E71] text-base">
                  Vi har generert tre størrelser for deg. Velg den som passer best.
                </p>
              </div>
              <div className="flex flex-col-reverse md:grid md:grid-cols-3 gap-6 mb-8">
                {patterns.map((pattern) => {
                  const isHovered = hoveredPattern === pattern.size;
                  const showMockup = isHovered && pattern.mockupBase64;
                  const isLoadingMockup = loadingMockups.has(pattern.size);

                  return (
                    <button
                      key={pattern.size}
                      onClick={() => handleSizeSelect(pattern.size)}
                      onMouseEnter={() => {
                        setHoveredPattern(pattern.size);
                        loadMockup(pattern);
                      }}
                      onMouseLeave={() => setHoveredPattern(null)}
                      className={`relative rounded-2xl transition-all text-left hover:z-10 ${
                        selectedSize === pattern.size
                          ? "border-[#6B4E71] bg-[#F5F0F6] shadow-lg"
                          : "border-[#C4B5C7] bg-white hover:border-[#6B4E71]"
                      }`}
                    >
                      <div className="aspect-square rounded-lg overflow-hidden mb-4 bg-gray-100 relative">
                        <img
                          src={showMockup ? pattern.mockupBase64! : pattern.patternBase64}
                          alt={`${pattern.size} ${showMockup ? "mockup" : "pattern"}`}
                          className={`w-full h-full transition-opacity duration-300 ${
                            showMockup ? "object-cover" : "object-contain"
                          }`}
                        />
                        {isLoadingMockup && isHovered && (
                          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                          </div>
                        )}
                      </div>
                      <div className="px-4 py-6">
                        <h3 className="text-lg font-bold text-[#6B4E71] mb-1">
                          {getSizeLabel(pattern.size, pattern.boardsWidth, pattern.boardsHeight)}
                        </h3>
                        <p className="text-sm text-[#6B4E71]">
                          {pattern.patternData.width} x {pattern.patternData.height} perler
                        </p>
                        <p className="text-sm text-[#6B4E71]">
                          {pattern.colorsUsed.length} farger
                        </p>
                        <p className="text-sm text-[#6B4E71]">
                          {pattern.beadCount} farger
                        </p>
                        {isHovered && !pattern.mockupBase64 && !isLoadingMockup && (
                          <p className="text-xs text-[#6B4E71] opacity-60 mt-1">
                            Hold musepekeren for interiørbilde
                          </p>
                        )}
                      </div>
                    </button>
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

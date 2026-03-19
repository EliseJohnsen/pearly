"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import PatternFlowStepper from "@/app/components/PatternFlowStepper";
import LoadingSpinner from "../components/LoadingSpinner";
import ProductCard from "../components/ProductCard";
import { useUIString } from "../hooks/useSanityData";
import { formatPrice } from "../utils/priceFormatter";
import PearlyButton from "../components/PearlyButton";
import { generateMockups, subscribeMockupUpdates } from "../utils/mockupService";

const STORAGE_KEY = "pearly_pattern_flow";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface PatternFlowData {
  imagePreview: string | null;
  imageFile: string | null;
  aspectRatio: "3:4" | "4:3" | "1:1" | null;
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
    aspectRatio: null,
    style: null,
    size: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [patterns, setPatterns] = useState<PatternSize[]>([]);
  const [customKits, setCustomKits] = useState<CustomKit[]>([]);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hoveredPattern, setHoveredPattern] = useState<string | null>(null);
  const [showGhostCards, setShowGhostCards] = useState(false);
  const [loadingStage, setLoadingStage] = useState<'ai-generation' | 'pattern-generation'>('ai-generation');
  const [mockupStates, setMockupStates] = useState<Record<string, string | null>>({});

  // Ref to prevent double execution of pattern generation
  const patternsGeneratedRef = useRef(false);
  const chooseSizeHeader = useUIString("velg_storrelse_header");
  const chooseSizeText = useUIString("velg_storrelse_tekst");
  const startOverHeader = useUIString("start_paa_nytt_header");
  const startOverText = useUIString("start_paa_nytt_tekst");
  const startOverButtonLabel = useUIString("start_paa_nytt_knapp");
  const generate_pattern_description = useUIString("hama_generate_pattern_description");

  const fetchCustomKits = async (retryCount = 0, abortSignal?: AbortSignal, aspectRatio?: string | null): Promise<void> => {
    const maxRetries = 3;
    const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff: 1s, 2s, 4s

    try {
      // Build URL with optional dimension parameter
      let url = `${API_URL}/api/products/custom-kits`;
      if (aspectRatio) {
        url += `?dimension=${encodeURIComponent(aspectRatio)}`;
      }

      const response = await fetch(url, {
        signal: abortSignal, // Use the signal from useEffect cleanup
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch custom kits: ${response.status}`);
      }

      const result = await response.json();
      setCustomKits(result.kits);
      console.log(`Successfully fetched ${result.kits.length} custom kits for aspect ratio ${aspectRatio || 'all'}`);
    } catch (err) {
      // Ignore AbortError - this happens when component unmounts or in React Strict Mode
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Custom kits fetch was cancelled (component unmounted or strict mode)');
        return;
      }

      console.error(`Error fetching custom kits (attempt ${retryCount + 1}/${maxRetries + 1}):`, err);

      // Don't retry if aborted
      if (abortSignal?.aborted) {
        return;
      }

      // Retry if we haven't exceeded max retries
      if (retryCount < maxRetries) {
        console.log(`Retrying in ${retryDelay}ms...`);
        setTimeout(() => {
          fetchCustomKits(retryCount + 1, abortSignal, aspectRatio);
        }, retryDelay);
      } else {
        console.error("Failed to fetch custom kits after all retries - prices will not display");
        // Don't show error to user - prices will just not display
      }
    }
  };

  // Fetch custom kits early (as soon as component mounts)
  useEffect(() => {
    const controller = new AbortController();

    // Get aspect ratio from localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    let aspectRatio: string | null = null;
    if (stored) {
      try {
        const data = JSON.parse(stored);
        aspectRatio = data.aspectRatio;
      } catch (e) {
        console.warn("Could not parse localStorage for aspect ratio:", e);
      }
    }

    fetchCustomKits(0, controller.signal, aspectRatio);

    // Cleanup: abort the fetch if component unmounts
    return () => {
      controller.abort();
    };
  }, []);

  // Load data from localStorage and generate patterns
  useEffect(() => {
    // Prevent double execution (React Strict Mode triggers useEffect twice)
    if (patternsGeneratedRef.current) {
      return;
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (!data.imageFile || !data.style) {
          router.push("/last-opp-bilde");
          return;
        }
        setFlowData(data);

        // Check if patterns already exist in localStorage
        const storedPatternsAll = localStorage.getItem("custom_patterns_all");
        if (storedPatternsAll) {
          // Patterns already generated - load from storage instead of regenerating
          try {
            const patternsData = JSON.parse(storedPatternsAll);

            // Try to get images from sessionStorage
            let imagesData: Array<{ size: string; patternBase64: string; mockupBase64: string | null }> = [];
            try {
              const storedImages = sessionStorage.getItem("custom_patterns_images");
              if (storedImages) {
                imagesData = JSON.parse(storedImages);
              }
            } catch (e) {
              console.warn("Could not load pattern images from sessionStorage:", e);
            }

            // Reconstruct all patterns with stored data
            const reconstructedPatterns: PatternSize[] = patternsData.map((patternData: any) => {
              const imageData = imagesData.find(img => img.size === patternData.size);
              return {
                size: patternData.size,
                boardsWidth: patternData.boardsWidth,
                boardsHeight: patternData.boardsHeight,
                patternData: patternData.patternData,
                colorsUsed: patternData.colorsUsed,
                beadCount: patternData.beadCount,
                patternBase64: imageData?.patternBase64 || "",
                mockupBase64: imageData?.mockupBase64 || null,
              };
            });

            // If we have the patterns but not the images, we'll need to regenerate
            if (reconstructedPatterns.length === 0 || !reconstructedPatterns[0].patternBase64) {
              console.log("Pattern data found but images missing - regenerating patterns");
              generatePatterns(data);
            } else {
              console.log("Loaded patterns from storage - skipping generation");
              setPatterns(reconstructedPatterns);

              // Start generating mockups for patterns that don't have them yet
              const patternsNeedingMockups = reconstructedPatterns.filter(p => !p.mockupBase64);
              if (patternsNeedingMockups.length > 0) {
                generateMockups(patternsNeedingMockups);
              }
            }
          } catch (e) {
            console.error("Failed to parse stored pattern data - regenerating:", e);
            generatePatterns(data);
          }
        } else {
          // No stored patterns - generate new ones
          console.log("No stored patterns found - generating new patterns");
          generatePatterns(data);
        }

        patternsGeneratedRef.current = true; // Mark as processed
      } catch (e) {
        console.error("Failed to parse stored flow data", e);
        router.push("/last-opp-bilde");
      }
    } else {
      router.push("/last-opp-bilde");
    }
  }, []); // Empty dependency array - only run on mount

  const generatePatterns = async (data: PatternFlowData) => {
    setIsLoading(true);
    setError(null);
    setShowGhostCards(false);

    // Set initial loading stage based on style
    if (data.style === 'ai-style') {
      setLoadingStage('ai-generation');
    } else {
      setLoadingStage('pattern-generation');
    }

    // Show ghost cards after 9 seconds
    const ghostCardTimer = setTimeout(() => {
      setShowGhostCards(true);
    }, 9000);

    // For AI style, transition to pattern generation stage after 3 seconds
    let stageTimer: NodeJS.Timeout | null = null;
    if (data.style === 'ai-style') {
      stageTimer = setTimeout(() => {
        setLoadingStage('pattern-generation');
      }, 4500);
    }

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

      // Store all patterns in localStorage for later retrieval (minimal patternData to save space)
      try {
        const patternsForStorage = result.patterns.map((p: PatternSize) => ({
          size: p.size,
          boardsWidth: p.boardsWidth,
          boardsHeight: p.boardsHeight,
          patternData: {
            width: p.patternData.width,
            height: p.patternData.height,
            // grid: p.patternData.grid,  // REMOVED - only store dimensions, not the full grid
          },
          colorsUsed: p.colorsUsed,
          beadCount: p.beadCount,
        }));
        localStorage.setItem("custom_patterns_all", JSON.stringify(patternsForStorage));

        // Store images in sessionStorage (larger limit)
        const imagesForStorage = result.patterns.map((p: PatternSize) => ({
          size: p.size,
          patternBase64: p.patternBase64,
          mockupBase64: p.mockupBase64,
        }));
        sessionStorage.setItem("custom_patterns_images", JSON.stringify(imagesForStorage));
      } catch (e) {
        console.warn("Could not store generated patterns:", e);
      }

      // Start generating mockups using the service (runs independently of component)
      generateMockups(result.patterns);
    } catch (err) {
      console.error("Error generating patterns:", err);
      setError("Kunne ikke generere perlemønstre. Vennligst prøv igjen.");
    } finally {
      clearTimeout(ghostCardTimer);
      if (stageTimer) clearTimeout(stageTimer);
      setIsLoading(false);
      setShowGhostCards(false);
    }
  };

  // Subscribe to mockup updates from the service
  useEffect(() => {
    if (patterns.length === 0) return;

    const unsubscribers: (() => void)[] = [];

    patterns.forEach((pattern) => {
      const unsubscribe = subscribeMockupUpdates(pattern.size, (mockupBase64) => {
        if (mockupBase64) {
          setMockupStates((prev) => ({
            ...prev,
            [pattern.size]: mockupBase64,
          }));
        }
      });
      unsubscribers.push(unsubscribe);
    });

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [patterns]);

  const handleSizeSelect = async (size: string) => {
    setSelectedSize(size);

    if (!size) return;

    const selectedPattern = patterns.find((p) => p.size === size);
    if (!selectedPattern) return;

    try {
      // Save pattern to localStorage (WITHOUT images to avoid QuotaExceededError)
      const updatedData = { ...flowData, size: size };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));

      // Store only essential pattern data (no base64 images)
      const essentialPatternData = {
        size: selectedPattern.size,
        boardsWidth: selectedPattern.boardsWidth,
        boardsHeight: selectedPattern.boardsHeight,
        patternData: selectedPattern.patternData,
        colorsUsed: selectedPattern.colorsUsed,
        beadCount: selectedPattern.beadCount,
        // Store images in sessionStorage instead (larger limit, auto-clears on tab close)
      };
      localStorage.setItem("custom_pattern", JSON.stringify(essentialPatternData));

      // Store images separately in sessionStorage (if available)
      try {
        // Check if mockup has been generated by the service
        const mockupFromService = mockupStates[selectedPattern.size];
        const effectiveMockup = mockupFromService || selectedPattern.mockupBase64;

        sessionStorage.setItem("custom_pattern_images", JSON.stringify({
          size: selectedPattern.size,  // Store size so we can verify it matches
          patternBase64: selectedPattern.patternBase64,
          mockupBase64: effectiveMockup,
        }));
      } catch (e) {
        console.warn("Could not store pattern images in sessionStorage:", e);
        // Continue anyway - images can be regenerated if needed
      }

      // Find the custom kit from the cached list
      const customKit = customKits.find((kit) => kit.sizeName === size);

      if (!customKit) {
        // Fallback: fetch from API if not found in cached list
        const sizeMap: Record<string, number> = { small: 1, medium: 2, large: 3 };
        const productSize = sizeMap[size];

        // Build URL with optional dimension parameter
        let fetchUrl = `${API_URL}/api/products/custom-kit-by-size?product_size=${productSize}`;
        if (flowData.aspectRatio) {
          fetchUrl += `&dimension=${encodeURIComponent(flowData.aspectRatio)}`;
        }

        const response = await fetch(fetchUrl);

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
    // return `${labels[size] || size} (ca ${boardsW * 15}x${boardsH * 15} cm)`;
    return `${labels[size] || size}`;
  };

  if (!flowData.imageFile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />
      <main className="min-h-screen bg-background py-4">
        <PatternFlowStepper currentStep={2} />

        <div className="max-w-4xl mx-auto px-4 pb-12">

          {isLoading && (
            <>
              {!showGhostCards ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <LoadingSpinner
                    loadingMessage={
                      loadingStage === 'ai-generation'
                        ? "Genererer AI-stilisert bilde..."
                        : "Genererer dine perlemønster..."
                    }
                    description={
                      loadingStage === 'ai-generation'
                        ? "Vi lager et kunstnerisk bilde av motivet ditt"
                        : generate_pattern_description || ""
                    }
                  />
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-[#6B4E71] mb-3">
                      {chooseSizeHeader}
                    </h1>
                    <p className="text-[#6B4E71] text-base">
                      {chooseSizeText}
                    </p>
                  </div>
                  <div className="flex flex-col-reverse md:grid md:grid-cols-2 gap-6 mb-8">
                    {['small', 'large'].map((size) => {
                      const customKit = customKits.find((kit) => kit.sizeName === size);
                      const sizeLabels: Record<string, string> = {
                        small: "Liten",
                        medium: "Medium",
                        large: "Stor",
                      };

                      return (
                        <div
                          key={size}
                          className="rounded-lg p-4 border-2 border-[#C4B5C7] bg-white animate-pulse"
                        >
                          <div className="aspect-square bg-primary-pink/30 rounded mb-2 animate-pulse"></div>
                          <div className="py-2">
                            {customKit ? (
                              <>
                                <h3 className="text-lg font-semibold text-[#6B4E71] mb-1">
                                  {sizeLabels[size] || size}
                                </h3>
                                <p className="text-lg font-bold text-[#6B4E71]">
                                  {formatPrice(customKit.price, "NOK")}
                                </p>
                              </>
                            ) : (
                              <>
                                <div className="h-6 bg-[#C4B5C7]/30 rounded w-2/3 mb-2 animate-pulse"></div>
                                <div className="h-5 bg-[#C4B5C7]/20 rounded w-1/2 animate-pulse"></div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="bg-red-100 border-2 border-red-400 text-red-700 px-6 py-4 rounded-2xl mb-8">
              <p>{error}</p>
            </div>
          )}

          {!isLoading && patterns.length > 0 && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-semibold text-[#6B4E71] mb-3">
                  {chooseSizeHeader}
                </h1>
                <p className="text-[#6B4E71] text-base">
                  {chooseSizeText}
                </p>
              </div>
              <div className="flex flex-col-reverse md:grid md:grid-cols-2 gap-6 mb-8">
                {patterns.map((pattern) => {
                  const isHovered = hoveredPattern === pattern.size;
                  const mockupFromService = mockupStates[pattern.size];
                  const hasMockup = mockupFromService || pattern.mockupBase64;
                  const showMockup = isHovered && hasMockup;
                  const isLoadingMockup = isHovered && !hasMockup;
                  const customKit = customKits.find((kit) => kit.sizeName === pattern.size);

                  return (
                    <ProductCard
                      key={pattern.size}
                      title={getSizeLabel(pattern.size, pattern.patternData, pattern.boardsHeight)}
                      imageUrl={showMockup ? (mockupFromService || pattern.mockupBase64!) : pattern.patternBase64}
                      imageAlt={`${pattern.size} ${showMockup ? "mockup" : "pattern"}`}
                      imageOverlay={
                        isLoadingMockup ? (
                          <div className="absolute inset-0 bg-primary-pink bg-opacity-30 flex items-center justify-center rounded-lg">
                            <LoadingSpinner loadingMessage="Henter interiørbilder" />
                          </div>
                        ) : null
                      }
                      isSelected={selectedSize === pattern.size}
                      onClick={() => handleSizeSelect(pattern.size)}
                      onMouseEnter={() => {
                        setHoveredPattern(pattern.size);
                      }}
                      onMouseLeave={() => setHoveredPattern(null)}
                      className="h-full"
                      squareImageWithPadding={true}
                    >
                      {customKit?.price && (
                        <p className="text-lg font-bold text-[#6B4E71] mt-2">
                          {formatPrice(customKit?.price, "NOK")}
                        </p>
                      )}
                    </ProductCard>
                  );
                })}
              </div>
            </>
          )}
          {!isLoading && patterns.length > 0 && (
            <div className="justify-items-center">
              <h2>
                {startOverHeader}
              </h2>
              <p>
                {startOverText}
              </p>
              <PearlyButton
                label={startOverButtonLabel}
                skin="outline"
                onClick={() => router.push("/last-opp-bilde")} />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

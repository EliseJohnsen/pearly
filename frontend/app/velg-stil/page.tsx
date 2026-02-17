"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import PatternFlowStepper from "@/app/components/PatternFlowStepper";

const STORAGE_KEY = "pearly_pattern_flow";

interface PatternFlowData {
  imagePreview: string | null;
  imageFile: string | null;
  style: "realistic" | "ai-style" | null;
  size: "small" | "medium" | "large" | null;
}

export default function VelgStilPage() {
  const router = useRouter();
  const [flowData, setFlowData] = useState<PatternFlowData>({
    imagePreview: null,
    imageFile: null,
    style: null,
    size: null,
  });
  const [selectedStyle, setSelectedStyle] = useState<"realistic" | "ai-style" | null>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (!data.imagePreview) {
          // No image uploaded, redirect to step 1
          router.push("/last-opp-bilde");
          return;
        }
        setFlowData(data);
        setSelectedStyle(data.style);
      } catch (e) {
        router.push("/last-opp-bilde");
      }
    } else {
      router.push("/last-opp-bilde");
    }
  }, [router]);

  const handleRemoveImage = () => {
    localStorage.removeItem(STORAGE_KEY);
    router.push("/last-opp-bilde");
  };

  const handleStyleSelect = (style: "realistic" | "ai-style") => {
    setSelectedStyle(style);
  };

  const handleContinue = () => {
    if (selectedStyle) {
      const updatedData = { ...flowData, style: selectedStyle };
      setFlowData(updatedData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
      router.push("/velg-storrelse");
    }
  };

  if (!flowData.imagePreview) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />
      <main className="min-h-screen py-4">
        <PatternFlowStepper currentStep={1} />

        <div className="max-w-2xl mx-auto px-4 pb-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#6B4E71] mb-3">
              Velg stil
            </h1>
          </div>

          {/* Image Preview */}
          <div className="mb-8">
            <div className="relative border-2 border-dashed border-[#C4B5C7] rounded-2xl bg-[#F9F5FA]">
              <button
                onClick={handleRemoveImage}
                className="absolute -top-4 -right-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors z-10"
                aria-label="Fjern bilde"
              >
                <svg
                  className="w-6 h-6 text-gray-700"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <img
                src={flowData.imagePreview}
                alt="Preview"
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>

          {/* Style Selection */}
          <div className="space-y-4 mb-8">
            {/* Realistic Style */}
            <button
              onClick={() => handleStyleSelect("realistic")}
              className={`w-full text-left p-6 rounded-2xl border-2 transition-all ${
                selectedStyle === "realistic"
                  ? "border-[#6B4E71] bg-[#F5F0F6]"
                  : "border-[#C4B5C7] bg-white hover:border-[#6B4E71]"
              }`}
            >
              <h3 className="text-lg font-bold text-[#6B4E71] mb-2">
                Realistisk stil
              </h3>
              <p className="text-sm text-[#6B4E71]">
                Bevarer farger og utseende tett opp mot originalbildet. Egner seg best til portretter og enkle motiver
              </p>
            </button>

            {/* AI Style */}
            <button
              onClick={() => handleStyleSelect("ai-style")}
              className={`w-full text-left p-6 rounded-2xl border-2 transition-all ${
                selectedStyle === "ai-style"
                  ? "border-[#6B4E71] bg-[#F5F0F6]"
                  : "border-[#C4B5C7] bg-white hover:border-[#6B4E71]"
              }`}
            >
              <h3 className="text-lg font-bold text-[#6B4E71] mb-2">
                Forenklet og fargerik
              </h3>
              <p className="text-sm text-[#6B4E71]">
                Optimaliserer fargene og formene for perlemønster. Denne funksjonen bruker AI.{" "}
                <a
                  href="/ai-policy"
                  className="underline hover:text-[#5A3E5F]"
                  onClick={(e) => e.stopPropagation()}
                >
                  Les mer om vår AI-policy her
                </a>
              </p>
            </button>
          </div>

          {/* Continue Button */}
          <div className="mt-8">
            <button
              onClick={handleContinue}
              disabled={!selectedStyle}
              className="w-full bg-dark-purple hover:bg-[#5A3E5F] disabled:bg-[#C4B5C7] disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-full transition-colors text-lg"
            >
              Generer perlemønster
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

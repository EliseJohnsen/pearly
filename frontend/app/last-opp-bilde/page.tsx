"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import PatternFlowStepper from "@/app/components/PatternFlowStepper";
import UploadImage from "@/app/components/UploadImage";

const STORAGE_KEY = "pearly_pattern_flow";

interface PatternFlowData {
  imagePreview: string | null;
  imageFile: string | null; // base64
  style: "realistic" | "ai-style" | null;
  size: "small" | "medium" | "large" | null;
}

export default function LastOppBildePage() {
  const router = useRouter();
  const [imageSelected, setImageSelected] = useState(false);
  const [flowData, setFlowData] = useState<PatternFlowData>({
    imagePreview: null,
    imageFile: null,
    style: null,
    size: null,
  });

  // Load existing data from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setFlowData(data);
        if (data.imagePreview) {
          setImageSelected(true);
        }
      } catch (e) {
        console.error("Failed to parse stored flow data", e);
      }
    }
  }, []);

  const handleImageSelected = (file: File, preview: string) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const newFlowData: PatternFlowData = {
        imagePreview: preview,
        imageFile: base64,
        style: null,
        size: null,
      };
      setFlowData(newFlowData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newFlowData));
      setImageSelected(true);
    };
    reader.readAsDataURL(file);
  };

  const handleContinue = () => {
    if (imageSelected) {
      router.push("/velg-stil");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />
      <main className="min-h-screen bg-[#F5EDE8] py-4">
        <PatternFlowStepper currentStep={0} />

        <div className="max-w-2xl mx-auto px-4 pb-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#6B4E71] mb-3">
              Last opp et bilde
            </h1>
            <p className="text-[#6B4E71] text-base">
              Velg et bilde eller tegning du vil perle. Enkle motiv med god kontrast egner seg ofte best.
            </p>
          </div>

          <UploadImage
            onImageSelected={handleImageSelected}
            initialPreview={flowData.imagePreview}
          />

          <div className="mt-8">
            <button
              onClick={handleContinue}
              disabled={!imageSelected}
              className="w-full bg-dark-purple hover:bg-[#5A3E5F] disabled:bg-[#C4B5C7] disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-full transition-colors text-lg"
            >
              Lag ditt perlemønster
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

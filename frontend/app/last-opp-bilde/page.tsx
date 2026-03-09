"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import PatternFlowStepper from "@/app/components/PatternFlowStepper";
import UploadImage from "@/app/components/UploadImage";
import { useUIString } from "../hooks/useSanityData";

const STORAGE_KEY = "pearly_pattern_flow";

interface PatternFlowData {
  imagePreview: string | null;
  imageFile: string | null; // base64
  aspectRatio: "3:4" | "4:3" | "1:1" | null;
  style: "realistic" | "ai-style" | null;
  size: "small" | "medium" | "large" | null;
}

export default function LastOppBildePage() {
  const router = useRouter();
  const [imageSelected, setImageSelected] = useState(false);
  const [flowData, setFlowData] = useState<PatternFlowData>({
    imagePreview: null,
    imageFile: null,
    aspectRatio: null,
    style: null,
    size: null,
  });
  const [selectedStyle, setSelectedStyle] = useState<"realistic" | "ai-style" | null>(null);

  const uploadImageHeader = useUIString("last_opp_bilde");
  const uploadImageDesription = useUIString("last_opp_bilde_beskrivelse");
  const realisticStyleHeader = useUIString("realistisk_stil");
  const realisticStyleDescription = useUIString("realistisk_stil_beskrivelse");
  const wpapStyleHeader = useUIString("wpap_stil");
  const wpapStyleDescription = useUIString("wpap_stil_beskrivelse");
  const readAIPolicy = useUIString("les_om_ai_policy");

  // Load existing data from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        localStorage.clear();
      } catch (e) {
        console.error("Failed clear stored flow data", e);
      }
    }
  }, []);

  const handleImageSelected = (file: File, preview: string, aspectRatio: "3:4" | "4:3" | "1:1") => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const newFlowData: PatternFlowData = {
        imagePreview: preview,
        imageFile: base64,
        aspectRatio: aspectRatio,
        style: null,
        size: null,
      };
      setFlowData(newFlowData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newFlowData));
      setImageSelected(true);
    };
    reader.readAsDataURL(file);
  };

  const handleStyleSelect = (selectedStyle: "realistic" | "ai-style") => {
    const updatedData = { ...flowData, style: selectedStyle };
    setFlowData(updatedData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    router.push("/velg-storrelse");
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />
      <main className="min-h-screen bg-background py-4">
        <PatternFlowStepper currentStep={0} />

        <div className="max-w-2xl mx-auto px-4 pb-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#6B4E71] mb-3">
              {uploadImageHeader}
            </h1>
            <p className="text-[#6B4E71] text-base">
              {uploadImageDesription}
            </p>
          </div>

          <UploadImage
            onImageSelected={handleImageSelected}
            initialPreview={flowData.imagePreview}
          />

          {imageSelected && (
            <div className="space-y-4 mt-8">
              {/* Realistic Style */}
              <button
                onClick={() => handleStyleSelect("realistic")}
                className={`w-full text-left p-6 rounded-2xl border-2 transition-all ${selectedStyle === "realistic"
                  ? "border-[#6B4E71] bg-[#F5F0F6]"
                  : "border-[#C4B5C7] bg-white hover:border-[#6B4E71]"
                  }`}
              >
                <h3 className="text-lg font-bold text-[#6B4E71] mb-2">
                  {realisticStyleHeader}
                </h3>
                <p className="text-sm text-[#6B4E71]">
                  {realisticStyleDescription}
                </p>
              </button>

              {/* AI Style */}
              <button
                onClick={() => handleStyleSelect("ai-style")}
                className={`w-full text-left p-6 rounded-2xl border-2 transition-all ${selectedStyle === "ai-style"
                  ? "border-[#6B4E71] bg-[#F5F0F6]"
                  : "border-[#C4B5C7] bg-white hover:border-[#6B4E71]"
                  }`}
              >
                <h3 className="text-lg font-bold text-[#6B4E71] mb-2">
                  {wpapStyleHeader}
                </h3>
                <p className="text-sm text-[#6B4E71]">
                  {wpapStyleDescription}{" "}
                  <a
                    href="/ai-policy"
                    className="underline hover:text-[#5A3E5F]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {readAIPolicy}
                  </a>
                </p>
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

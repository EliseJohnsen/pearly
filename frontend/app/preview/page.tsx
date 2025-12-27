"use client";

import { useState } from "react";
import ImageUpload from "../components/ImageUpload";
import AIPatternGenerator from "../components/AIPatternGenerator";
import BeadPatternDisplay from "../components/BeadPatternDisplay";
import Header from "../components/Header";
import CTA from "../components/CTA";
import Banner from "../components/Banner";
import HowItWorks from "../components/HowItWorks";
import Footer from "../components/Footer";

export default function PreviewPage() {
  const [patternData, setPatternData] = useState<any>(null);
  const [popArtUrl, setPopArtUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"upload" | "ai">("upload");

  const handlePatternGenerated = (data: any, popArt: string | null) => {
    setPatternData(data);
    setPopArtUrl(popArt);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header></Header>
      <CTA></CTA>
      <Banner></Banner>
      <HowItWorks></HowItWorks>
        <div className="overflow-hidden bg-primary-light py-12">
          <div className="max-w-4xl mx-auto px-4">
            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab("upload")}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                  activeTab === "upload"
                    ? "bg-primary text-white shadow-lg"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                📸 Last opp bilde
              </button>
              <button
                onClick={() => setActiveTab("ai")}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                  activeTab === "ai"
                    ? "bg-primary text-white shadow-lg"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                ✨ Generer med AI
              </button>
            </div>

            {/* Content based on active tab */}
            {activeTab === "upload" ? (
              <ImageUpload onPatternGenerated={handlePatternGenerated} />
            ) : (
              <AIPatternGenerator onPatternGenerated={handlePatternGenerated} />
            )}

            {patternData && <BeadPatternDisplay pattern={patternData} pop_art_url={popArtUrl || undefined} />}
          </div>
        </div>
      <Footer></Footer>
    </div>
  );
}

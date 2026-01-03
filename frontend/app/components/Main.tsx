"use client";

import { useState } from "react";
import ImageUpload from "./ImageUpload";
import BeadPatternDisplay from "./BeadPatternDisplay";
import Header from "./Header";
import CTA from "./CTA";
import Banner from "./Banner";
import HowItWorks from "./HowItWorks";
import Footer from "./Footer";

export default function Main() {
  const [patternData, setPatternData] = useState<any>(null);
  const [popArtUrl, setPopArtUrl] = useState<string | null>(null);

  const handlePatternGenerated = (data: any, popArt: string | null = null) => {
    setPatternData(data);
    setPopArtUrl(popArt);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />
      <CTA />
      <Banner />
      <HowItWorks />
      <div className="overflow-hidden bg-primary-light py-12">
        <div className="max-w-4xl mx-auto px-4">
          <ImageUpload onPatternGenerated={handlePatternGenerated} />
          {patternData && <BeadPatternDisplay pattern={patternData} pop_art_url={popArtUrl || undefined} />}
        </div>
      </div>
      <Footer />
    </div>
  );
}

"use client";

import { useState } from "react";
import ImageUpload from "./components/ImageUpload";
import BeadPatternDisplay from "./components/BeadPatternDisplay";
import Header from "./components/Header";
import CTA from "./components/CTA";
import Banner from "./components/Banner";
import HowItWorks from "./components/HowItWorks";

export default function Home() {
  const [patternData, setPatternData] = useState<any>(null);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header></Header>
      <CTA></CTA>
      <Banner></Banner>
      <HowItWorks></HowItWorks>
        <div className="overflow-hidden bg-primary-light py-12">
          <div className="max-w-4xl mx-auto">
            <ImageUpload onPatternGenerated={setPatternData} />
            {patternData && <BeadPatternDisplay pattern={patternData} />}
          </div>
        </div>
    </div>
  );
}

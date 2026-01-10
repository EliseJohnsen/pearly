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
  const [isUploading, setIsUploading] = useState(false);

  const handlePatternGenerated = (data: any) => {
    setPatternData(data);
  };

  const handleUploadStatusChange = (uploading: boolean) => {
    setIsUploading(uploading);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />
      <CTA />
      <Banner />
      <HowItWorks />
      <div className="overflow-hidden bg-primary-light py-12">
        <div className="max-w-4xl mx-auto px-4">
          <ImageUpload
            onPatternGenerated={handlePatternGenerated}
            onUploadStatusChange={handleUploadStatusChange}
          />
          {patternData && !isUploading && 
          <BeadPatternDisplay pattern={patternData} />
          }
        </div>
      </div>
      <Footer />
    </div>
  );
}

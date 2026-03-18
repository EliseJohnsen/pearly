"use client";

import { useState } from "react";
import ImageUpload from "./ImageUpload";
import BeadPatternDisplay from "./BeadPatternDisplay";
import Header from "./Header";
import Footer from "./Footer";

interface PatternData {
  uuid?: string;
  [key: string]: unknown;
}

export default function Main() {
  const [patternData, setPatternData] = useState<PatternData | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handlePatternGenerated = (data: PatternData) => {
    setPatternData(data);
  };

  const handleUploadStatusChange = (uploading: boolean) => {
    setIsUploading(uploading);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />
      <main className="h-dvh overflow-scroll bg-primary-light py-12">
        <div className="max-w-4xl mx-auto px-4">
          <ImageUpload
            onPatternGenerated={handlePatternGenerated}
            onUploadStatusChange={handleUploadStatusChange}
          />
          {patternData && !isUploading && 
          <BeadPatternDisplay pattern={patternData} />
          }
        </div>
      </main>
      <Footer />
    </div>
  );
}

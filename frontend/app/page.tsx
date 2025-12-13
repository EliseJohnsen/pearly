"use client";

import { useState } from "react";
import ImageUpload from "./components/ImageUpload";
import BeadPatternDisplay from "./components/BeadPatternDisplay";
import Header from "./components/Header";
import CTA from "./components/CTA";
import Banner from "./components/Banner";

export default function Home() {
  const [patternData, setPatternData] = useState<any>(null);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header></Header>
      <CTA></CTA>
      <Banner></Banner>
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            feelin pearly
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Hvordan funker det?
          </p>
          <div className="flex max-w-4xl mx-auto mt-4 justify-between">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold">Last opp ditt bilde</h2>
                <p>Noe tekst her</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold">Få perlemønster</h2>
                                <p>Noe tekst her</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold">Skap ditt mesterverk!</h2>
                                <p>Noe tekst her</p>
              </div>
            </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <ImageUpload onPatternGenerated={setPatternData} />
          {patternData && <BeadPatternDisplay pattern={patternData} />}
        </div>
      </main>
    </div>
  );
}

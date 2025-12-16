"use client";

import { useState } from "react";
import ImageUpload from "./components/ImageUpload";
import BeadPatternDisplay from "./components/BeadPatternDisplay";
import Header from "./components/Header";
import CTA from "./components/CTA";
import Banner from "./components/Banner";
import {useHowItWorks} from "./hooks/useSanityData";

export default function Home() {
  const [patternData, setPatternData] = useState<any>(null);
  const {data: howItWorks, loading: howItWorksLoading} = useHowItWorks();

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
            {howItWorksLoading
              ? 'Hvordan funker det?'
              : howItWorks?.sectionTitle || 'Hvordan funker det?'}
          </p>
          {howItWorks?.sectionSubtitle && (
            <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">
              {howItWorks.sectionSubtitle}
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-4">
            {howItWorksLoading ? (
              // Loading state - show placeholder boxes
              <>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </>
            ) : howItWorks?.steps && howItWorks.steps.length > 0 ? (
              // Show Sanity data
              howItWorks.steps.map((step, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                  <h2 className="text-2xl font-bold mb-4">{step.title}</h2>
                  <p className="text-gray-600 dark:text-gray-300">{step.description}</p>
                </div>
              ))
            ) : (
              // Fallback to hardcoded content
              <>
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
              </>
            )}
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

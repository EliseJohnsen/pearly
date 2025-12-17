"use client";

import { useState } from "react";
import ImageUpload from "./components/ImageUpload";
import BeadPatternDisplay from "./components/BeadPatternDisplay";
import Header from "./components/Header";
import CTA from "./components/CTA";
import Banner from "./components/Banner";
import {useHowItWorks} from "./hooks/useSanityData";
import HandRaisedIcon from "@heroicons/react/24/outline/HandRaisedIcon";
import { ArrowUpCircleIcon, ArrowUpOnSquareIcon, ArrowUpTrayIcon, GifIcon, GiftIcon, GiftTopIcon, PhotoIcon } from "@heroicons/react/24/outline";

export default function Home() {
  const [patternData, setPatternData] = useState<any>(null);
  const {data: howItWorks, loading: howItWorksLoading} = useHowItWorks();

  const getHowItWorksBgColor = () => {
    if (howItWorks && howItWorks.backgroundColor) {
      return howItWorks.backgroundColor
    } else
      return '#F5B0DF'
  }

  const getHowItWorksFontColor = () => {
    if (howItWorks && howItWorks.fontColor) {
      return howItWorks.fontColor
    } else
      return '#BA7EB9'
  }

  const getHowItWorksStepIcon = (index) => {
    switch (index) {
      case 0:
        return <ArrowUpTrayIcon aria-hidden="true" className="size-12 text-white" style={{color: getHowItWorksFontColor()}} />
      case 1:
        return <GiftIcon aria-hidden="true" className="size-12 text-white" style={{color: getHowItWorksFontColor()}} />
      case 2:
        return <PhotoIcon aria-hidden="true" className="size-12 text-white" style={{color: getHowItWorksFontColor()}} />
      default:
        return <GiftIcon aria-hidden="true" className="size-12 text-white" style={{color: getHowItWorksFontColor()}} />
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header></Header>
      <CTA></CTA>
      <Banner></Banner>
      <main className="container mx-auto px-4 py-10">
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
                <div className="justify-items-center">
                  <div className="w-32 h-32 rounded-full flex items-center justify-center"
                    style={{backgroundColor: getHowItWorksBgColor()}}>
                      {getHowItWorksStepIcon(index)}
                </div>
                <div key={index} className="p-8" style={{color: getHowItWorksFontColor()}}>
                  <h2 className="text-2xl font-bold mb-4">{step.title}</h2>
                  <p>{step.description}</p>
                </div>
                                </div>
              ))
            ) : (
              // Fallback to hardcoded content
              <>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                  <h2 className="text-2xl font-bold">Last opp ditt bilde</h2>
                  <p>Velg et bilde eller tegning, og velg hvor stort du vil at din ferdig perling skal bli</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                  <h2 className="text-2xl font-bold">Motta perlepakke</h2>
                  <p>Du får ditt skreddersydde mønster og alle perlene du trenger tilsendt i posten</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                  <h2 className="text-2xl font-bold">Lag ditt mesterverk!</h2>
                  <p>Følg mønsteret og kos deg med å lage din egen perlemønster</p>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
        <div className="overflow-hidden bg-primary-light py-12">
          <div className="max-w-4xl mx-auto">
            <ImageUpload onPatternGenerated={setPatternData} />
            {patternData && <BeadPatternDisplay pattern={patternData} />}
          </div>
        </div>
    </div>
  );
}

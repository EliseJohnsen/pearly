"use client";

import {useHowItWorks} from "../hooks/useSanityData";
import { ArrowUpTrayIcon, GiftIcon, PhotoIcon } from "@heroicons/react/24/outline";

interface HowItWorksProps {
  data?: any
}

export default function HowItWorks({ data }: HowItWorksProps = {}) {
  const {data: fetchedHowItWorks, loading: howItWorksLoading} = useHowItWorks();

  // Use provided data if available, otherwise use fetched data
  const howItWorks = data || fetchedHowItWorks;

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

  const getHowItWorksStepIcon = (index: number) => {
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
    <main className="container mx-auto px-4 py-10">
      <div className="text-center mb-12">
        <p className="text-4xl my-2" style={{color: getHowItWorksFontColor()}}>
          {howItWorksLoading
            ? 'Hvordan funker det?'
            : howItWorks?.sectionTitle || 'Hvordan funker det?'}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto mt-4">
          {howItWorksLoading ? (
            <>
              <div key="skeleton-1" className="bg-white rounded-lg shadow-lg p-8 animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
              <div key="skeleton-2" className="bg-white rounded-lg shadow-lg p-8 animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
              <div key="skeleton-3" className="bg-white rounded-lg shadow-lg p-8 animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </>
          ) : howItWorks?.steps && howItWorks.steps.length > 0 ? (
            howItWorks.steps.map((step: any, index: number) => (
              <div key={index} className="justify-items-center">
                <div className="w-32 h-32 rounded-full flex items-center justify-center"
                  style={{backgroundColor: getHowItWorksBgColor()}}>
                    {getHowItWorksStepIcon(index)}
              </div>
              <div className="p-8" style={{color: getHowItWorksFontColor()}}>
                <h2 className="text-2xl font-bold mb-4">{step.title}</h2>
                <p className="text-xl">{step.description}</p>
              </div>
            </div>
            ))
          ) : (
            // Fallback to hardcoded content
            <>
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold">Last opp ditt bilde</h2>
                <p>Velg et bilde eller tegning, og velg hvor stort du vil at din ferdig perling skal bli</p>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold">Motta perlepakke</h2>
                <p>Du får ditt skreddersydde mønster og alle perlene du trenger tilsendt i posten</p>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold">Lag ditt mesterverk!</h2>
                <p>Følg mønsteret og kos deg med å lage din egen perlemønster</p>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

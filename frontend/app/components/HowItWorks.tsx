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
      return '#FBE7F5'
  }

  const getHowItWorksFontColor = () => {
    if (howItWorks && howItWorks.fontColor) {
      return howItWorks.fontColor
    } else
      return '#673154'
  }

  const getHowItWorksStepIcon = (index: number) => {
    switch (index) {
      case 0:
        return <ArrowUpTrayIcon aria-hidden="true" className="size-12 text-white" style={{color: '#BA7EB9'}} />
      case 1:
        return <GiftIcon aria-hidden="true" className="size-12 text-white" style={{color: '#BA7EB9'}} />
      case 2:
        return <PhotoIcon aria-hidden="true" className="size-12 text-white" style={{color: '#BA7EB9'}} />
      default:
        return <GiftIcon aria-hidden="true" className="size-12 text-white" style={{color: '#BA7EB9'}} />
    }
  }

  return (
    <main className="container mx-auto px-4 pt-16 pb-2">
      <div className="text-center mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto mt-10">
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
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-2 text-purple">{step.title}</h3>
                <p className="text-base">{step.description}</p>
              </div>
            </div>
            ))
          ) : (
            // Fallback to hardcoded content
            <>
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h3 className="text-2xl font-bold">Last opp ditt bilde</h3>
                <p>Velg et bilde eller tegning, og velg hvor stort du vil at din ferdig perling skal bli</p>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h3 className="text-2xl font-bold">Motta perlepakke</h3>
                <p>Du får ditt skreddersydde mønster og alle perlene du trenger tilsendt i posten</p>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h3 className="text-2xl font-bold">Lag ditt mesterverk!</h3>
                <p>Følg mønsteret og kos deg med å lage din egen perlemønster</p>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

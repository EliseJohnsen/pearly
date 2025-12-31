"use client";

import Image from "next/image";
import { useComingSoon } from "../hooks/useSanityData";
import Footer from "./Footer";

export default function ComingSoon() {
  const { data: comingSoonData, loading, error } = useComingSoon();

  if (error || !comingSoonData) {
    return null;
  }

  const { logo, heading, headingFontSize, subheading, subheadingFontSize, backgroundColor, textColor } = comingSoonData;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: backgroundColor || "#ffffff",
        color: textColor || "#000000",
      }}
    >
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        {/* Logo */}
        {logo && logo.asset && (
          <div className="mb-18 animate-fade-in">
            <Image
              src={logo.asset.url}
              alt={logo.alt || "Logo"}
              width={logo.width || 350}
              height={logo.width || 350}
              className="max-w-xs md:max-w-md object-contain"
              priority
            />
          </div>
        )}

        {/* Heading */}
        <h1
          className="font-bold text-center mb-2 animate-fade-in-up"
          style={{
            color: textColor || "#000000",
            fontSize: headingFontSize ? `${headingFontSize}px` : '3rem'
          }}
        >
          {heading}
        </h1>

        {/* Subheading */}
        {subheading && (
          <p
            className="text-center max-w-2xl animate-fade-in-up-delay"
            style={{
              color: textColor || "#000000",
              opacity: 0.8,
              fontSize: subheadingFontSize ? `${subheadingFontSize}px` : '1.5rem'
            }}
          >
            {subheading}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto">
        <Footer />
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 1s ease-in;
        }

        .animate-fade-in-up {
          animation: fadeInUp 1s ease-in 0.3s both;
        }

        .animate-fade-in-up-delay {
          animation: fadeInUp 1s ease-in 0.6s both;
        }
      `}</style>
    </div>
  );
}

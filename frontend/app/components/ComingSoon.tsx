"use client";

import Image from "next/image";
import { useComingSoon } from "../hooks/useSanityData";
import Footer from "./Footer";

export default function ComingSoon() {
  const { data: comingSoonData, loading, error } = useComingSoon();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Laster...</div>
      </div>
    );
  }

  if (error || !comingSoonData) {
    return null;
  }

  const { logo, heading, subheading, backgroundColor, textColor } = comingSoonData;

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
          <div className="mb-8 animate-fade-in">
            <Image
              src={logo.asset.url}
              alt={logo.alt || "Logo"}
              width={logo.asset.metadata?.dimensions?.width || 300}
              height={logo.asset.metadata?.dimensions?.height || 300}
              className="max-w-xs md:max-w-md object-contain"
              priority
            />
          </div>
        )}

        {/* Heading */}
        <h1
          className="text-4xl md:text-6xl font-bold text-center mb-6 animate-fade-in-up"
          style={{ color: textColor || "#000000" }}
        >
          {heading}
        </h1>

        {/* Subheading */}
        {subheading && (
          <p
            className="text-xl md:text-2xl text-center max-w-2xl animate-fade-in-up-delay"
            style={{ color: textColor || "#000000", opacity: 0.8 }}
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

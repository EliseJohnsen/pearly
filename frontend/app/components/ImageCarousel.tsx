"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { urlFor } from "@/lib/sanity";
import Link from "next/link";

interface ImageCarouselProps {
  data: {
    heading: string;
    description?: string;
    images: Array<{
      asset: {
        _id: string;
        url: string;
        metadata?: {
          lqip?: string;
          dimensions?: {
            width: number;
            height: number;
          };
        };
      };
      alt: string;
    }>;
    autoRotate?: boolean;
    rotationInterval?: number;
    ctaButton: {
      text: string;
      href: string;
    };
    isActive?: boolean;
  };
}

export default function ImageCarousel({ data }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex === data.images.length - 1 ? 0 : prevIndex + 1
    );
  }, [data.images.length]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? data.images.length - 1 : prevIndex - 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Auto-rotate functionality
  useEffect(() => {
    if (!data.autoRotate) return;

    const interval = setInterval(() => {
      goToNext();
    }, (data.rotationInterval || 5) * 1000);

    return () => clearInterval(interval);
  }, [data.autoRotate, data.rotationInterval, goToNext]);

  if (data.isActive === false) return null;

  return (
    <section className="container mx-auto px-4 py-6 md:py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-3xl font-bold text-dark-purple mb-4">
          {data.heading}
        </h1>
        {data.description && (
          <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto">
            {data.description}
          </p>
        )}
      </div>

      {/* Carousel */}
      <div className="relative max-w-4xl mx-auto">
        {/* Main Image */}
        <div className="relative aspect-[4/3] bg-pink-100 rounded-md overflow-hidden">
          {data.images.map((image, index) => (
            <div
              key={image.asset._id}
              className={`absolute inset-0 transition-opacity duration-500 ${
                index === currentIndex ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src={urlFor(image).width(1200).quality(85).auto("format").url()}
                alt={image.alt}
                fill
                className="object-cover"
                priority={index === 0}
                placeholder={image.asset.metadata?.lqip ? "blur" : "empty"}
                blurDataURL={image.asset.metadata?.lqip}
              />
            </div>
          ))}

          {/* Navigation Arrows */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
            aria-label="Forrige bilde"
          >
            <ChevronLeftIcon className="w-6 h-6 text-gray-900" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
            aria-label="Neste bilde"
          >
            <ChevronRightIcon className="w-6 h-6 text-gray-900" />
          </button>
        </div>

        {/* Thumbnails */}
        <div className="flex gap-2 md:gap-4 mt-4 justify-center pb-2">
          {data.images.map((image, index) => (
            <button
              key={image.asset._id}
              onClick={() => goToSlide(index)}
              className={`relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-md overflow-hidden transition-all ${
                index === currentIndex
                  ? "ring-4 ring-purple-600 opacity-100"
                  : "opacity-60 hover:opacity-80"
              }`}
              aria-label={`Gå til bilde ${index + 1}`}
            >
              <Image
                src={urlFor(image).width(200).quality(70).auto("format").url()}
                alt={image.alt}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      {/* CTA Button */}
      <div className="text-center mt-8">
        <Link
          href={data.ctaButton.href}
          className="inline-block px-8 py-4 bg-dark-purple text-white text-lg font-semibold rounded-full hover:bg-purple-800 transition-colors"
        >
          {data.ctaButton.text}
        </Link>
      </div>
    </section>
  );
}

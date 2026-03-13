"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { urlFor } from "@/lib/sanity";
import PearlyButton from "./PearlyButton";

interface ImageCarouselProps {
  data: {
    heading?: string;
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
    ctaButton?: {
      text: string;
      href: string;
    };
    isActive?: boolean;
    aspectRatio?: "square" | "portrait";
  };
  carouselOnly?: boolean;
}

export default function ImageCarousel({ data, carouselOnly = false }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

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

  const aspectRatio = data.aspectRatio || "square";
  const aspectClass = aspectRatio === "portrait" ? "aspect-[3/4]" : "aspect-square";
  const objectFit = "object-contain";

  // Helper function to check if image is base64 or direct URL
  const isBase64OrDirectUrl = (url: string) => {
    return url.startsWith("data:") || url.startsWith("http");
  };

  // Helper function to get image URL
  const getImageUrl = (image: any, width: number) => {
    // If the URL is already a base64 string or direct URL, return it as-is
    if (isBase64OrDirectUrl(image.asset.url)) {
      return image.asset.url;
    }
    // Otherwise, use Sanity's URL builder
    return urlFor(image).width(width).quality(85).auto("format").url();
  };

  return (
    <section className="w-full md:p-4">
      {/* Header — hidden in carouselOnly mode */}
      {!carouselOnly && data.heading && (
        <div className="mb-8">
          <h2 className="text-3xl font-semibold text-dark-purple mb-4">
            {data.heading}
          </h2>
          {data.description && (
            <p className="text-lg md:text-xl text-gray-900">
              {data.description}
            </p>
          )}
        </div>
      )}

      {/* Carousel */}
      <div className="relative mx-auto">
        {/* Main Image + Navigation Arrows */}
        <div className="relative">
          <div
            className={`${aspectClass} bg-primary-pink md:rounded-md overflow-hidden`}
            onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              if (touchStartX.current === null) return;
              const diff = touchStartX.current - e.changedTouches[0].clientX;
              if (Math.abs(diff) > 40) diff > 0 ? goToNext() : goToPrevious();
              touchStartX.current = null;
            }}
          >
            {data.images.map((image, index) => (
              <div
                key={image.asset._id}
                className={`absolute inset-[7.5%] transition-opacity duration-500 ${
                  index === currentIndex ? "opacity-100" : "opacity-0"
                }`}
              >
                <Image
                  src={getImageUrl(image, 1200)}
                  alt={image.alt}
                  fill
                  className={`${objectFit} drop-shadow-lg`}
                  priority={index === 0}
                  placeholder={image.asset.metadata?.lqip ? "blur" : "empty"}
                  blurDataURL={image.asset.metadata?.lqip}
                />
              </div>
            ))}
            {/* Dot indicators — mobile only, overlaid at bottom */}
            {data.images.length > 1 && (
              <div className="md:hidden absolute bottom-[1.5%] left-0 right-0 flex justify-center z-10">
                <div className="flex items-center gap-2 bg-dark-purple/40 rounded-full px-3 py-2">
                  {data.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      aria-label={`Gå til bilde ${index + 1}`}
                      className={`rounded-full transition-all ${
                        index === currentIndex
                          ? 'w-2.5 h-2.5 bg-white'
                          : 'w-2 h-2 bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={goToPrevious}
            className="hidden md:flex absolute -left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg items-center justify-center hover:bg-gray-50 transition-colors z-10"
            aria-label="Forrige bilde"
          >
            <ChevronLeftIcon className="w-6 h-6 text-gray-900" />
          </button>
          <button
            onClick={goToNext}
            className="hidden md:flex absolute -right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg items-center justify-center hover:bg-gray-50 transition-colors z-10"
            aria-label="Neste bilde"
          >
            <ChevronRightIcon className="w-6 h-6 text-gray-900" />
          </button>
        </div>

        {/* Thumbnails — hidden on mobile */}
        <div className="hidden md:flex gap-4 mt-4 justify-center pb-2">
          {data.images.map((image, index) => (
            <button
              key={image.asset._id}
              onClick={() => goToSlide(index)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden transition-all ${
                index === currentIndex
                  ? "opacity-100"
                  : "opacity-60 hover:opacity-80"
              }`}
              aria-label={`Gå til bilde ${index + 1}`}
            >
              <Image
                src={getImageUrl(image, 200)}
                alt={image.alt}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      {/* CTA Button — hidden in carouselOnly mode */}
      {!carouselOnly && data.ctaButton && (
        <div className="flex justify-center">
          <PearlyButton skin="primary" href={data.ctaButton.href}>
            {data.ctaButton.text}
          </PearlyButton>
        </div>
      )}
    </section>
  );
}

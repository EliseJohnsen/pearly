"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { urlFor } from "@/lib/sanity";
import Link from "next/link";

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
    <section className="container max-w-4xl mx-auto p-4">
      {/* Header */}
      {data.heading && (
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
          <div className={`${aspectClass} bg-pink-100 rounded-md overflow-hidden`}>
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
          </div>
          <button
            onClick={goToPrevious}
            className="absolute -left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
            aria-label="Forrige bilde"
          >
            <ChevronLeftIcon className="w-6 h-6 text-gray-900" />
          </button>
          <button
            onClick={goToNext}
            className="absolute -right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
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

      {/* CTA Button */}
      {data.ctaButton && (
        <div className="text-center mt-8">
          <Link
            href={data.ctaButton.href}
            className="inline-block px-8 py-4 bg-dark-purple text-white text-lg font-semibold rounded-full hover:bg-purple-800 transition-colors"
          >
            {data.ctaButton.text}
          </Link>
        </div>
      )}
    </section>
  );
}

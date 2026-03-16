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
  const images = data.images;
  const count = images.length;

  // For infinite loop: [lastClone, ...images, firstClone]
  // Real images live at indices 1..count, clones at 0 and count+1
  const extendedImages = count > 1
    ? [images[count - 1], ...images, images[0]]
    : images;

  const [currentIndex, setCurrentIndex] = useState(count > 1 ? 1 : 0);
  const [noTransition, setNoTransition] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  // Real (dot) index: 0-based into original images array
  const realIndex = count > 1
    ? Math.min(Math.max(currentIndex - 1, 0), count - 1)
    : currentIndex;

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (count > 1 ? prev + 1 : 0));
  }, [count]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (count > 1 ? prev - 1 : 0));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(count > 1 ? index + 1 : index);
  };

  // After sliding to a clone, instantly jump to the real counterpart
  const handleTransitionEnd = () => {
    if (count <= 1) return;
    if (currentIndex === 0) {
      setNoTransition(true);
      setCurrentIndex(count);
    } else if (currentIndex === count + 1) {
      setNoTransition(true);
      setCurrentIndex(1);
    }
  };

  // Re-enable transition one frame after the silent jump
  useEffect(() => {
    if (!noTransition) return;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setNoTransition(false)));
    return () => cancelAnimationFrame(id);
  }, [noTransition]);

  // Auto-rotate
  useEffect(() => {
    if (!data.autoRotate) return;
    const interval = setInterval(goToNext, (data.rotationInterval || 5) * 1000);
    return () => clearInterval(interval);
  }, [data.autoRotate, data.rotationInterval, goToNext]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    setDragOffset(e.touches[0].clientX - touchStartX.current);
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null) return;
    const threshold = (containerRef.current?.offsetWidth ?? 300) * 0.3;
    if (dragOffset < -threshold) goToNext();
    else if (dragOffset > threshold) goToPrevious();
    setDragOffset(0);
    setIsDragging(false);
    touchStartX.current = null;
  };

  if (data.isActive === false) return null;

  const aspectRatio = data.aspectRatio || "square";
  const aspectClass = aspectRatio === "portrait" ? "aspect-[3/4]" : "aspect-square";

  const isBase64OrDirectUrl = (url: string) =>
    url.startsWith("data:") || url.startsWith("http");

  const getImageUrl = (image: any, width: number) => {
    if (isBase64OrDirectUrl(image.asset.url)) return image.asset.url;
    return urlFor(image).width(width).quality(85).auto("format").url();
  };

  return (
    <section className="w-full md:p-4">
      {/* Header — hidden in carouselOnly mode */}
      {!carouselOnly && data.heading && (
        <div className="mb-8">
          <h2 className="font-display text-3xl leading-none text-dark-purple mb-4">{data.heading}</h2>
          {data.description && (
            <p className="text-lg md:text-xl text-gray-900">{data.description}</p>
          )}
        </div>
      )}

      {/* Carousel */}
      <div className="relative mx-auto">
        <div className="relative">
          <div
            ref={containerRef}
            className={`${aspectClass} bg-primary-pink md:rounded-md overflow-hidden`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Mobile: infinite sliding track */}
            <div
              className="md:hidden flex h-full"
              style={{
                transform: `translateX(calc(${-currentIndex * 100}% + ${dragOffset}px))`,
                transition: isDragging || noTransition ? "none" : "transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)",
                willChange: "transform",
              }}
              onTransitionEnd={handleTransitionEnd}
            >
              {extendedImages.map((image, index) => (
                <div key={index} className="flex-shrink-0 w-full h-full relative">
                  <div className="absolute inset-[7.5%]">
                    <Image
                      src={getImageUrl(image, 1200)}
                      alt={image.alt}
                      fill
                      className="object-contain drop-shadow-lg"
                      draggable={false}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: fade */}
            {images.map((image, index) => (
              <div
                key={image.asset._id}
                className={`hidden md:block absolute inset-[7.5%] transition-opacity duration-500 ${
                  index === realIndex ? "opacity-100" : "opacity-0"
                }`}
              >
                <Image
                  src={getImageUrl(image, 1200)}
                  alt={image.alt}
                  fill
                  className="object-contain drop-shadow-lg"
                  priority={index === 0}
                  placeholder={image.asset.metadata?.lqip ? "blur" : "empty"}
                  blurDataURL={image.asset.metadata?.lqip}
                />
              </div>
            ))}

            {/* Dot indicators — mobile only */}
            {count > 1 && (
              <div className="md:hidden absolute bottom-[1.5%] left-0 right-0 flex justify-center z-10">
                <div className="flex items-center gap-2 bg-dark-purple/40 rounded-full px-3 py-2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      aria-label={`Gå til bilde ${index + 1}`}
                      className={`rounded-full transition-all ${
                        index === realIndex ? "w-2.5 h-2.5 bg-white" : "w-2 h-2 bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Desktop chevrons */}
          {realIndex > 0 && (
            <button
              onClick={goToPrevious}
              className="hidden md:flex absolute -left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg items-center justify-center hover:bg-gray-50 transition-colors z-10"
              aria-label="Forrige bilde"
            >
              <ChevronLeftIcon className="w-6 h-6 text-gray-900" />
            </button>
          )}
          {realIndex < count - 1 && (
            <button
              onClick={goToNext}
              className="hidden md:flex absolute -right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg items-center justify-center hover:bg-gray-50 transition-colors z-10"
              aria-label="Neste bilde"
            >
              <ChevronRightIcon className="w-6 h-6 text-gray-900" />
            </button>
          )}
        </div>

        {/* Thumbnails — desktop only */}
        <div className="hidden md:flex gap-4 mt-4 justify-center pb-2">
          {images.map((image, index) => (
            <button
              key={image.asset._id}
              onClick={() => goToSlide(index)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden transition-all ${
                index === realIndex ? "opacity-100" : "opacity-60 hover:opacity-80"
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

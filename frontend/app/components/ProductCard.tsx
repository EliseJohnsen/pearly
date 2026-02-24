'use client'

import { ReactNode } from 'react';

interface ProductImage {
  asset: {
    url: string;
  };
  alt?: string;
  isPrimary?: boolean;
}

interface ProductCardProps {
  product?: {
    _id: string;
    title: string;
    slug: { current: string };
    description?: string;
    images?: ProductImage[];
    image?: ProductImage;
  };
  // Pattern-specific props
  title?: string;
  imageUrl?: string;
  imageAlt?: string;
  imageOverlay?: ReactNode; // Content to overlay on the image (e.g., loading spinner)
  isSelected?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  href?: string;
  children?: ReactNode; // Main content below the image
  className?: string;
}

export default function ProductCard({
  product,
  title,
  imageUrl,
  imageAlt,
  imageOverlay,
  isSelected = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
  href,
  children,
  className = '',
}: ProductCardProps) {
  // Determine if this is a product card or custom card
  const isProductCard = !!product;

  // Get product details
  const productImages = product?.images?.length
    ? product.images
    : (product?.image ? [product.image] : []);
  const primaryImage = productImages.find((img) => img.isPrimary) || productImages[0];

  const cardTitle = isProductCard ? product.title : title;
  const cardImageUrl = isProductCard ? primaryImage?.asset.url : imageUrl;
  const cardImageAlt = isProductCard ? (primaryImage?.alt || product.title) : imageAlt;
  const cardHref = isProductCard ? `/produkter/${product.slug.current}` : href;

  // Base classes
  const baseClasses = "rounded-lg p-4 transition-all text-left hover:z-10";
  const selectedClasses = isSelected
    ? "border-[#6B4E71] bg-[#F5F0F6] shadow-lg"
    : "border-[#C4B5C7] bg-white hover:border-[#6B4E71]";

  // Content wrapper
  const cardContent = (
    <>
      {cardImageUrl && (
        <div className="overflow-hidden bg-primary-pink relative aspect-square">
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <img
              src={cardImageUrl}
              alt={cardImageAlt || cardTitle || 'Product image'}
              className="max-w-full max-h-full object-contain"
            />
          </div>
          {imageOverlay}
        </div>
      )}
      {(cardTitle || children) && (
        <div className="py-2">
          {cardTitle && (
            <h3 className="text-lg font-bold text-[#6B4E71] mb-1">
              {cardTitle}
            </h3>
          )}
          {isProductCard && product.description && (
            <p className="text-gray-600 text-sm">
              {product.description}
            </p>
          )}
          {children}
        </div>
      )}
    </>
  );

  // If there's an onClick handler, render as button
  if (onClick) {
    return (
      <button
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={`${baseClasses} ${selectedClasses} ${className}`}
      >
        {cardContent}
      </button>
    );
  }

  // If there's an href, render as link
  if (cardHref) {
    return (
      <a
        href={cardHref}
        className={`${baseClasses} hover:shadow-lg block ${className}`}
      >
        {cardContent}
      </a>
    );
  }

  // Otherwise, render as div
  return (
    <div className={`${baseClasses} ${className}`}>
      {cardContent}
    </div>
  );
}

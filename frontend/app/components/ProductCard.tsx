'use client'

import { ReactNode } from 'react';
import { formatPrice } from '../utils/priceFormatter';

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
    price?: number;
    requiredBoards?: number;
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
  const baseClasses = "rounded-lg overflow-hidden transition-all text-left hover:z-10 cursor-pointer";
  const selectedClasses = isSelected
    ? "border-[#6B4E71] bg-[#F5F0F6] shadow-lg"
    : "border-[#C4B5C7] bg-white hover:border-[#6B4E71]";

  const cardContent = (
    <div className="flex flex-col" style={{ aspectRatio: '1 / 1.3' }}>
      {cardImageUrl && (
        <div className="overflow-hidden bg-primary-pink relative aspect-[3/4]">
          <div className="absolute inset-0">
            <img
              src={cardImageUrl}
              alt={cardImageAlt || cardTitle || 'Product image'}
              className="w-full h-full object-cover"
            />
          </div>
          {imageOverlay}
        </div>
      )}
      {(cardTitle || children) && (
        <div className="p-4 bg-inherit">
          {cardTitle && (
            <h3 className="text-lg font-bold text-[#6B4E71] mb-1">
              {cardTitle}
            </h3>
          )}
          {isProductCard && product.price && product.requiredBoards ? (
            <p className="text-sm">
              {formatPrice(product.price + (product.requiredBoards * 12), "NOK")}
            </p>
          ) : isProductCard && product.price ? (
            <p className="text-sm">
              fra {formatPrice(product.price, "NOK")}
            </p>
          ) : null}
          {children}
        </div>
      )}
    </div>
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

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
  disabled?: boolean;
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
  disabled = false,
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
  const cursorClass = disabled ? "cursor-default" : "cursor-pointer";
  const baseClasses = `rounded-lg overflow-hidden transition-all text-left hover:z-10 ${cursorClass}`;
  const selectedClasses = isSelected
    ? "border-[#6B4E71] bg-[#F5F0F6] shadow-lg"
    : "border-[#C4B5C7] bg-white hover:border-[#6B4E71]";
  const disabledClasses = disabled ? "opacity-60" : "";

  const cardContent = (
    <div className="flex flex-col" style={{ aspectRatio: '1 / 1.3' }}>
      {cardImageUrl && (
        <div className="flex-1 overflow-hidden bg-primary-pink relative flex items-center justify-center py-8 px-4">
          <img
            src={cardImageUrl}
            alt={cardImageAlt || cardTitle || 'Product image'}
            className="max-w-full max-h-full object-contain"
          />
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
        onClick={disabled ? undefined : onClick}
        onMouseEnter={disabled ? undefined : onMouseEnter}
        onMouseLeave={disabled ? undefined : onMouseLeave}
        disabled={disabled}
        className={`${baseClasses} ${selectedClasses} ${disabledClasses} ${className}`}
      >
        {cardContent}
      </button>
    );
  }

  // If there's an href, render as link
  if (cardHref) {
    return (
      <a
        href={disabled ? undefined : cardHref}
        onClick={disabled ? (e) => e.preventDefault() : undefined}
        className={`${baseClasses} hover:shadow-lg block ${disabledClasses} ${className}`}
      >
        {cardContent}
      </a>
    );
  }

  // Otherwise, render as div
  return (
    <div className={`${baseClasses} ${disabledClasses} ${className}`}>
      {cardContent}
    </div>
  );
}

'use client'

interface ProductImage {
  asset: {
    url: string;
  };
  alt?: string;
  isPrimary?: boolean;
}

interface ProductCardProps {
  product: {
    _id: string;
    title: string;
    slug: { current: string };
    description?: string;
    images?: ProductImage[];
    image?: ProductImage;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  // Get primary image or fallback to first image
  const productImages = product.images?.length
    ? product.images
    : (product.image ? [product.image] : []);
  const primaryImage = productImages.find((img) => img.isPrimary) || productImages[0];

  return (
    <a
      href={`/produkter/${product.slug.current}`}
      className="rounded-lg p-4 hover:shadow-lg transition block"
    >
      {primaryImage && (
        <img
          src={primaryImage.asset.url}
          alt={primaryImage.alt || product.title}
          className="aspect-3/4 object-cover rounded mb-4"
        />
      )}
      <h3 className="font-semibold text-lg mb-2">
        {product.title}
      </h3>
      {product.description && (
        <p className="text-gray-600 text-sm">
          {product.description}
        </p>
      )}
    </a>
  );
}

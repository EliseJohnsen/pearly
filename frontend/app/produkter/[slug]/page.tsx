"use client";

import { client } from "@/lib/sanity";
import { groq } from "next-sanity";
import { notFound } from "next/navigation";
import { use, useEffect, useState } from "react";
import { productQuery } from "@/lib/queries";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { PortableText } from "@portabletext/react";



interface ProductVariant {
  sku: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
  };
  weight?: number;
  stockQuantity: number;
  isActive: boolean;
}

interface ProductImage {
  asset: {
    _id: string;
    url: string;
    metadata: {
      lqip: string;
      dimensions: { width: number; height: number };
    };
  };
  alt?: string;
  isPrimary?: boolean;
}

interface Product {
  _id: string;
  title: string;
  slug: { current: string };
  description?: string;
  longDescription?: any;
  productType: string;
  status: string;
  difficulty?: string;
  category?: string;
  colors?: number;
  gridSize?: string;
  tags?: string[];
  currency: string;
  vatRate: number;
  isFeatured: boolean;
  images?: ProductImage[];
  image?: ProductImage; // For backwards compatibility with older products
  variants?: ProductVariant[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const data = await client.fetch(productQuery, { slug });
        console.log("Fetched product data:", data);
        console.log("Product images:", data?.images);
        setProduct(data);
        // Select first available variant by default
        if (data?.variants?.length > 0) {
          setSelectedVariant(data.variants.find((v: ProductVariant) => v.isActive) || data.variants[0]);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Laster produkt...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    notFound();
  }

  const productImages = product.images?.length
    ? product.images
    : (product.image ? [product.image] : []);
  const selectedImage = productImages[selectedImageIndex];

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("nb-NO", {
      style: "currency",
      currency: currency || "NOK",
    }).format(price);
  };

  const handleAddToCart = () => {
    if (!selectedVariant) return;

    // TODO: Implement cart functionality
    console.log("Add to cart:", {
      product: product.title,
      variant: selectedVariant.name,
      sku: selectedVariant.sku,
    });
    alert(`${product.title} - ${selectedVariant.name} lagt til i handlekurv!`);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-12 min-h-screen">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            {selectedImage && (
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={selectedImage.asset.url}
                  alt={selectedImage.alt || product.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {productImages && productImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {productImages.map((image, index) => (
                  <button
                    key={image.asset._id}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition ${
                      index === selectedImageIndex
                        ? "border-primary"
                        : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={image.asset.url}
                      alt={image.alt || `${product.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
              {product.category && (
                <p className="text-sm text-gray-500 uppercase tracking-wide">
                  {product.category}
                </p>
              )}
            </div>

            {product.description && (
              <p className="text-gray-700 text-lg">{product.description}</p>
            )}

            {/* Difficulty and Details */}
            {(product.difficulty || product.colors || product.gridSize) && (
              <div className="flex flex-wrap gap-4 py-4 border-y border-purple content-between">
                {product.difficulty && (
                  <div>
                    <span className="text-sm text-gray-500">Vanskelighetsgrad:</span>
                    <p className="font-medium capitalize">{product.difficulty}</p>
                  </div>
                )}
                {product.colors && (
                  <div>
                    <span className="text-sm text-gray-500">Antall farger:</span>
                    <p className="font-medium">{product.colors}</p>
                  </div>
                )}
                {product.gridSize && (
                  <div>
                    <span className="text-sm text-gray-500">Størrelse:</span>
                    <p className="font-medium">{product.gridSize}</p>
                  </div>
                )}
              </div>
            )}

            {product.variants && product.variants.length > 0 && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Velg variant:
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.sku}
                      onClick={() => setSelectedVariant(variant)}
                      disabled={!variant.isActive || variant.stockQuantity <= 0}
                      className={`p-4 border-2 rounded-lg text-left transition ${
                        selectedVariant?.sku === variant.sku
                          ? "border-primary bg-primary/5"
                          : "border-purple hover:border-purple-700"
                      } ${
                        !variant.isActive || variant.stockQuantity <= 0
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{variant.name}</p>
                          {variant.stockQuantity <= 0 && (
                            <p className="text-sm text-red-600">Utsolgt</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatPrice(variant.price, product.currency)}</p>
                          {variant.compareAtPrice && variant.compareAtPrice > variant.price && (
                            <p className="text-sm text-gray-500 line-through">
                              {formatPrice(variant.compareAtPrice, product.currency)}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleAddToCart}
              disabled={!selectedVariant || selectedVariant.stockQuantity <= 0}
              className="w-full bg-primary text-white py-4 px-6 rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!selectedVariant
                ? "Velg en variant"
                : selectedVariant.stockQuantity <= 0
                ? "Utsolgt"
                : "Legg i handlekurv"}
            </button>

            {product.status === "coming_soon" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 font-medium">Kommer snart!</p>
              </div>
            )}

            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-4">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-purple text-white text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {product.longDescription && (
              <div className="pt-6 border-t border-purple">
                <h2 className="text-xl font-semibold mb-4">Om produktet</h2>
                <div className="prose prose-sm max-w-none text-gray-700">
                  <PortableText value={product.longDescription} />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

"use client";

import { client } from "@/lib/sanity";
import { notFound } from "next/navigation";
import { use, useEffect, useState } from "react";
import { productQuery } from "@/lib/queries";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { PortableText } from "@portabletext/react";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useCart } from "@/app/contexts/CartContext";
import { CheckIcon } from "@heroicons/react/24/outline";
import VippsCheckoutButton, { OrderLine } from "@/app/components/VippsCheckoutButton";



interface ProductVariant {
  sku: string;
  name: string;
  price: number;
  originalPrice?: number;
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

interface Category {
  _id: string;
  name: string;
  slug: { current: string };
  parent?: Category;
  description?: string;
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
  category?: Category;
  colors?: number;
  gridSize?: string;
  tags?: string[];
  currency: string;
  vatRate: number;
  price: number;
  originalPrice?: number;
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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    async function fetchProduct() {
      try {
        const data = await client.fetch(productQuery, { slug });
        console.log("Fetched product data:", data);
        console.log("Product images:", data?.images);
        setProduct(data);
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
        <LoadingSpinner loadingMessage="Laster produkt..."></LoadingSpinner>
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
    if (!product) return;

    const primaryImage = productImages.find((img) => img.isPrimary) || productImages[0];

    addItem({
      productId: product._id,
      title: product.title,
      price: product.price,
      currency: product.currency || "NOK",
      imageUrl: primaryImage?.asset.url,
      slug: product.slug.current,
    });

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const orderLines: OrderLine[] = [{
    product_id: product._id,
    name: product.title,
    unit_price: Math.round(product.price * 100), // Konverter til øre
    quantity: 1,
  }];

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
                  {product.category.name}
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

            {/* Price */}
            <div className="py-4 border-y border-purple">
              <div className="flex items-baseline gap-3">
                <p className="text-3xl font-bold text-primary">
                  {formatPrice(product.price, product.currency)}
                </p>
                {product.originalPrice && product.originalPrice > product.price && (
                  <p className="text-xl text-gray-500 line-through">
                    {formatPrice(product.originalPrice, product.currency)}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.status === "out_of_stock" || addedToCart}
              className={`w-full py-4 px-6 rounded-lg font-semibold transition disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                addedToCart
                  ? "bg-success text-white"
                  : "bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
              }`}
            >
              {addedToCart ? (
                <>
                  <CheckIcon className="w-5 h-5" />
                  Lagt til i handlekurv
                </>
              ) : product.status === "out_of_stock" ? (
                "Utsolgt"
              ) : (
                "Legg i handlekurv"
              )}
            </button>
            <VippsCheckoutButton 
              disabled={product.status === "out_of_stock" || addedToCart}
              orderLines={orderLines} 
              currency={product.currency} 
            />

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

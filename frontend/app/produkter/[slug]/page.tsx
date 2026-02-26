"use client";

import { client } from "@/lib/sanity";
import { notFound } from "next/navigation";
import { use, useEffect, useState } from "react";
import { productQuery, strukturprodukterByParentTypeQuery } from "@/lib/queries";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { PortableText } from "@portabletext/react";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useCart } from "@/app/contexts/CartContext";
import { CheckIcon, MinusIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import VippsCheckoutButton, { OrderLine } from "@/app/components/VippsCheckoutButton";
import CollapsableCard from "@/app/components/CollapsableCard";
import { useUIString, useUIStringWithVars } from "@/app/hooks/useSanityData";
import ProductCard from "@/app/components/ProductCard";
import { formatPrice } from "@/app/utils/priceFormatter";

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
  totalBeads: number;
  tags?: string[];
  currency: string;
  vatRate: number;
  price: number;
  originalPrice?: number;
  requiredBoards?: number;
  images?: ProductImage[];
  image?: ProductImage;
  variants?: ProductVariant[];
  recommendedAddOns?: Product[];
  requiresParent?: boolean;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
}

interface CustomPattern {
  size: string;
  boardsWidth: number;
  boardsHeight: number;
  patternBase64: string;
  mockupBase64: string | null;
  colorsUsed: any[];
  patternData: any;
  beadCount: number;
}

export default function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ custom?: string }>;
}) {
  const { slug } = use(params);
  const { custom } = use(searchParams);
  const isCustomPattern = custom === "true";

  const [product, setProduct] = useState<Product | null>(null);
  const [strukturprodukter, setStrukturprodukter] = useState<Product[]>([]);
  const [customPattern, setCustomPattern] = useState<CustomPattern | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [addonQuantities, setAddonQuantities] = useState<Record<string, number>>({});
  const { addItem } = useCart();

  const bytteOgReturHeader = useUIString("bytte_og_retur_header");
  const bytteOgReturText = useUIString("bytte_og_retur_tekst");
  const leveringHeader = useUIString("levering_header");
  const leveringText = useUIString("levering_tekst");
  const innholdHeader = useUIString("innhold_header");
  const innholdText = useUIString("innhold_tekst");
  const dimensjonText = useUIStringWithVars("dimensjon_tekst", {
    dimensjon: product?.gridSize || "",
  });
  const antallPerlerText = useUIStringWithVars("antall_perler", {
    antall_perler: product?.totalBeads || "",
  });
  const antallFargerText = useUIStringWithVars("antall_farger", {
    antall_farger: product?.colors || "",
  });
  const customPatternText = useUIStringWithVars("ditt_eget_motiv_text", {
    boardsWidth: customPattern?.boardsWidth || "",
    boardsHeight: customPattern?.boardsHeight || "",
    boardsWidthCm: customPattern?.boardsWidth ? customPattern?.boardsWidth * 15 : "",
    boardsHeightCm: customPattern?.boardsHeight ? customPattern?.boardsHeight * 15 : "",
  });

  useEffect(() => {
    async function fetchProduct() {
      try {
        const data = await client.fetch(productQuery, { slug });
        setProduct(data);

        // Load custom pattern from localStorage if custom=true
        if (isCustomPattern) {
          try {
            const storedPattern = localStorage.getItem("custom_pattern");
            if (storedPattern) {
              const pattern = JSON.parse(storedPattern);
              setCustomPattern(pattern);

              // Set required boards based on pattern dimensions
              const requiredBoards = pattern.boardsWidth * pattern.boardsHeight;
              data.requiredBoards = requiredBoards;
            }
          } catch (e) {
            console.error("Failed to load custom pattern:", e);
          }
        }

        // Fetch all strukturprodukter that match this product's type
        if (data?.productType) {
          const strukturQuery = strukturprodukterByParentTypeQuery(data.productType);
          const strukturData = await client.fetch(strukturQuery);
          setStrukturprodukter(strukturData || []);

          // Initialize addon quantities with requiredBoards
          if (strukturData && strukturData.length > 0 && data?.requiredBoards) {
            const initialQuantities: Record<string, number> = {};
            strukturData.forEach((addon: Product) => {
              initialQuantities[addon._id] = data.requiredBoards || 1;
            });
            setAddonQuantities(initialQuantities);
          }
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [slug, isCustomPattern]);

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

  // Use custom pattern images if available, otherwise use Sanity product images
  const customImages = customPattern
    ? [
        {
          url: customPattern.patternBase64,
          alt: "Ditt perlemønster",
          isPattern: true,
        },
        ...(customPattern.mockupBase64
          ? [
              {
                url: customPattern.mockupBase64,
                alt: "Interiørbilde",
                isPattern: false,
              },
            ]
          : []),
      ]
    : [];

  const productImages = customImages.length > 0
    ? customImages
    : product.images?.length
    ? product.images.map(img => ({ url: img.asset.url, alt: img.alt || product.title, isPattern: false }))
    : product.image
    ? [{ url: product.image.asset.url, alt: product.image.alt || product.title, isPattern: false }]
    : [];

  const selectedImage = productImages[selectedImageIndex];

  const handleAddToCart = () => {
    if (!product) return;

    const primaryImage = productImages[0];

    // Add parent product with children
    const children: any[] = [];

    // Add strukturprodukter as children if quantity > 0
    strukturprodukter.forEach((addon) => {
      const quantity = addonQuantities[addon._id] || 0;
      if (quantity > 0) {
        const addonPrimaryImage = addon.images?.find((img) => img.isPrimary) || addon.images?.[0];
        children.push({
          productId: addon._id,
          title: addon.title,
          price: addon.price,
          currency: addon.currency || "NOK",
          imageUrl: addonPrimaryImage?.asset.url,
          slug: addon.slug.current,
          productType: addon.productType,
          requiresParent: addon.requiresParent,
          quantity,
        });
      }
    });

    addItem({
      productId: product._id,
      title: product.title,
      price: product.price,
      currency: product.currency || "NOK",
      imageUrl: primaryImage?.url,
      slug: product.slug.current,
      productType: product.productType,
      requiredBoards: product.requiredBoards,
      children: children.length > 0 ? children : undefined,
      customPattern: isCustomPattern && customPattern ? customPattern : undefined,
    });

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const updateAddonQuantity = (addonId: string, delta: number) => {
    setAddonQuantities(prev => {
      const current = prev[addonId] || 0;
      const newQuantity = Math.max(0, current + delta);
      return { ...prev, [addonId]: newQuantity };
    });
  };

  const setAddonQuantityZero = (addonId: string) => {
    setAddonQuantities(() => {
      return { [addonId]: 0 }
    })
  }

  // Calculate total price including selected addons
  const calculateTotalPrice = () => {
    let total = product?.price || 0;

    strukturprodukter.forEach((addon) => {
      const quantity = addonQuantities[addon._id] || 0;
      total += addon.price * quantity;
    });

    return total;
  };

  const addAddonQuantityDisabled = (addonId: string) => {
    return product.requiredBoards ? (addonQuantities[addonId] || 0) >= product.requiredBoards : false;
  }

  const orderLines: OrderLine[] = [{
    product_id: product._id,
    name: product.title,
    unit_price: Math.round(product.price * 100),
    quantity: 1,
  }];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-12 min-h-screen">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {selectedImage && (
              <div className="min-h-100 md:min-h-150 lg:min-h-175 px-6 py-10 bg-primary-light-pink content-center relative overflow-hidden bg-gray-100">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.alt || product.title}
                  className={`w-full h-full ${selectedImage.isPattern ? "object-contain" : "object-cover"}`}
                />
              </div>
            )}

            {productImages && productImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition ${
                      index === selectedImageIndex
                        ? "border-primary"
                        : "border-transparent hover:border-300"
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={image.alt || `${product.title} ${index + 1}`}
                      className={`w-full h-full ${image.isPattern ? "object-contain" : "object-cover"}`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-5xl text-dark-purple font-bold mb-2">{product.title}</h1>
            </div>

            {product.description && (
              <p className="text-gray-700 text-lg">{product.description}</p>
            )}

                          
            {isCustomPattern && customPattern && (
              <p>
                {customPatternText}
              </p>
            )}

            {product.status === "coming_soon" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 font-medium">Kommer snart!</p>
              </div>
            )}

            {strukturprodukter && strukturprodukter.length > 0 && (
              <div className="">
                <div className="space-y-4">
                  {strukturprodukter.map((addon) => (
                    <div key={addon._id} className="">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{addon.title}
                            <span className="ml-1">
                               - {formatPrice(addon.price, addon.currency)} per stykk
                            </span>
                          </h3>
                          {product.requiredBoards && (
                            <p>
                              {product.requiredBoards
                                ? `Til dette mønsteret trengs ${product.requiredBoards} brett`
                                : "Perlebrett som passer til dette mønsteret"}
                            </p>
                          )}
                          {addon.description && (
                            <p className="text-sm text-gray-600 mt-1">{addon.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center">
                        <div className="flex items-center gap-3 border border-dark-purple rounded-lg">
                          <button
                            onClick={() => updateAddonQuantity(addon._id, -1)}
                            className="w-10 h-10 flex items-center justify-center cursor-pointer transition-colors"
                            aria-label="Reduser antall"
                          >
                            <MinusIcon className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium">
                            {addonQuantities[addon._id] || 0}
                          </span>
                          <button
                            onClick={() => updateAddonQuantity(addon._id, 1)}
                            disabled={addAddonQuantityDisabled(addon._id)}
                            className="w-10 h-10 flex items-center justify-center cursor-pointer transition-colors"
                            aria-label="Øk antall"
                          >
                            <PlusIcon className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => setAddonQuantityZero(addon._id)}
                          disabled={addonQuantities[addon._id] === 0}
                          className="w-10 h-10 flex items-center justify-center text-dark-purple cursor-pointer transition-colors"
                          aria-label="Sett antall til 0"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                        {/* {addAddonQuantityDisabled(addon._id) && (
                          <p className="text-red-900 text-sm flex items-center">
                            <InformationCircleIcon className="w-4 h-4 mr-1"/>
                            Maks antall brett for dette mønsteret
                          </p>
                        )} */}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleAddToCart}
              disabled={product.status !== "in_stock" || addedToCart}
              className={`w-full py-4 px-6 rounded-lg font-semibold transition cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2
                border
                ${
                addedToCart
                  ? "bg-success text-white"
                  : "hover:shadow-lg disabled:opacity-50"
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
                <>
                  Legg i handlekurv - {formatPrice(calculateTotalPrice(), product.currency)}
                </>
              )}
            </button>

            <VippsCheckoutButton
              disabled={product.status !== "in_stock" || addedToCart}
              orderLines={orderLines}
              currency={product.currency}
            />

            <CollapsableCard header={innholdHeader} defaultExpanded={false} className="border-t border-purple">
              {product.longDescription && (
                <div className="pt-6">
                  <div className="prose prose-sm max-w-none text-gray-700">
                    <PortableText value={product.longDescription} />
                  </div>
                </div>
              )}
              <p>
                {innholdText}
              </p>
              {product.gridSize && (
                <p className="pt-2">
                  {dimensjonText}
                </p>
              )}
              {product.totalBeads && (
                <p className="pt-2">
                  {antallPerlerText}
                </p>
              )}
              {product.colors && (
                <p className="pt-2">
                  {antallFargerText}
                </p>
              )}

            </CollapsableCard>
            <CollapsableCard header={leveringHeader} defaultExpanded={false} className="border-y border-purple">
              {leveringText}
            </CollapsableCard>
            <CollapsableCard header={bytteOgReturHeader} defaultExpanded={false} className="border-b border-purple">
              {bytteOgReturText}
            </CollapsableCard>
          </div>
        </div>

        {/* Recommended Add-ons Section */}
        {product.recommendedAddOns && product.recommendedAddOns.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-4 text-dark-purple">
              Har du sjekket ut disse?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {product.recommendedAddOns.map((addon) => (
                <ProductCard key={addon._id} product={addon} />
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

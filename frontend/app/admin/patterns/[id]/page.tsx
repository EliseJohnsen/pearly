"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import BeadPatternDisplay from "@/app/components/BeadPatternDisplay";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Pattern } from "@/app/models/patternModels";
import { client } from "@/lib/sanity";
import { productsByPatternIdQuery } from "@/lib/queries";
import CollapsableCard from "@/app/components/CollapsableCard";
import { Product } from "@/app/models/orderModels";

export default function PatternDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patternId = parseInt(params?.id as string, 10);

  const [products, setProducts] = useState<Product[] | []>([]);
  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkedColors, setCheckedColors] = useState<Set<string>>(new Set());

  const fetchPattern = async () => {
    if (!patternId || isNaN(patternId)) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/patterns/${patternId}`);

      if (!response.ok) {
        throw new Error("Kunne ikke hente mønster");
      }

      const data = await response.json();
      setPattern(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "En feil oppstod");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPattern();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patternId]);

  useEffect(() => {
    async function fetchProduct() {
      if (!patternId || isNaN(patternId)) return;
      try {
        const data = await client.fetch(productsByPatternIdQuery, { patternId: patternId.toString() });
        setProducts(data);
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [patternId]);

  const getBeadWeight = (beadCount: number) => {
    const adjustedCount = beadCount < 100
      ? beadCount + 5
      : beadCount + 20;
    const value = (adjustedCount / 1000 * 60)
    return Math.round(value * 10) / 10;
  }

  const toggleColorCheck = (colorHex: string) => {
    setCheckedColors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(colorHex)) {
        newSet.delete(colorHex);
      } else {
        newSet.add(colorHex);
      }
      return newSet;
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner loadingMessage="Laster inn mønsteret..."/>
      </div>
    );
  }

  if (!loading && (error || !pattern)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-800 font-semibold mb-2">Feil</p>
          <p className="text-red-600">{error || "Mønster ikke funnet"}</p>
          <button
            onClick={() => router.push("/admin/patterns")}
            className="flex items-center gap-2 px-4 py-2 my-4 bg-purple text-white hover:bg-primary-dark-pink rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeftIcon className="w-5 h-5" />
              <span>Tilbake til oversikt</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push("/admin/patterns")}
            className="flex items-center gap-2 px-4 py-2 my-4 bg-purple text-white hover:bg-primary-dark-pink rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeftIcon className="w-5 h-5" />
              <span>Tilbake til oversikt</span>
          </button>
        </div>

        <CollapsableCard header="Produkter knyttet til dette mønsteret">
          <div className="grid grid-cols-3 gap-2">
            {products?.map((product: any) => (
              <a
                  key={product._id}
                  href={`/produkter/${product.slug.current}`}
                  className="rounded-lg p-4 hover:shadow-lg transition block w-75"
              >
                  {product.images && product.images.length > 0 && (() => {
                    const primaryImage = product.images.find((img: any) => img.isPrimary) || product.images[0]
                    return (
                      <img
                        src={primaryImage.asset.url}
                        alt={primaryImage.alt || product.title}
                        className="aspect-3/4 object-cover rounded mb-4"
                      />
                    )
                  })()}
                  <h3 className="font-semibold text-lg mb-2">
                  {product.title}
                  </h3>
                  {product.description && (
                  <p className="text-gray-600 text-sm">
                      {product.description}
                  </p>
                  )}
              </a>
            ))}
          </div>
        </CollapsableCard>


        <CollapsableCard header="Mønster">

          <BeadPatternDisplay
            pattern={pattern!}
            showPDFButton={true}
            beadSize={10}
            onPatternUpdate={fetchPattern}
          />
        </CollapsableCard>

        <CollapsableCard header="Farger du trenger">
          <div>
            {pattern!.colors_used
              .slice()
              .sort((a, b) => {
                const codeA = a.code || '';
                const codeB = b.code || '';
                const numA = parseInt(codeA) || 0;
                const numB = parseInt(codeB) || 0;
                return numA - numB;
              })
              .map((color) => (
              <div
                key={color.hex}
                className={`flex items-center gap-4 p-3 max-w-2xl rounded-lg hover:bg-primary-light transition-colors ${
                  checkedColors.has(color.hex) ? 'bg-gray-300' : 'bg-background'
                }`}
              >
                <div
                  onClick={() => toggleColorCheck(color.hex)}
                  className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center cursor-pointer relative"
                  style={{ backgroundColor: color.hex }}
                >
                  {checkedColors.has(color.hex) && (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="grid grid-cols-[60px_2fr_200px_120px] gap-4 flex-1 items-center">
                  <p className="text-gray-900 truncate">
                    {color.code}
                  </p>
                  <p className="text-bold text-gray-900">
                    {getBeadWeight(color.count)} gram
                  </p>
                  <p className="text-medium text-gray-500">
                    {color.name}
                  </p>
                  <p className="text-medium text-gray-600">
                    {color.count} perler
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setCheckedColors(new Set())}
            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Nullstill
          </button>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Oppsummering
            </h4>
            <dl className="space-y-2">
              <div className="flex text-sm">
                <dt className="text-gray-600 mr-3">Totalt antall farger:</dt>
                <dd className="font-semibold text-gray-900">
                  {pattern!.colors_used.length}
                </dd>
              </div>
              <div className="flex text-sm">
                <dt className="text-gray-600 mr-3">Totalt antall perler:</dt>
                <dd className="font-semibold text-gray-900">
                  {pattern!.colors_used.reduce((sum, color) => sum + color.count, 0)}
                </dd>
              </div>
              {pattern!.boards_width && pattern!.boards_height && (
                <div className="flex text-sm">
                  <dt className="text-gray-600 mr-3">Antall brett:</dt>
                  <dd className="font-semibold text-gray-900">
                    {pattern!.boards_width * pattern!.boards_height}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </CollapsableCard>
      </div>
    </div>
  );
}

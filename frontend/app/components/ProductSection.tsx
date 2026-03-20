'use client'

import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import ProductCard from './ProductCard';

interface ProductSectionProps {
  data?: any
}

const SIZE_OPTIONS = [
  { value: 'alle', label: 'Alle størrelser' },
  { value: 'sma',  label: 'Små, 30 x 30 cm' },
  { value: 'medium', label: 'Medium, 30 x 40 cm' },
  { value: 'store', label: 'Store, 40 x 60 cm' },
  { value: 'ekstra-store', label: 'Ekstra store, 60 x 90 cm' },
] as const;

function matchesSize(boards: number | undefined, size: string): boolean {
  if (size === 'alle' || boards == null) return true;
  if (size === 'sma') return boards < 6;
  if (size === 'medium') return boards >= 6 && boards <= 8;
  if (size === 'store') return boards >= 9 && boards <= 12;
  if (size === 'ekstra-store') return boards >= 13;
  return true;
}

export default function ProductSection({ data }: ProductSectionProps = {}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const activeCategory = searchParams.get('kategori') || 'alle';
  const activeSize = searchParams.get('storrelse') || 'alle';

  // Derive unique categories from products (preserving first-seen order)
  const categories: any[] = Array.from(
    new Map(
      (data.products ?? [])
        .filter((p: any) => p.category && !p.category.parent)
        .map((p: any) => [p.category._id, p.category])
    ).values()
  ).sort((a: any, b: any) => a.name.localeCompare(b.name, 'nb'));

  const filteredProducts = (data.products ?? []).filter((p: any) => {
    const categoryMatch =
      activeCategory === 'alle' ||
      p.category?.slug?.current === activeCategory ||
      p.category?.parent?.slug?.current === activeCategory;
    const sizeMatch = matchesSize(p.requiredBoards, activeSize);
    return categoryMatch && sizeMatch;
  });

  const buildHref = (params: Record<string, string>) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([k, v]) => {
      if (v === 'alle') next.delete(k);
      else next.set(k, v);
    });
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const handleSizeChange = (value: string) => {
    router.push(buildHref({ storrelse: value }), { scroll: false } as any);
    setDropdownOpen(false);
  };

  const activeSizeLabel = SIZE_OPTIONS.find((o) => o.value === activeSize)?.label ?? 'Alle størrelser';

  return (
    <section className="py-12">
      <div className="max-w-6xl mx-auto px-4">
        {data.sectionTitle && (
          <h2 className="font-display text-4xl md:text-5xl leading-none text-left text-dark-purple mb-4">
            {data.sectionTitle}
          </h2>
        )}
        {data.sectionSubtitle && (
          <p className="text-left text-base text-gray-700 mb-8 max-w-xl">
            {data.sectionSubtitle}
          </p>
        )}

        {/* Filter row */}
        {categories.length > 0 && (
          <div className="flex flex-wrap justify-between items-center gap-3 mb-8 pb-1">
            {/* Category pills – scrollable */}
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide min-w-0">
              <Link
                href={buildHref({ kategori: 'alle' })}
                scroll={false}
                className={`flex-shrink-0 px-4 py-2 md:px-5 md:py-2 text-sm md:text-base rounded-lg border font-medium transition-colors ${
                  activeCategory === 'alle'
                    ? 'border-dark-purple text-dark-purple'
                    : 'border-primary-pink text-dark-purple hover:border-purple'
                }`}
              >
                Alle
              </Link>

              <div className="flex-shrink-0 w-px h-6 bg-primary-pink" />

              {categories.map((cat: any) => {
                const catHasResults = (data.products ?? []).some((p: any) => {
                  const categoryMatch =
                    p.category?.slug?.current === cat.slug.current ||
                    p.category?.parent?.slug?.current === cat.slug.current;
                  return categoryMatch && matchesSize(p.requiredBoards, activeSize);
                });
                const isActive = activeCategory === cat.slug.current;
                if (!catHasResults) {
                  return (
                    <span
                      key={cat._id}
                      className="flex-shrink-0 px-4 py-2 md:px-5 md:py-2 text-sm md:text-base rounded-lg border font-medium border-primary-pink text-disabled-muted cursor-default"
                    >
                      {cat.name}
                    </span>
                  );
                }
                return (
                  <Link
                    key={cat._id}
                    href={buildHref({ kategori: cat.slug.current })}
                    scroll={false}
                    className={`flex-shrink-0 px-4 py-2 md:px-5 md:py-2 text-sm md:text-base rounded-lg border font-medium transition-colors ${
                      isActive
                        ? 'border-dark-purple text-dark-purple'
                        : 'border-primary-pink text-dark-purple hover:border-purple'
                    }`}
                  >
                    {cat.name}
                  </Link>
                );
              })}
            </div>

            {/* Size dropdown – right-aligned */}
            <div className="flex-shrink-0 relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className={`flex items-center gap-2 px-4 py-2 md:px-5 md:py-2 text-sm md:text-base rounded-lg border font-medium transition-colors ${
                  activeSize !== 'alle'
                    ? 'border-dark-purple text-dark-purple'
                    : 'border-primary-pink text-dark-purple hover:border-purple'
                }`}
              >
                {activeSizeLabel}
                <svg
                  className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dropdownOpen && (
                <ul className="absolute left-0 md:left-auto md:right-0 mt-1 w-52 bg-white border border-primary-pink rounded-lg shadow-md z-10 overflow-hidden">
                  {SIZE_OPTIONS.map((opt) => {
                    const hasResults = opt.value === 'alle' || (data.products ?? []).some((p: any) => {
                      const categoryMatch =
                        activeCategory === 'alle' ||
                        p.category?.slug?.current === activeCategory ||
                        p.category?.parent?.slug?.current === activeCategory;
                      return categoryMatch && matchesSize(p.requiredBoards, opt.value);
                    });
                    const isActive = opt.value === activeSize;
                    return (
                      <li key={opt.value}>
                        <button
                          onClick={() => hasResults && handleSizeChange(opt.value)}
                          disabled={!hasResults}
                          className={`w-full text-left px-5 py-2 font-medium transition-colors ${
                            isActive
                              ? 'text-dark-purple bg-primary-pink'
                              : hasResults
                              ? 'text-dark-purple hover:bg-primary-pink'
                              : 'text-disabled-muted cursor-default'
                          }`}
                        >
                          {opt.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Product grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-8">
          {filteredProducts?.map((product: any) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}

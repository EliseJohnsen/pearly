'use client'

import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ProductCard from './ProductCard';

interface ProductSectionProps {
  data?: any
}

export default function ProductSection({ data }: ProductSectionProps = {}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get('kategori') || 'alle';

  // Derive unique categories from products (preserving first-seen order)
  const categories: any[] = Array.from(
    new Map(
      (data.products ?? [])
        .filter((p: any) => p.category && !p.category.parent)
        .map((p: any) => [p.category._id, p.category])
    ).values()
  ).sort((a: any, b: any) => a.name.localeCompare(b.name, 'nb'));

  const filteredProducts = activeCategory === 'alle'
    ? data.products
    : data.products?.filter((p: any) =>
        p.category?.slug?.current === activeCategory ||
        p.category?.parent?.slug?.current === activeCategory
      );

  const categoryHref = (slug: string) =>
    slug === 'alle' ? pathname : `${pathname}?kategori=${slug}`;

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

        {/* Filter pills */}
        {categories.length > 0 && (
          <div className="flex items-center gap-3 mb-8 overflow-x-auto scrollbar-hide pb-1">
            {/* Alle */}
            <Link
              href={categoryHref('alle')}
              scroll={false}
              className={`flex-shrink-0 px-5 py-2 rounded-lg border font-medium transition-colors ${
                activeCategory === 'alle'
                  ? 'border-dark-purple text-dark-purple'
                  : 'border-primary-pink text-dark-purple hover:border-purple'
              }`}
            >
              Alle
            </Link>

            {/* Vertical divider */}
            <div className="flex-shrink-0 w-px h-6 bg-primary-pink" />

            {/* Category pills */}
            {categories.map((cat: any) => (
              <Link
                key={cat._id}
                href={categoryHref(cat.slug.current)}
                scroll={false}
                className={`flex-shrink-0 px-5 py-2 rounded-lg border font-medium transition-colors ${
                  activeCategory === cat.slug.current
                    ? 'border-dark-purple text-dark-purple'
                    : 'border-primary-pink text-dark-purple hover:border-purple'
                }`}
              >
                {cat.name}
              </Link>
            ))}
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

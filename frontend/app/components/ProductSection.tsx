'use client'

import ProductCard from './ProductCard';

interface ProductSectionProps {
  data?: any
}

export default function ProductSection({ data }: ProductSectionProps = {}) {
  return (
    <section className="py-12">
        <div className="max-w-6xl mx-auto px-4">
        {data.sectionTitle && (
            <h2 className="text-4xl md:text-5xl font-semibold text-left text-dark-purple mb-4">
            {data.sectionTitle}
            </h2>
        )}
        {data.sectionSubtitle && (
            <p className="text-left text-base text-gray-700 mb-8 max-w-xl">
            {data.sectionSubtitle}
            </p>
        )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-8">
                {data.products?.map((product: any) => (
                  <ProductCard key={product._id} product={product} />
                ))}
            </div>
        </div>
    </section>
  )
}

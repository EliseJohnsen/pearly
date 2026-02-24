'use client'

import ProductCard from './ProductCard';

interface ProductSectionProps {
  data?: any
}

export default function ProductSection({ data }: ProductSectionProps = {}) {
  return (
    <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
        {data.sectionTitle && (
            <h2 className="text-3xl font-bold text-center mb-4">
            {data.sectionTitle}
            </h2>
        )}
        {data.sectionSubtitle && (
            <p className="text-center text-gray-600 mb-8">
            {data.sectionSubtitle}
            </p>
        )}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {data.products?.map((product: any) => (
                  <ProductCard key={product._id} product={product} />
                ))}
            </div>
        </div>
    </section>
  )
}

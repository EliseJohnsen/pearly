'use client'

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {data.products?.map((product: any) => (
                <a
                    key={product._id}
                    href={`/produkter/${product.slug.current}`}
                    className="border rounded-lg p-4 hover:shadow-lg transition block"
                >
                    {product.image?.asset?.url && (
                    <img
                        src={product.image.asset.url}
                        alt={product.image.alt || product.title}
                        className="w-full max-h-72 object-cover rounded mb-4"
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
                ))}
            </div>
        </div>
    </section>
  )
}

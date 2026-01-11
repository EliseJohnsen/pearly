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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {data.products?.map((product: any) => (
                <a
                    key={product._id}
                    href={`/produkter/${product.slug.current}`}
                    className="rounded-lg p-4 hover:shadow-lg transition block"
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
        </div>
    </section>
  )
}

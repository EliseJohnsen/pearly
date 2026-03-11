import ProductCarousel from '../components/ProductCarousel'

const mockProducts = [
  {
    _id: '1',
    title: 'Produktnavn 1',
    slug: { current: 'produkt-1' },
    price: 39900,
    images: [{ asset: { url: 'https://placehold.co/300x400/EECED5/6B4E71?text=Produkt+1' }, alt: 'Produkt 1', isPrimary: true }],
  },
  {
    _id: '2',
    title: 'Produktnavn 2',
    slug: { current: 'produkt-2' },
    price: 49900,
    images: [{ asset: { url: 'https://placehold.co/300x400/EECED5/6B4E71?text=Produkt+2' }, alt: 'Produkt 2', isPrimary: true }],
  },
  {
    _id: '3',
    title: 'Produktnavn 3',
    slug: { current: 'produkt-3' },
    price: 59900,
    images: [{ asset: { url: 'https://placehold.co/300x400/EECED5/6B4E71?text=Produkt+3' }, alt: 'Produkt 3', isPrimary: true }],
  },
  {
    _id: '4',
    title: 'Produktnavn 4',
    slug: { current: 'produkt-4' },
    price: 29900,
    images: [{ asset: { url: 'https://placehold.co/300x400/EECED5/6B4E71?text=Produkt+4' }, alt: 'Produkt 4', isPrimary: true }],
  },
  {
    _id: '5',
    title: 'Produktnavn 5',
    slug: { current: 'produkt-5' },
    price: 34900,
    images: [{ asset: { url: 'https://placehold.co/300x400/EECED5/6B4E71?text=Produkt+5' }, alt: 'Produkt 5', isPrimary: true }],
  },
]

export default function TestKarusell() {
  return (
    <main className="min-h-screen bg-background py-16">
      <ProductCarousel
        heading="Har du sjekket ut disse?"
        products={mockProducts}
        viewMoreLink={{ text: 'Vis flere', href: '/perlepakker' }}
      />
    </main>
  )
}

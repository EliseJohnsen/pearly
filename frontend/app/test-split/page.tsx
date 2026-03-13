'use client'

import SplitSection from '../components/SplitSection'
import Header from '../components/Header'

const testData = {
  heading: 'Fra bilde til perlekart',
  body: 'Last opp et bilde du er glad i – et portrett, et landskap, eller noe helt annet – og vi gjør det om til et unikt perlekart. Du velger størrelse og fargepaller, vi gjør resten.',
  button: { text: 'Prøv det selv', href: '/last-opp-bilde' },
  image: {
    asset: { url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80&fit=crop' },
    alt: 'Testbilde',
  },
  imagePosition: 'left' as const,
  backgroundColor: 'var(--background)',
  isActive: true,
}

export default function TestSplitPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />
      <div className="pt-8">
        <p className="text-center text-sm text-app-muted mb-8">— Bilde til venstre —</p>
        <SplitSection data={testData} />

        <p className="text-center text-sm text-app-muted mt-12 mb-8">— Bilde til høyre —</p>
        <SplitSection data={{ ...testData, imagePosition: 'right' }} />

        <p className="text-center text-sm text-app-muted mt-12 mb-8">— Uten knapp —</p>
        <SplitSection data={{ ...testData, button: undefined, imagePosition: 'left' }} />
      </div>
    </div>
  )
}

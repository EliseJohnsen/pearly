'use client'

import KampanjeBanner from '../components/KampanjeBanner'

const testBody = [
  {
    _type: 'block',
    _key: 'test1',
    style: 'normal',
    children: [{ _type: 'span', _key: 'span1', text: 'Dette er et kampanjebanner med eksempeltekst. Her kan du se hvordan banneret ser ut med ulike bakgrunnsfarger.' }],
    markDefs: [],
  },
]

const colors = [
  { label: 'Mørk rosa', value: 'var(--primary-dark-pink)' },
  { label: 'Lavendel rosa', value: 'var(--lavender-pink)' },
  { label: 'Lilla', value: 'var(--purple)' },
  { label: 'Mørk lilla', value: 'var(--dark-purple)' },
  { label: 'Ekstra mørk lilla', value: 'var(--purple-extra-dark)' },
  { label: 'Neon grønn', value: 'var(--primary-neon-green)' },
  { label: 'Oransje/rød (primær)', value: 'var(--primary)' },
]

export default function TestBannerPage() {
  return (
    <div className="min-h-screen bg-background">
      <KampanjeBanner data={{ title: 'Lanseringspriser: 25% rabatt', isActive: true }} />
      <div className="py-12">
      <div className="max-w-4xl mx-auto px-4 mb-12">
        <h1 className="font-display text-4xl mb-2">Kampanjebanner – fargepreview</h1>
        <p className="text-app-secondary">Alle tilgjengelige bakgrunnsfarger fra designsystemet.</p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 px-4 py-2 bg-gray-100">
          Kun overskrift — <code className="font-mono">var(--primary-dark-pink)</code>
        </p>
        <KampanjeBanner
          data={{
            title: 'Lanseringspriser: 25% rabatt',
            backgroundColor: 'var(--primary-dark-pink)',
          }}
        />
      </div>

      {colors.map(({ label, value }) => (
        <div key={value}>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 px-4 py-2 bg-gray-100">
            {label} — <code className="font-mono">{value}</code>
          </p>
          <KampanjeBanner
            data={{
              title: 'Lanseringspriser: 25% rabatt',
              body: testBody,
              backgroundColor: value,
            }}
          />
        </div>
      ))}
      </div>
    </div>
  )
}

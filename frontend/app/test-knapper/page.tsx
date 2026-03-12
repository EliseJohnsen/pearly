'use client'

import { useState } from 'react'
import PearlyButton from '../components/PearlyButton'
import {
  CheckIcon,
  ShoppingCartIcon,
  ArrowDownTrayIcon,
  ArrowsRightLeftIcon,
  ShoppingBagIcon,
  XMarkIcon,
  PlusIcon,
  MinusIcon,
} from '@heroicons/react/24/outline'

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="mb-14">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1 border-b border-pink-100 pb-2">{title}</h2>
      {description && <p className="text-sm text-gray-400 mb-5">{description}</p>}
      <div className="flex flex-wrap gap-6 items-start mt-5">{children}</div>
    </div>
  )
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1">
      {children}
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  )
}

export default function TestKnapper() {
  const [addedToCart, setAddedToCart] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState<'realistic' | 'ai' | null>(null)
  const [selectedRatio, setSelectedRatio] = useState<'3:4' | '1:1' | '4:3'>('3:4')
  const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L' | null>(null)

  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold text-dark-purple mb-2">Knapper</h1>
      <p className="text-gray-500 mb-12">Oversikt over alle knapper og states brukt på nettsiden.</p>

      {/* ─── PearlyButton skins ─── */}
      <Section title="PearlyButton — primary" description="Brukes til hovedhandlingen på produktsider (legg i handlekurv).">
        <Labeled label="Normal"><PearlyButton skin="primary">Legg i handlekurv</PearlyButton></Labeled>
        <Labeled label="Disabled"><PearlyButton skin="primary" disabled>Utsolgt</PearlyButton></Labeled>
      </Section>

      <Section title="PearlyButton — success" description="Vises etter at varen er lagt i handlekurven.">
        <Labeled label="Normal">
          <PearlyButton skin="success"><CheckIcon className="w-5 h-5" />Lagt til i handlekurv</PearlyButton>
        </Labeled>
        <Labeled label="Disabled">
          <PearlyButton skin="success" disabled><CheckIcon className="w-5 h-5" />Lagt til i handlekurv</PearlyButton>
        </Labeled>
      </Section>

      <Section title="PearlyButton — secondary">
        <Labeled label="Normal"><PearlyButton skin="secondary">Sekundær handling</PearlyButton></Labeled>
        <Labeled label="Disabled"><PearlyButton skin="secondary" disabled>Sekundær handling</PearlyButton></Labeled>
      </Section>

      <Section title="PearlyButton — outline" description="Brukes til «Start på nytt» i velg-størrelse-flyten.">
        <Labeled label="Normal"><PearlyButton skin="outline">Start på nytt</PearlyButton></Labeled>
        <Labeled label="Disabled"><PearlyButton skin="outline" disabled>Start på nytt</PearlyButton></Labeled>
      </Section>

      <Section title="PearlyButton — ghost">
        <Labeled label="Normal"><PearlyButton skin="ghost">Ghost</PearlyButton></Labeled>
        <Labeled label="Disabled"><PearlyButton skin="ghost" disabled>Ghost</PearlyButton></Labeled>
      </Section>

      <Section title="PearlyButton — danger">
        <Labeled label="Normal"><PearlyButton skin="danger">Slett</PearlyButton></Labeled>
        <Labeled label="Disabled"><PearlyButton skin="danger" disabled>Slett</PearlyButton></Labeled>
      </Section>

      <Section title="PearlyButton — default">
        <Labeled label="Normal"><PearlyButton skin="default">Standard</PearlyButton></Labeled>
        <Labeled label="Disabled"><PearlyButton skin="default" disabled>Standard</PearlyButton></Labeled>
      </Section>

      {/* ─── Legg i handlekurv interaktiv ─── */}
      <Section title="Legg i handlekurv — interaktiv demo">
        <Labeled label={addedToCart ? 'Etter klikk' : 'Før klikk'}>
          <PearlyButton
            skin={addedToCart ? 'success' : 'primary'}
            disabled={addedToCart}
            onClick={() => setAddedToCart(true)}
            className="w-64 py-4 px-6"
          >
            {addedToCart ? (
              <><CheckIcon className="w-5 h-5" />Lagt til i handlekurv</>
            ) : (
              <><ShoppingCartIcon className="w-5 h-5" />Legg i handlekurv — 399 kr</>
            )}
          </PearlyButton>
        </Labeled>
        {addedToCart && (
          <button onClick={() => setAddedToCart(false)} className="text-xs text-gray-400 underline self-end mb-5">
            Tilbakestill
          </button>
        )}
      </Section>

      {/* ─── Velg stil ─── */}
      <Section title="Stilvalg-kort" description="Brukes i last-opp-bilde-flyten for å velge realistisk vs. AI-stil.">
        {(['realistic', 'ai'] as const).map((style) => (
          <Labeled key={style} label={style === 'realistic' ? 'Realistisk' : 'AI-stil'}>
            <button
              onClick={() => setSelectedStyle(style)}
              className={`w-56 text-left p-6 rounded-2xl border-2 transition-all ${
                selectedStyle === style
                  ? 'border-[#6B4E71] bg-[#F5F0F6]'
                  : 'border-[#C4B5C7] bg-white hover:border-[#6B4E71]'
              }`}
            >
              <p className="font-semibold text-dark-purple">{style === 'realistic' ? 'Realistisk stil' : 'AI-stil'}</p>
              <p className="text-sm text-gray-500 mt-1">Beskrivelse av stilen som velges her.</p>
            </button>
          </Labeled>
        ))}
      </Section>

      {/* ─── Bildbeskjæring ─── */}
      <Section title="Bildeformat-knapper (beskjæringsmodal)" description="Velger sideforhold i UploadImage-komponenten.">
        {(['3:4', '1:1', '4:3'] as const).map((ratio) => (
          <Labeled key={ratio} label={ratio === selectedRatio ? 'Valgt' : 'Ikke valgt'}>
            <button
              onClick={() => setSelectedRatio(ratio)}
              className={`py-3 px-6 rounded-xl border-2 font-medium transition-all ${
                selectedRatio === ratio
                  ? 'bg-dark-purple text-white border-dark-purple'
                  : 'bg-white border-purple text-dark-purple hover:border-dark-purple'
              }`}
            >
              {ratio}
            </button>
          </Labeled>
        ))}
      </Section>

      <Section title="Zoomknapper (beskjæringsmodal)" description="Runde +/− knapper i UploadImage-komponenten.">
        <Labeled label="Zoom inn">
          <button className="w-8 h-8 bg-white border-2 border-purple rounded-full flex items-center justify-center text-dark-purple font-bold hover:border-dark-purple transition-colors text-xl">
            <PlusIcon className="w-4 h-4" />
          </button>
        </Labeled>
        <Labeled label="Zoom ut">
          <button className="w-8 h-8 bg-white border-2 border-purple rounded-full flex items-center justify-center text-dark-purple font-bold hover:border-dark-purple transition-colors text-xl">
            <MinusIcon className="w-4 h-4" />
          </button>
        </Labeled>
      </Section>

      <Section title="Beskjæringsmodal — handlingsknapper">
        <Labeled label="Bruk beskjæring">
          <button className="py-3 px-6 bg-dark-purple text-white font-semibold rounded-full hover:bg-purple-extra-dark transition-colors">
            Bruk beskjæring
          </button>
        </Labeled>
        <Labeled label="Avbryt">
          <button className="py-3 px-6 bg-white border-2 border-purple text-dark-purple font-semibold rounded-full hover:border-dark-purple transition-colors">
            Avbryt
          </button>
        </Labeled>
      </Section>

      <Section title="Fjern bilde-knapp" description="Vises øverst i hjørnet på valgt bilde i UploadImage.">
        <Labeled label="Normal">
          <button className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
            <XMarkIcon className="w-5 h-5 text-gray-700" />
          </button>
        </Labeled>
      </Section>

      {/* ─── Størrelsesvalg ─── */}
      <Section title="Størrelsesknapper" description="Brukes i velg-størrelse-flyten.">
        {(['S', 'M', 'L'] as const).map((size) => (
          <Labeled key={size} label={size === 'M' ? 'Anbefalt' : size === selectedSize ? 'Valgt' : 'Normal'}>
            <button
              onClick={() => setSelectedSize(size)}
              className={`relative p-4 rounded-lg border-2 transition-all w-28 text-left ${
                selectedSize === size
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-300 hover:border-primary-dark-pink'
              }`}
            >
              {size === 'M' && (
                <span className="absolute -top-2 left-3 text-xs bg-primary text-white px-2 py-0.5 rounded-full">Anbefalt</span>
              )}
              <p className="font-semibold text-dark-purple">{size === 'S' ? 'Liten' : size === 'M' ? 'Medium' : 'Stor'}</p>
              <p className="text-xs text-gray-500 mt-0.5">29×29 pinner</p>
            </button>
          </Labeled>
        ))}
      </Section>

      {/* ─── Generer-knapp ─── */}
      <Section title="Generer perlemønster" description="Hovedknappen i opplastingsflyten.">
        <Labeled label="Normal">
          <button className="w-64 bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-6 rounded-lg transition-colors">
            Generer perlemønster
          </button>
        </Labeled>
        <Labeled label="Laster...">
          <button disabled className="w-64 bg-disabled cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors">
            Genererer...
          </button>
        </Labeled>
        <Labeled label="Disabled">
          <button disabled className="w-64 bg-disabled cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors opacity-50">
            Generer perlemønster
          </button>
        </Labeled>
      </Section>

      {/* ─── BeadPatternDisplay ─── */}
      <Section title="Mønstervisning — handlingsknapper" description="Knapper i BeadPatternDisplay-komponenten.">
        <Labeled label="Last ned PDF">
          <button className="flex items-center gap-2 px-4 py-2 bg-purple text-white enabled:hover:bg-dark-purple rounded-lg font-semibold transition-colors">
            <ArrowDownTrayIcon className="w-5 h-5" />Last ned PDF
          </button>
        </Labeled>
        <Labeled label="PDF laster...">
          <button disabled className="flex items-center gap-2 px-4 py-2 bg-purple text-white rounded-lg font-semibold opacity-50 cursor-not-allowed">
            <ArrowDownTrayIcon className="w-5 h-5" />Genererer PDF...
          </button>
        </Labeled>
        <Labeled label="Bytt farger">
          <button className="flex items-center gap-2 px-4 py-2 bg-dark-purple text-white enabled:hover:bg-purple-extra-dark rounded-lg font-semibold transition-colors">
            <ArrowsRightLeftIcon className="w-5 h-5" />Bytt farger
          </button>
        </Labeled>
        <Labeled label="Opprett produkt">
          <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold transition-colors">
            <ShoppingBagIcon className="w-5 h-5" />Opprett produkt
          </button>
        </Labeled>
      </Section>

      <Section title="Mønstervisning — ulagrede endringer" description="Vises når brukeren har gjort endringer i mønsteret.">
        <Labeled label="Forkast">
          <button className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-semibold transition-colors">
            Forkast
          </button>
        </Labeled>
        <Labeled label="Lagre">
          <button className="px-4 py-2 bg-success text-white rounded-lg font-semibold transition-colors enabled:hover:bg-green-dark">
            Lagre endringer
          </button>
        </Labeled>
        <Labeled label="Lagrer...">
          <button disabled className="px-4 py-2 bg-success text-white rounded-lg font-semibold opacity-50 cursor-not-allowed">
            Lagrer...
          </button>
        </Labeled>
      </Section>

      {/* ─── Vipps ─── */}
      <Section title="Vipps-knapp">
        <Labeled label="Normal">
          <button className="w-56 bg-primary text-white py-4 px-6 rounded-lg font-semibold cursor-pointer hover:bg-primary-hover transition-colors">
            Kjøp nå med Vipps
          </button>
        </Labeled>
        <Labeled label="Laster...">
          <button disabled className="w-56 bg-primary text-white py-4 px-6 rounded-lg font-semibold opacity-50 cursor-not-allowed">
            Starter Vipps...
          </button>
        </Labeled>
        <Labeled label="Disabled">
          <button disabled className="w-56 bg-primary text-white py-4 px-6 rounded-lg font-semibold opacity-50 cursor-not-allowed">
            Kjøp nå med Vipps
          </button>
        </Labeled>
      </Section>

      {/* ─── Fargepalett ─── */}
      <div className="mb-14">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1 border-b border-pink-100 pb-2">Fargepalett</h2>
        <p className="text-sm text-gray-400 mb-8">Alle farger definert i globals.css.</p>

        {[
          {
            group: 'Rosa',
            colors: [
              { label: 'primary-light-pink', bg: 'bg-primary-light-pink', hex: '#FBF2F8' },
              { label: 'primary-pink', bg: 'bg-primary-pink', hex: '#FBE7F5' },
              { label: 'lavender-pink', bg: 'bg-lavender-pink', hex: '#F9D1EE' },
              { label: 'primary-dark-pink', bg: 'bg-primary-dark-pink', hex: '#F5B0DF' },
              { label: 'primary-light', bg: 'bg-primary-light', hex: '#EECED5' },
            ],
          },
          {
            group: 'Lilla',
            colors: [
              { label: 'disabled', bg: 'bg-disabled', hex: '#ECDDED' },
              { label: 'purple', bg: 'bg-purple', hex: '#BA7EB9' },
              { label: 'dark-purple', bg: 'bg-dark-purple', hex: '#673154' },
              { label: 'purple-extra-dark', bg: 'bg-purple-extra-dark', hex: '#391E36' },
            ],
          },
          {
            group: 'Rød / oransje',
            colors: [
              { label: 'primary', bg: 'bg-primary', hex: '#F05A41' },
              { label: 'orange-dark', bg: 'bg-orange-dark', hex: '#DD3F25' },
              { label: 'primary-red', bg: 'bg-primary-red', hex: '#AC0D2E' },
              { label: 'red-dark', bg: 'bg-red-dark', hex: '#8D0E2C' },
              { label: 'red-extra-dark', bg: 'bg-red-extra-dark', hex: '#4F0213' },
            ],
          },
          {
            group: 'Grønn',
            colors: [
              { label: 'primary-neon-green', bg: 'bg-primary-neon-green', hex: '#DEF46B' },
              { label: 'success', bg: 'bg-success', hex: '#9fcd81' },
              { label: 'green-dark', bg: 'bg-green-dark', hex: '#609653' },
            ],
          },
          {
            group: 'Nøytral / bakgrunn',
            colors: [
              { label: 'background', bg: 'bg-background', hex: '#FFFFFF', border: true },
              { label: 'background-secondary', bg: 'bg-background-secondary', hex: '#FDFBF9', border: true },
            ],
          },
        ].map(({ group, colors }) => (
          <div key={group} className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-300 mb-3">{group}</p>
            <div className="flex flex-wrap gap-4">
              {colors.map(({ label, bg, hex, border }: { label: string; bg: string; hex: string; border?: boolean }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex-shrink-0 ${bg} ${border ? 'border border-pink-100' : ''}`} />
                  <div>
                    <p className="text-sm font-medium text-dark-purple">{label}</p>
                    <p className="text-xs text-gray-400 font-mono">{hex}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}

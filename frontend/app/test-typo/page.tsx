'use client'

import Header from '../components/Header'

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-16">
    <p className="text-xs font-bold tracking-widest uppercase text-app-muted mb-6 pb-2 border-b border-default">{title}</p>
    {children}
  </section>
)

const ColorSwatch = ({ label, bg, text = 'text-app-primary', hex }: { label: string; bg: string; text?: string; hex: string }) => (
  <div className="flex flex-col gap-1">
    <div className={`${bg} rounded-lg h-16 w-full border border-subtle`} />
    <p className="text-xs font-semibold text-app-primary">{label}</p>
    <p className="text-xs text-app-muted font-mono">{hex}</p>
  </div>
)

export default function TypographyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-24">
        <h1 className="font-display text-5xl leading-none text-app-primary mb-2">Type Ramp</h1>
        <p className="text-app-muted mb-16">feelpearly — fonter, størrelser og farger</p>

        {/* DISPLAY FONT */}
        <Section title="DM Serif Display — font-display">
          <div className="space-y-8">
            <div className="flex items-baseline gap-6 flex-wrap">
              <span className="text-xs text-app-muted w-28 shrink-0">text-9xl / Hero</span>
              <p className="font-display text-9xl leading-none text-app-primary">Pearly</p>
            </div>
            <div className="flex items-baseline gap-6 flex-wrap">
              <span className="text-xs text-app-muted w-28 shrink-0">text-5xl / H1</span>
              <h1 className="font-display text-5xl leading-none text-app-primary">Fra bilde til perlekart</h1>
            </div>
            <div className="flex items-baseline gap-6 flex-wrap">
              <span className="text-xs text-app-muted w-28 shrink-0">text-4xl / H2</span>
              <h2 className="font-display text-4xl leading-none text-app-primary">Fra bilde til perlekart</h2>
            </div>
            <div className="flex items-baseline gap-6 flex-wrap">
              <span className="text-xs text-app-muted w-28 shrink-0">text-3xl / H3</span>
              <h3 className="font-display text-3xl leading-none text-app-primary">Fra bilde til perlekart</h3>
            </div>
          </div>
        </Section>

        {/* BODY FONT */}
        <Section title="Quicksand — font-sans (standard)">
          <div className="space-y-6">
            <div className="flex items-baseline gap-6">
              <span className="text-xs text-app-muted w-28 shrink-0">text-2xl / Ingress</span>
              <p className="text-2xl font-semibold text-app-primary">Du velger størrelse og fargepaller, vi gjør resten.</p>
            </div>
            <div className="flex items-baseline gap-6">
              <span className="text-xs text-app-muted w-28 shrink-0">text-xl / Stor brødtekst</span>
              <p className="text-xl text-app-primary">Du velger størrelse og fargepaller, vi gjør resten.</p>
            </div>
            <div className="flex items-baseline gap-6">
              <span className="text-xs text-app-muted w-28 shrink-0">text-lg / Brødtekst</span>
              <p className="text-lg text-app-primary">Du velger størrelse og fargepaller, vi gjør resten.</p>
            </div>
            <div className="flex items-baseline gap-6">
              <span className="text-xs text-app-muted w-28 shrink-0">text-base / Standard</span>
              <p className="text-base text-app-primary">Du velger størrelse og fargepaller, vi gjør resten.</p>
            </div>
            <div className="flex items-baseline gap-6">
              <span className="text-xs text-app-muted w-28 shrink-0">text-sm / Liten</span>
              <p className="text-sm text-app-secondary">Brukes til labels, metadata og hjelptekst.</p>
            </div>
            <div className="flex items-baseline gap-6">
              <span className="text-xs text-app-muted w-28 shrink-0">text-xs / Mikro</span>
              <p className="text-xs text-app-muted uppercase tracking-widest font-bold">Kategori / tag</p>
            </div>
          </div>
        </Section>

        {/* FARGER */}
        <Section title="Primærfarger">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            <ColorSwatch label="primary" bg="bg-primary" hex="#F05A41" />
            <ColorSwatch label="primary-red" bg="bg-primary-red" hex="#AC0D2E" />
            <ColorSwatch label="dark-purple" bg="bg-dark-purple" hex="#673154" />
            <ColorSwatch label="purple" bg="bg-purple" hex="#BA7EB9" />
            <ColorSwatch label="neon-green" bg="bg-primary-neon-green" hex="#DEF46B" />
            <ColorSwatch label="success" bg="bg-success" hex="#9fcd81" />
          </div>
        </Section>

        <Section title="Bakgrunnsfarger">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            <ColorSwatch label="background" bg="bg-background border border-default" hex="#FFFFFF" />
            <ColorSwatch label="background-secondary" bg="bg-background-secondary" hex="#FDFBF9" />
            <ColorSwatch label="primary-pink" bg="bg-primary-pink" hex="#FBE7F5" />
            <ColorSwatch label="primary-light" bg="bg-primary-light" hex="#EECED5" />
            <ColorSwatch label="primary-dark-pink" bg="bg-primary-dark-pink" hex="#F5B0DF" />
            <ColorSwatch label="lavender-pink" bg="bg-lavender-pink" hex="#F9D1EE" />
          </div>
        </Section>

        <Section title="Tekstfarger">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="w-5 h-5 rounded-full bg-[#111827] shrink-0" />
              <p className="text-app-primary text-base font-semibold">text-app-primary — #111827 — Overskrifter og viktig innhold</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-5 h-5 rounded-full bg-[#4b5563] shrink-0" />
              <p className="text-app-secondary text-base">text-app-secondary — #4b5563 — Brødtekst</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-5 h-5 rounded-full bg-[#6b7280] shrink-0" />
              <p className="text-app-muted text-base">text-app-muted — #6b7280 — Labels og metadata</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-5 h-5 rounded-full bg-[#673154] shrink-0" />
              <p className="text-dark-purple text-base">text-dark-purple — #673154 — Knapper og aksenter</p>
            </div>
            <div className="flex items-center gap-4 bg-dark-purple rounded-lg px-4 py-3">
              <div className="w-5 h-5 rounded-full bg-white shrink-0" />
              <p className="text-white text-base">text-white — på mørke bakgrunner (hero, footer)</p>
            </div>
          </div>
        </Section>
      </div>
    </div>
  )
}

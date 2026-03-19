'use client'

import Link from "next/link"
import { PortableText } from "next-sanity"
import { portableTextComponents } from "./PortableTextComponents"
import { useKampanjeBanner } from "@/app/hooks/useSanityData"

const DARK_BACKGROUNDS = ['var(--dark-purple)', 'var(--purple-extra-dark)', 'var(--primary)']

function isDarkBackground(bg: string): boolean {
  if (DARK_BACKGROUNDS.includes(bg)) return true
  const hex = bg.replace('#', '')
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
    if (luminance < 0.35) return true
  }
  return false
}

const proseStyleDark: React.CSSProperties = {
  '--tw-prose-body': 'white',
  '--tw-prose-headings': 'white',
  '--tw-prose-bold': 'white',
  '--tw-prose-links': 'white',
  '--tw-prose-counters': 'white',
  '--tw-prose-bullets': 'white',
} as React.CSSProperties

const proseStyleLight: React.CSSProperties = {
  '--tw-prose-body': 'var(--foreground)',
  '--tw-prose-headings': 'var(--foreground)',
  '--tw-prose-bold': 'var(--foreground)',
} as React.CSSProperties

interface KampanjeBannerProps {
  data?: any
}

function BannerInner({ data }: { data: any }) {
  if (data?.isActive === false) return null
  if (!data?.title && (!data?.body || data.body.length === 0)) return null

  const resolvedBg = data.customBackgroundColor || data.backgroundColor || 'var(--primary-neon-green)'
  const dark = isDarkBackground(resolvedBg)
  const sectionStyle = { background: resolvedBg, color: dark ? 'white' : 'inherit' }
  const className = "py-3 px-6"

  const inner = (
    <div className="max-w-4xl mx-auto text-center">
      {data.title && (
        <h2 className="text-base font-bold uppercase mb-0.5">{data.title}</h2>
      )}
      {data.body?.length > 0 && (
        <div
          className="prose max-w-none mx-auto [&_p]:text-base [&_p]:leading-normal"
          style={dark ? proseStyleDark : proseStyleLight}
        >
          <PortableText value={data.body} components={portableTextComponents} />
        </div>
      )}
    </div>
  )

  if (data.link) {
    return (
      <Link
        href={data.link}
        className={`block ${className} hover:opacity-90 transition-opacity`}
        style={sectionStyle}
      >
        {inner}
      </Link>
    )
  }

  return (
    <section className={className} style={sectionStyle}>
      {inner}
    </section>
  )
}

export default function KampanjeBanner({ data }: KampanjeBannerProps) {
  const { data: fetchedData, loading } = useKampanjeBanner()

  const resolvedData = data ?? fetchedData

  if (!data && (loading || !resolvedData)) return null

  return <BannerInner data={resolvedData} />
}

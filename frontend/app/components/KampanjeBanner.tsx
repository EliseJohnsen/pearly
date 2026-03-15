import Link from "next/link"
import { PortableText } from "next-sanity"
import { portableTextComponents } from "./PortableTextComponents"

interface KampanjeBannerProps {
  data?: any
}

export default function KampanjeBanner({ data }: KampanjeBannerProps) {
  if (!data?.body || data.body.length === 0) {
    return null
  }

  const inner = (
    <div className="max-w-4xl mx-auto text-center">
      {data.title && (
        <h2 className="font-display text-3xl leading-none mb-6">{data.title}</h2>
      )}
      <div className="prose prose-lg max-w-none mx-auto">
        <PortableText value={data.body} components={portableTextComponents} />
      </div>
    </div>
  )

  if (data.link) {
    return (
      <Link
        href={data.link}
        className="block py-12 px-4 hover:opacity-90 transition-opacity"
        style={{ backgroundColor: data.backgroundColor || 'var(--background)' }}
      >
        {inner}
      </Link>
    )
  }

  return (
    <section className="py-12 px-4" style={{ backgroundColor: data.backgroundColor || 'var(--background)' }}>
      {inner}
    </section>
  )
}

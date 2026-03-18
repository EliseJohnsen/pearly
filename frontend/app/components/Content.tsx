import { PortableText } from "next-sanity"
import { portableTextComponents } from "./PortableTextComponents"

interface ContentData {
  body?: unknown[];
  title?: string;
  backgroundColor?: string;
}

const contentPortableTextComponents = {
  ...portableTextComponents,
  block: {
    h1: ({ children }: any) => <h1 className="font-display text-4xl md:text-5xl leading-none text-left text-dark-purple mb-4">{children}</h1>,
    h2: ({ children }: any) => <h2 className="font-display text-2xl leading-none">{children}</h2>,
  },
}

interface ContentProps {
  data?: ContentData;
}

export default function Content({ data }: ContentProps) {
  // Don't render if no body content
  if (!data?.body || data.body.length === 0) {
    return null
  }

  return (
    <section className="py-12 px-4" style={{backgroundColor: data.backgroundColor || 'var(--background)'}}>
      <div className="max-w-4xl mx-auto">
        {data.title && (
          <h2 className="font-display text-3xl leading-none mb-6">{data.title}</h2>
        )}
        <div className="prose prose-lg max-w-none">
          <PortableText value={data.body} components={contentPortableTextComponents} />
        </div>
      </div>
    </section>
  )
}

import { PortableText } from "next-sanity"
import { portableTextComponents } from "./PortableTextComponents"

interface ContentProps {
  data?: any
}

export default function Content({ data }: ContentProps) {
  // Don't render if no body content
  if (!data?.body || data.body.length === 0) {
    return null
  }

  const getBgColor = () => {
    if (data.backgroundColor) {
      return data.backgroundColor
    } else {
      return "#F6E4CC"
    }
  }

  return (
    <section className="py-12 px-4" style={{backgroundColor: getBgColor()}}>
      <div className="max-w-4xl mx-auto">
        {data.title && (
          <h2 className="text-3xl font-bold mb-6">{data.title}</h2>
        )}
        <div className="prose prose-lg max-w-none">
          <PortableText value={data.body} components={portableTextComponents} />
        </div>
      </div>
    </section>
  )
}

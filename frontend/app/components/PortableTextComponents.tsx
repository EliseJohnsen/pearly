import { PortableTextComponents } from "next-sanity";
import Image from "next/image";
import Link from "next/link";
import { urlFor } from "@/lib/sanity";

export const portableTextComponents: PortableTextComponents = {
  types: {
    image: ({ value }) => {
      if (!value?.asset) return null;

      return (
        <figure className="not-prose my-8">
          <Image
            src={urlFor(value).width(800).quality(80).auto("format").url()}
            alt={value.alt || ""}
            width={800}
            height={600}
            className="rounded-lg w-full h-auto"
          />
          {value.caption && (
            <figcaption className="text-sm text-gray-600 mt-2 text-center">
              {value.caption}
            </figcaption>
          )}
        </figure>
      );
    },
  },
  marks: {
    link: ({ value, children }) => {
      const target = value?.openInNewTab ? "_blank" : undefined;
      const rel = value?.openInNewTab ? "noopener noreferrer" : undefined;

      // External link
      if (value?.href?.startsWith("http")) {
        return (
          <a href={value.href} target={target} rel={rel} className="text-primary hover:underline">
            {children}
          </a>
        );
      }

      // Internal link (Next.js Link)
      return (
        <Link href={value?.href || "/"} className="text-primary hover:underline">
          {children}
        </Link>
      );
    },
  },
};

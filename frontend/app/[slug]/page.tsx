"use client";

import { client } from "@/lib/sanity";
import { groq } from "next-sanity";
import { notFound } from "next/navigation";
import { use, useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Banner from "../components/Banner";
import HowItWorks from "../components/HowItWorks";
import CTA from "../components/CTA";
import Content from "../components/Content";

// Define the page query
const pageQuery = groq`*[_type == "page" && slug.current == $slug][0]{
  _id,
  title,
  slug,
  seoMetadata,
  uiStrings,
  sections[]{
    _type,
    _type == "hero" => {
      heading,
      subheading,
      image{
        asset->{_id, url, metadata{lqip, dimensions{width, height}}},
        alt,
        hotspot
      },
      imageWidth,
      ctaButton{text, href},
      isActive
    },
    _type == "banner" => {
      text,
      type,
      backgroundColor,
      isActive,
      link{text, href}
    },
    _type == "howItWorks" => {
      sectionTitle,
      sectionSubtitle,
      fontColor,
      backgroundColor,
      steps[]{
        title,
        description,
        icon,
        image{
          asset->{_id, url, metadata{lqip, dimensions{width, height}}},
          alt
        },
        order
      }
    },
    _type == "content" => {
      title,
      body,
      isActive
    },
    _type == "productsSection" => {
      sectionTitle,
      sectionSubtitle,
      products[]->{
        _id,
        title,
        slug,
        description,
        image{
          asset->{_id, url, metadata{lqip, dimensions{width, height}}},
          alt
        },
        category,
        difficulty,
        isFeatured
      },
      showFeaturedOnly
    }
  },
}`;

export default function DynamicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPage() {
      try {
        const data = await client.fetch(pageQuery, { slug });
        setPage(data);
      } catch (error) {
        console.error("Error fetching page:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Laster...</p>
        </div>
      </div>
    );
  }

  if (!page) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />
      <main className="min-h-screen">
        {page.sections?.map((section: any, index: number) => {
          switch (section._type) {
            case "hero":
              return <CTA key={index} data={section} />;
            case "banner":
                return <Banner key={index} data={section} />;
            case "howItWorks":
              return <HowItWorks key={index} data={section} />;
            case "content":
              return <Content key={index} data={section} />;
            case "productsSection":
              return (
                <section key={index} className="py-12">
                  <div className="max-w-7xl mx-auto px-4">
                    {section.sectionTitle && (
                      <h2 className="text-3xl font-bold text-center mb-4">
                        {section.sectionTitle}
                      </h2>
                    )}
                    {section.sectionSubtitle && (
                      <p className="text-center text-gray-600 mb-8">
                        {section.sectionSubtitle}
                      </p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {section.products?.map((product: any) => (
                        <a
                          key={product._id}
                          href={`/produkter/${product.slug.current}`}
                          className="border rounded-lg p-4 hover:shadow-lg transition block"
                        >
                          {product.image?.asset?.url && (
                            <img
                              src={product.image.asset.url}
                              alt={product.image.alt || product.title}
                              className="w-full max-h-72 object-cover rounded mb-4"
                            />
                          )}
                          <h3 className="font-semibold text-lg mb-2">
                            {product.title}
                          </h3>
                          {product.description && (
                            <p className="text-gray-600 text-sm">
                              {product.description}
                            </p>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                </section>
              );
            default:
              return null;
          }
        })}
      </main>
      <Footer />
    </div>
  );
}

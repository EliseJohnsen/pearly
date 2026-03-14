"use client";

import { client } from "@/lib/sanity";
import { groq } from "next-sanity";
import { notFound } from "next/navigation";
import { use, useEffect, useState, Suspense } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Banner from "../components/Banner";
import HowItWorks from "../components/HowItWorks";
import CTA from "../components/CTA";
import HeroForside from "../components/HeroForside";
import Content from "../components/Content";
import ProductSection from "../components/ProductSection";
import LoadingSpinner from "../components/LoadingSpinner";
import ImageCarousel from "../components/ImageCarousel";
import CollapsableCardsSection from "../components/CollapsableCardsSection";
import ProductCarousel from '../components/ProductCarousel';
import SplitSection from '../components/SplitSection';
import PearlyButton from "../components/PearlyButton";

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
        price,
        "images": images[]{
          asset->{_id, url, metadata{lqip, dimensions{width, height}}},
          alt,
          isPrimary
        },
        category->{_id, name, slug, parent->{_id, slug}},
        requiredBoards,
      },
      showFeaturedOnly
    },
    _type == "imageCarousel" => {
      heading,
      description,
      images[]{
        asset->{_id, url, metadata{lqip, dimensions{width, height}}},
        alt
      },
      autoRotate,
      rotationInterval,
      ctaButton{text, href},
      isActive
    },
    _type == "collapsableCards" => {
      sectionTitle,
      cards[]{
        header,
        icon,
        content,
        defaultExpanded,
        order
      },
      isActive
    },
    _type == "productCarousel" => {
      heading,
      products[]->{
        _id,
        title,
        slug,
        price,
        "images": images[]{
          asset->{_id, url},
          alt,
          isPrimary
        },
      },
      viewMoreLink{text, href},
      isActive
    },
    _type == "splitSection" => {
      heading,
      body,
      button{text, href},
      image{
        asset->{_id, url, metadata{lqip, dimensions{width, height}}},
        alt,
        hotspot
      },
      imagePosition,
      backgroundColor,
      isActive
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
        <LoadingSpinner loadingMessage="Laster..."></LoadingSpinner>
      </div>
    );
  }

  if (!page) {
    notFound();
  }

  const sections: any[] = page.sections || [];

  const renderSections = () => {
    const result = [];
    let i = 0;
    while (i < sections.length) {
      const section = sections[i];
      const next = sections[i + 1];

      // Two-column layout: imageCarousel paired with collapsableCards
      if (section._type === 'imageCarousel' && next?._type === 'collapsableCards') {
        result.push(
          <div key={i} className="max-w-6xl mx-auto md:px-4 md:py-12">
            <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-7">
              {/* Left: sticky carousel */}
              <div className="md:sticky md:top-4 md:self-start">
                <ImageCarousel data={section} carouselOnly />
              </div>
              {/* Right: heading, description, cards, CTA */}
              <div className="px-4 md:px-0 space-y-4 pt-6 md:pt-4">
                <p className="text-sm font-semibold uppercase tracking-widest text-purple">Personlig motiv</p>
                {section.heading && (
                  <h2 className="text-4xl md:text-5xl font-semibold text-left text-dark-purple mb-4">{section.heading}</h2>
                )}
                {section.description && (
                  <p className="text-lg text-gray-700">{section.description}</p>
                )}
                {section.ctaButton && (
                  <PearlyButton skin="primary" href={section.ctaButton.href} className="w-full !py-4 !px-6 !my-8">
                    {section.ctaButton.text}
                  </PearlyButton>
                )}
                <CollapsableCardsSection data={next} compact />
              </div>
            </div>
          </div>
        );
        i += 2;
        continue;
      }

      switch (section._type) {
        case "hero":
          result.push(
            slug === "home"
              ? <HeroForside key={i} data={section} />
              : <CTA key={i} data={section} />
          );
          break;
        case "banner":
          result.push(<Banner key={i} data={section} />);
          break;
        case "howItWorks":
          result.push(<HowItWorks key={i} data={section} />);
          break;
        case "content":
          result.push(<Content key={i} data={section} />);
          break;
        case "productsSection":
          result.push(<Suspense key={i} fallback={null}><ProductSection data={section} /></Suspense>);
          break;
        case "imageCarousel":
          result.push(<ImageCarousel key={i} data={section} />);
          break;
        case "collapsableCards":
          result.push(<CollapsableCardsSection key={i} data={section} />);
          break;
        case "productCarousel":
          result.push(<ProductCarousel key={i} heading={section.heading} products={section.products || []} viewMoreLink={section.viewMoreLink} />);
          break;
        case "splitSection":
          result.push(<SplitSection key={i} data={section} />);
          break;
      }
      i++;
    }
    return result;
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header startTransparent={slug === 'home'} />
      <main className="min-h-screen">
        {renderSections()}
      </main>
      <Footer />
    </div>
  );
}

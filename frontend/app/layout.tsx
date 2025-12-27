import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
import {LocaleProvider} from "./contexts/LocaleContext";
import { VisualEditingWrapper } from "./components/VisualEditingWrapper";
import { draftMode } from "next/headers";
import { fetchSanityData } from "@/lib/sanity.server";
import { PageSettings } from "@/types/sanity";
import { urlFor } from "@/lib/sanity";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

// Fetch metadata from Sanity
async function getMetadata(): Promise<Metadata> {
  const pageSettings = await fetchSanityData<PageSettings>(
    `*[_type == "pageSettings" && page == "home"][0]{
      title,
      description,
      ogImage,
      favicon
    }`
  );

  const metadata: Metadata = {
    title: pageSettings?.title || "feel pearly",
    description: pageSettings?.description || "bead the change",
  };

  // Add favicon if available
  if (pageSettings?.favicon) {
    metadata.icons = {
      icon: urlFor(pageSettings.favicon).width(512).height(512).url(),
      apple: urlFor(pageSettings.favicon).width(180).height(180).url(),
    };
  }

  // Add OG image if available
  if (pageSettings?.ogImage) {
    metadata.openGraph = {
      images: [
        {
          url: urlFor(pageSettings.ogImage).width(1200).height(630).url(),
          width: 1200,
          height: 630,
          alt: pageSettings.ogImage.alt || pageSettings.title,
        },
      ],
    };
  }

  return metadata;
}

export async function generateMetadata(): Promise<Metadata> {
  return getMetadata();
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const draft = await draftMode()

  return (
    <html lang="en">
      <body className={`${quicksand.variable} antialiased`}>
        <LocaleProvider>
          {children}
        </LocaleProvider>
        {draft.isEnabled && <VisualEditingWrapper />}
      </body>
    </html>
  );
}

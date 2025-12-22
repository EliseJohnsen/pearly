import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
import {LocaleProvider} from "./contexts/LocaleContext";
import { VisualEditingWrapper } from "./components/VisualEditingWrapper";
import { draftMode } from "next/headers";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "feel pearly",
  description: "get your hands pearly",
};

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

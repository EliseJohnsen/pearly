"use client";

import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { XCircleIcon } from "@heroicons/react/24/outline";

export default function PaymentCancelledPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
        <div className="bg-white shadow-md rounded-lg p-8 text-center">
          <XCircleIcon className="w-20 h-20 text-gray-400 mx-auto mb-6" />

          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Betaling avbrutt
          </h1>

          <p className="text-gray-600 mb-6">
            Betalingen ble avbrutt. Ingen penger er trukket fra kontoen din.
          </p>

          <p className="text-sm text-gray-500 mb-6">
            Handlekurven din er fortsatt lagret hvis du ønsker å prøve igjen.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/handlekurv"
              className="inline-block bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary/90 transition"
            >
              Tilbake til handlekurv
            </Link>
            <Link
              href="/perlepakker"
              className="inline-block bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              Fortsett å handle
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

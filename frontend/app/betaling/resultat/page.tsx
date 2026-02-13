"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useOrderStatusPolling } from "@/app/hooks/useOrderStatusPolling";
import Link from "next/link";

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get("reference");

  const { orderStatus, loading, error, timedOut } = useOrderStatusPolling(reference);

  useEffect(() => {
    // Don't redirect if still loading or if there's an error without status
    if (loading || !orderStatus) return;

    const paymentStatus = orderStatus.payment_status;

    // Redirect based on payment status
    if (paymentStatus === "paid") {
      router.push(`/betaling/suksess?reference=${reference}`);
    } else if (paymentStatus === "cancelled") {
      router.push(`/betaling/avbrutt?reference=${reference}`);
    } else if (paymentStatus === "failed") {
      router.push(`/betaling/avbrutt?reference=${reference}&reason=failed`);
    }
  }, [orderStatus, loading, reference, router]);

  // Handle timeout
  useEffect(() => {
    if (timedOut) {
      router.push(`/betaling/avbrutt?reference=${reference}&reason=timeout`);
    }
  }, [timedOut, reference, router]);

  // Handle error without reference
  if (error && !reference) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 font-semibold mb-2">Feil</p>
            <p className="text-red-600">Ugyldig betalingslink - mangler ordrereferanse</p>
            <Link
              href="/"
              className="inline-block mt-4 text-primary hover:underline"
            >
              Gå til forsiden
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
        <div className="bg-white shadow-md rounded-lg p-8 text-center">
          <LoadingSpinner
            loadingMessage="Bekrefter betaling..."
            description="Dette tar vanligvis bare noen sekunder"
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex flex-col">
          <Header />
          <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
            <LoadingSpinner loadingMessage="Laster..." />
          </main>
          <Footer />
        </div>
      }
    >
      <PaymentResultContent />
    </Suspense>
  );
}

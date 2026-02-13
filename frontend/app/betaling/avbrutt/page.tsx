"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { XCircleIcon, ExclamationTriangleIcon, ClockIcon } from "@heroicons/react/24/outline";
import LoadingSpinner from "@/app/components/LoadingSpinner";

interface OrderStatus {
  order_id: number;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number | null;
  currency: string | null;
}

function PaymentCancelledContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");
  const reason = searchParams.get("reason");

  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) return;

    async function fetchOrderStatus() {
      setLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const response = await fetch(`${apiUrl}/api/checkout/${reference}`);

        if (!response.ok) {
          throw new Error("Kunne ikke hente ordredetaljer");
        }

        const data = await response.json();
        setOrderStatus(data);
      } catch (err) {
        console.error("Error fetching order status:", err);
        setError(err instanceof Error ? err.message : "En feil oppstod");
      } finally {
        setLoading(false);
      }
    }

    fetchOrderStatus();
  }, [reference]);

  const formatPrice = (amount: number | null, currency: string | null) => {
    if (amount === null) return "—";
    const amountInKroner = amount / 100;
    return new Intl.NumberFormat("nb-NO", {
      style: "currency",
      currency: currency || "NOK",
    }).format(amountInKroner);
  };

  // Determine icon, title, and message based on reason
  const getContentByReason = () => {
    switch (reason) {
      case "timeout":
        return {
          icon: <ClockIcon className="w-20 h-20 text-yellow-500 mx-auto mb-6" />,
          title: "Betalingsstatus ukjent",
          message: "Vi kunne ikke bekrefte betalingsstatus i tide. Dette kan skyldes forsinkelser i betalingssystemet.",
          subtitle: "",
        };
      case "failed":
        return {
          icon: <ExclamationTriangleIcon className="w-20 h-20 text-red-500 mx-auto mb-6" />,
          title: "Betaling feilet",
          message: "Betalingen kunne ikke gjennomføres. Dette kan skyldes utilstrekkelige midler eller en teknisk feil.",
          subtitle: "Vennligst prøv igjen eller bruk en annen betalingsmetode.",
        };
      default: // cancelled or no reason
        return {
          icon: <XCircleIcon className="w-20 h-20 text-gray-500 mx-auto mb-6" />,
          title: "Betaling avbrutt",
          message: "Betalingen ble avbrutt. Ingen penger er trukket fra kontoen din.",
          subtitle: "Handlekurven din er fortsatt lagret hvis du ønsker å prøve igjen.",
        };
    }
  };

  const content = getContentByReason();

  if (loading && reference) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
          <LoadingSpinner loadingMessage="Henter ordredetaljer..." />
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
          {content.icon}

          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            {content.title}
          </h1>

          <p className="text-gray-600 mb-4">
            {content.message}
          </p>

          {reason === "timeout" && reference && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-blue-800 text-sm mb-3">
                💡 <strong>Sjekk ordrestatus:</strong> Betalingen din kan fortsatt være under behandling.
              </p>
              <Link
                href={`/ordre/status?reference=${reference}`}
                className="inline-block bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition text-sm"
              >
                Se ordrestatus for {reference}
              </Link>
            </div>
          )}

          {content.subtitle && (
            <p className="text-sm text-gray-500 mb-6">
              {content.subtitle}
            </p>
          )}

          {/* Show order details if available */}
          {orderStatus && !error && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
              <h2 className="font-semibold mb-4">Ordredetaljer</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Ordrenummer:</span>
                  <span className="font-medium">{orderStatus.order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-medium capitalize">
                    {orderStatus.payment_status === "cancelled" ? "Avbrutt" :
                     orderStatus.payment_status === "failed" ? "Feilet" :
                     orderStatus.payment_status === "pending" ? "Venter" :
                     orderStatus.payment_status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Beløp:</span>
                  <span className="font-bold">
                    {formatPrice(orderStatus.total_amount, orderStatus.currency)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {error && reference && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

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

export default function PaymentCancelledPage() {
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
      <PaymentCancelledContent />
    </Suspense>
  );
}

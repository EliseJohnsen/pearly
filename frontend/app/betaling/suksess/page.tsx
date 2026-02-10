"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { useCart } from "@/app/contexts/CartContext";
import LoadingSpinner from "@/app/components/LoadingSpinner";

interface OrderStatus {
  order_id: number;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number | null;
  currency: string | null;
  customer_email: string | null;
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { clearCart } = useCart();

  useEffect(() => {
    // Clear cart on successful payment
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    async function fetchOrderStatus() {
      if (!reference) {
        setError("Mangler ordrereferanse");
        setLoading(false);
        return;
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const response = await fetch(`${apiUrl}/api/checkout/${reference}`);

        if (!response.ok) {
          throw new Error("Kunne ikke hente ordrestatus");
        }

        const data = await response.json();
        setOrderStatus(data);
      } catch (err) {
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
        {loading ? (
          <LoadingSpinner
            loadingMessage="Henter ordredetaljer...">
          </LoadingSpinner>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 font-semibold mb-2">Feil</p>
            <p className="text-red-600">{error}</p>
            <Link
              href="/"
              className="inline-block mt-4 text-primary hover:underline"
            >
              Gå til forsiden
            </Link>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg p-8 text-center">
            <CheckCircleIcon className="w-20 h-20 text-success mx-auto mb-6" />

            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Takk for din bestilling!
            </h1>

            <p className="text-gray-600 mb-6">
              Vi har mottatt din betaling og behandler ordren din.
            </p>

            {orderStatus && (
              <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
                <h2 className="font-semibold mb-4">Ordredetaljer</h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Ordrenummer:</span>
                    <span className="font-medium">{orderStatus.order_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span >Status:</span>
                    <span className="font-medium capitalize">
                      {orderStatus.payment_status === "paid" ? "Betalt" : orderStatus.payment_status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Totalt:</span>
                    <span className="font-bold">
                      {formatPrice(orderStatus.total_amount, orderStatus.currency)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <p className="mb-6">
              Du vil motta en bekreftelse på e-post 
            </p>

            <Link
              href="/perlepakker"
              className="inline-block bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary/90 transition"
            >
              Fortsett å handle
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function PaymentSuccessPage() {
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
      <PaymentSuccessContent />
    </Suspense>
  );
}

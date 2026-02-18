"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";

interface OrderStatus {
  order_id: number;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number | null;
  currency: string | null;
}

function OrderStatusContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");

  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) {
      setError("Mangler ordrenummer");
      setLoading(false);
      return;
    }

    async function fetchOrderStatus() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const response = await fetch(`${apiUrl}/api/checkout/${reference}`);

        if (!response.ok) {
          throw new Error("Kunne ikke hente ordrestatus");
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

  const getStatusDisplay = (paymentStatus: string) => {
    switch (paymentStatus) {
      case "paid":
        return {
          icon: <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />,
          text: "Betalt",
          color: "text-green-700",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
        };
      case "cancelled":
        return {
          icon: <XCircleIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />,
          text: "Avbrutt",
          color: "text-gray-700",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
        };
      case "failed":
        return {
          icon: <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />,
          text: "Feilet",
          color: "text-red-700",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
        };
      case "pending":
      default:
        return {
          icon: <ClockIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />,
          text: "Venter på betaling",
          color: "text-yellow-700",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
          <LoadingSpinner loadingMessage="Henter ordrestatus..." />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !orderStatus) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 font-semibold mb-2">Feil</p>
            <p className="text-red-600">{error || "Kunne ikke hente ordrestatus"}</p>
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

  const statusDisplay = getStatusDisplay(orderStatus.payment_status);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
        <div className="bg-white shadow-md rounded-lg p-8">
          <div className="text-center mb-8">
            {statusDisplay.icon}
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Ordrestatus
            </h1>
          </div>

          <div className={`${statusDisplay.bgColor} border ${statusDisplay.borderColor} rounded-lg p-6 mb-6`}>
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <p className={`text-2xl font-bold ${statusDisplay.color}`}>
                {statusDisplay.text}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="font-semibold mb-4">Ordredetaljer</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Ordrenummer:</span>
                <span className="font-medium">{orderStatus.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Betalingsstatus:</span>
                <span className={`font-medium ${statusDisplay.color}`}>
                  {statusDisplay.text}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ordrestatus:</span>
                <span className="font-medium capitalize">
                  {orderStatus.status.replace("_", " ")}
                </span>
              </div>
              <div className="flex justify-between border-t pt-3 mt-3">
                <span className="text-gray-600">Totalt beløp:</span>
                <span className="font-bold text-lg">
                  {formatPrice(orderStatus.total_amount, orderStatus.currency)}
                </span>
              </div>
            </div>
          </div>

          {orderStatus.payment_status === "pending" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm">
                💡 <strong>Tips:</strong> Refresh denne siden for å sjekke oppdatert status.
                Hvis du har betalt men statusen fortsatt viser "venter", kan det ta noen minutter
                før betalingen blir registrert.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="inline-block bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary/90 transition"
            >
              Oppdater status
            </button>
            <Link
              href="/"
              className="inline-block bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition text-center"
            >
              Gå til forsiden
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function OrderStatusPage() {
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
      <OrderStatusContent />
    </Suspense>
  );
}

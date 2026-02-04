"use client";

import { client } from "@/lib/sanity";
import { productsByIdsQuery } from "@/lib/queries";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { authenticatedFetch } from "@/lib/auth";
import StatusPill from "@/app/components/StatusPill";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Order, OrderLine, OrderLog, Product } from "@/app/models/orderModels";


export default function OrderDetailPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [products, setProducts] = useState<Product[] | []>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logMessage, setLogMessage] = useState("");
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);

  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const response = await authenticatedFetch(`${apiUrl}/api/orders/${orderId}`);

        if (!response.ok) {
          throw new Error("Kunne ikke hente ordre");
        }

        const data = await response.json();
        setOrder(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "En feil oppstod");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  useEffect(() => {
    async function fetchProducts() {
      if (!order?.order_lines || order.order_lines.length === 0) {
        return;
      }

      try {
        const ids = order.order_lines.map((line) => line.product_id);
        const data = await client.fetch(productsByIdsQuery, { ids });
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    }

    fetchProducts();
  }, [order]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("no-NO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number | null, currency: string | null) => {
    if (amount === null) return "—";
    const amountInKroner = amount / 100;
    return `${amountInKroner.toFixed(2)} ${currency || "NOK"}`;
  };

  const getAddressTypeText = (type: string) => {
    return type === "billing" ? "Fakturaadresse" : "Leveringsadresse";
  };

  const getProductName = (id: string ) => {return products.find((product) => product._id === id)?.title};
  const getProductPatternId = (id: string ) => {return products.find((product) => product._id === id)?.patternId};

  const handleOrderLineRowClick = (productId: string) => {
    const patternId = getProductPatternId(productId)
    router.push(`/admin/patterns/${patternId}`);
  };

  const handleSubmitLog = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!logMessage.trim()) {
      return;
    }

    setIsSubmittingLog(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await authenticatedFetch(`${apiUrl}/api/orders/${orderId}/logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: logMessage }),
      });

      if (!response.ok) {
        throw new Error("Kunne ikke opprette loggoppføring");
      }

      const newLog = await response.json();

      // Update order state with new log
      if (order) {
        setOrder({
          ...order,
          logs: [...order.logs, newLog],
        });
      }

      // Clear input
      setLogMessage("");
    } catch (err) {
      console.error("Error creating log:", err);
      alert(err instanceof Error ? err.message : "En feil oppstod");
    } finally {
      setIsSubmittingLog(false);
    }
  };
    
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner loadingMessage="Laster inn ordre..." />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-800 font-semibold mb-2">Feil</p>
          <p className="text-red-600">{error || "Ordre ikke funnet"}</p>
          <button
            onClick={() => router.push("/admin/orders")}
            className="flex items-center gap-2 px-4 py-2 my-4 bg-purple text-white hover:bg-primary-dark-pink rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Tilbake til ordre</span>
          </button>
        </div>
      </div>
    );
  }

  const billingAddress = order.addresses.find((a) => a.type === "billing");
  const shippingAddress = order.addresses.find((a) => a.type === "shipping");

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => router.push("/admin/orders")}
          className="flex items-center gap-2 px-4 py-2 my-4 bg-purple text-white hover:bg-primary-dark-pink rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span>Tilbake til ordrer</span>
        </button>

        {/* Order header */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Ordre {order.order_number}
              </h1>
              <div className="flex items-center gap-3">
                <StatusPill status={order.status}></StatusPill>
                <span className="">
                  Ordre ID: #{order.id}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {formatCurrency(order.total_amount, order.currency)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Customer info */}
          <div className="space-y-4 grid grid-cols-2 bg-white shadow-md rounded-lg p-6">
            {order.customer && (
              <div>
                <h2 className="text-xl font-bold mb-4">
                  Kundeinformasjon
                </h2>
                <div className="space-y-3">
                  <div>
                    <div className="">Navn</div>
                    <div className="text-base font-medium">
                      {order.customer.name}
                    </div>
                  </div>
                  <div>
                    <div className="">E-post</div>
                    <div className="text-base font-medium">
                      {order.customer.email}
                    </div>
                  </div>
                  <div>
                    <div className="">Kunde siden</div>
                    <div className="text-base">
                      {formatDate(order.customer.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Addresses */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Adresser</h2>
            <div className="space-y-4 grid grid-cols-2">
              {billingAddress && (
                <div>
                  <div className=" font-semibold mb-2">
                    {getAddressTypeText(billingAddress.type)}
                  </div>
                  <div className=" space-y-1">
                    <div>{billingAddress.name}</div>
                    <div>{billingAddress.address_line_1}</div>
                    {billingAddress.address_line_2 && (
                      <div>{billingAddress.address_line_2}</div>
                    )}
                    <div>
                      {billingAddress.postal_code} {billingAddress.city}
                    </div>
                    <div>{billingAddress.country}</div>
                  </div>
                </div>
              )}
              {shippingAddress && (
                <div>
                  <div className=" font-semibold mb-2">
                    {getAddressTypeText(shippingAddress.type)}
                  </div>
                  <div className=" space-y-1">
                    <div>{shippingAddress.name}</div>
                    <div>{shippingAddress.address_line_1}</div>
                    {shippingAddress.address_line_2 && (
                      <div>{shippingAddress.address_line_2}</div>
                    )}
                    <div>
                      {shippingAddress.postal_code} {shippingAddress.city}
                    </div>
                    <div>{shippingAddress.country}</div>
                  </div>
                </div>
              )}
              {order.addresses.length === 0 && (
                <div className="">
                  Ingen adresser registrert
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 font-semibold mt-2">
              Valgt fraktalternativ:
              {order.shipping_method_id && (
                <div>
                  {order.shipping_method_id}
                </div>
              )}
              {order.shipping_amount && (
                <div>
                  {formatCurrency(order.shipping_amount, order.currency)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order lines */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold">Ordrelinjer</h2>
            <p className=" mt-1">
              {order.order_lines.length}{" "}
              {order.order_lines.length === 1 ? "linje" : "linjer"}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-primary-light">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  >
                    Produktnavn
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  >
                    Produkt ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider"
                  >
                    Enhetspris
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider"
                  >
                    Antall
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider"
                  >
                    Totalt
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {order.order_lines.map((line: OrderLine) => (
                  <tr key={line.id}
                    onClick={() => handleOrderLineRowClick(line.product_id)}
                    className="cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className=" font-mono">
                        {getProductName(line.product_id)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className=" font-mono">
                        {line.product_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="">
                        {formatCurrency(line.unit_price, order.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="">
                        {line.quantity}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className=" font-semibold">
                        {formatCurrency(line.line_total, order.currency)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-primary-light">
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-4 text-right  font-semibold"
                  >
                    Sum
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-base font-bold">
                      {formatCurrency(order.total_amount, order.currency)}
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {order.order_lines.length === 0 && (
            <div className="p-6 text-center">
              Ingen ordrelinjer funnet
            </div>
          )}
        </div>

        {/* Log */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Logg</h2>
                <p className=" mt-1">
                  {order.logs?.length}{" "}
                  {order.logs?.length === 1 ? "oppføring" : "oppføringer"}
                </p>
              </div>
            </div>

            {/* Add log form */}
            <form onSubmit={handleSubmitLog} className="flex gap-3">
              <input
                type="text"
                value={logMessage}
                onChange={(e) => setLogMessage(e.target.value)}
                placeholder="Legg til loggmelding..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple focus:border-transparent"
                disabled={isSubmittingLog}
              />
              <button
                type="submit"
                disabled={isSubmittingLog || !logMessage.trim()}
                className="px-6 py-2 bg-purple text-white rounded-md hover:bg-purple/90 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                {isSubmittingLog ? "Legger til..." : "Legg til"}
              </button>
            </form>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-primary-light">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  >
                    Tidspunkt
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  >
                    Melding
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  >
                    Type
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider"
                  >
                    Admin ID
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {order.logs?.slice().reverse().map((log: OrderLog) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="">
                        {formatDate(log.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="">
                        {log.message}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className=" capitalize">
                        {log.created_by_type}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="">
                        {log.created_by_admin_id || "—"}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {order.logs?.length === 0 && (
            <div className="p-6 text-center">
              Ingen loggoppføringer ennå
            </div>
          )}
        </div>

        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
            </div>
            <div className="text-right">
              <span className="mr-3">
                Opprettet: {formatDate(order.created_at)}
              </span>
              <span>
                Oppdatert: {formatDate(order.updated_at)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

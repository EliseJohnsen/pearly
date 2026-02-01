"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { authenticatedFetch } from "@/lib/auth";
import StatusPill from "@/app/components/StatusPill";

interface Order {
  id: number;
  order_number: string;
  customer_id: number;
  customer_name: string;
  customer_email: string;
  status: string;
  total_amount: number | null;
  currency: string | null;
  order_line_count: number;
  created_at: string;
  updated_at: string;
}

type SortField = "id" | "order_number" | "created_at" | "status" | null;
type SortDirection = "asc" | "desc";

export default function OrdersListPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const response = await authenticatedFetch(`${apiUrl}/api/orders`);

        if (!response.ok) {
          throw new Error("Kunne ikke hente ordrer");
        }

        const data = await response.json();
        setOrders(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "En feil oppstod");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("no-NO", {
      year: "numeric",
      month: "short",
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedOrders = React.useMemo(() => {
    if (!sortField) return orders;

    return [...orders].sort((a, b) => {
      let comparison = 0;

      if (sortField === "id") {
        comparison = a.id - b.id;
      } else if (sortField === "order_number") {
        comparison = a.order_number.localeCompare(b.order_number);
      } else if (sortField === "created_at") {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortField === "status") {
        comparison = a.status.localeCompare(b.status);
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [orders, sortField, sortDirection]);

  const handleRowClick = (orderId: number) => {
    router.push(`/admin/orders/${orderId}`);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="ml-1">⇅</span>;
    }
    return (
      <span className="ml-1">
        {sortDirection === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner loadingMessage="Laster inn alle ordrer..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-800 font-semibold mb-2">Feil</p>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Alle ordrer</h1>
          <p className="mt-2">
            Totalt {orders.length} {orders.length === 1 ? "ordre" : "ordrer"}
          </p>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-primary-light">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort("id")}
                  >
                    <div className="flex items-center">
                      ID
                      <SortIcon field="id" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort("order_number")}
                  >
                    <div className="flex items-center">
                      Ordrenummer
                      <SortIcon field="order_number" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  >
                    Kunde
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center">
                      Status
                      <SortIcon field="status" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  >
                    Beløp
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  >
                    Antall linjer
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort("created_at")}
                  >
                    <div className="flex items-center">
                      Opprettet
                      <SortIcon field="created_at" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => handleRowClick(order.id)}
                    className="hover:bg-background cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono">
                        {order.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono font-semibold">
                        {order.order_number}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">{order.customer_name}</div>
                      <div className="text-xs">{order.customer_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusPill status={order.status}></StatusPill>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        {formatCurrency(order.total_amount, order.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-center">
                        {order.order_line_count}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formatDate(order.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {orders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Ingen ordrer funnet</p>
          </div>
        )}
      </div>
    </div>
  );
}

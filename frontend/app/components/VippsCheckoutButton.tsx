"use client";

import { useState } from "react";

export interface OrderLine {
  product_id: string;
  name: string;
  unit_price: number; // In øre (cents)
  quantity: number;
}

interface VippsCheckoutButtonProps {
  orderLines: OrderLine[];
  currency?: string;
  disabled?: boolean;
  className?: string;
  onCheckoutStart?: () => void;
  onCheckoutError?: (error: string) => void;
}

export default function VippsCheckoutButton({
  orderLines,
  currency = "NOK",
  disabled = false,
  className,
  onCheckoutStart,
  onCheckoutError,
}: VippsCheckoutButtonProps) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (orderLines.length === 0) return;

    setCheckoutError(null);
    setIsCheckingOut(true);
    onCheckoutStart?.();

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const response = await fetch(`${apiUrl}/api/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_lines: orderLines,
          currency: currency,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Kunne ikke starte betaling");
      }

      const data = await response.json();

      // Redirect to Vipps checkout
      window.location.href = data.checkout_url;
    } catch (error) {
      console.error("Checkout error:", error);
      const errorMessage = error instanceof Error ? error.message : "En feil oppstod";
      setCheckoutError(errorMessage);
      onCheckoutError?.(errorMessage);
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="w-full">
      {checkoutError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{checkoutError}</p>
        </div>
      )}

      <button
        onClick={handleCheckout}
        disabled={isCheckingOut || orderLines.length === 0 || disabled}
        className={
          className ||
          "w-full bg-primary text-white py-4 px-6 rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        }
      >
        {isCheckingOut ? "Starter Vipps..." : "Betal med Vipps"}
      </button>
    </div>
  );
}

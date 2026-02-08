"use client";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import VippsCheckoutButton, { OrderLine } from "@/app/components/VippsCheckoutButton";
import { useCart } from "@/app/contexts/CartContext";
import { TrashIcon, MinusIcon, PlusIcon, ShoppingBagIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalPrice } = useCart();

  const formatPrice = (price: number, currency: string = "NOK") => {
    return new Intl.NumberFormat("nb-NO", {
      style: "currency",
      currency: currency,
    }).format(price);
  };

  const currency = items.length > 0 ? items[0].currency : "NOK";

  // Prepare order lines for checkout - convert price to øre
  const orderLines: OrderLine[] = items.map((item) => ({
    product_id: item.productId,
    name: item.title,
    unit_price: Math.round(item.price * 100), // Convert to øre
    quantity: item.quantity,
  }));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Handlekurv</h1>

        {items.length === 0 ? (
          <div className="bg-white shadow-md rounded-lg p-8 text-center">
            <ShoppingBagIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="mb-6">Handlekurven din er tom</p>
            <Link
              href="/perlepakker"
              className="inline-block bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary/90 transition"
            >
              Se produkter
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cart items - Mobile-first cards */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              {/* Desktop header - hidden on mobile */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 p-4 bg-primary-light font-medium text-sm uppercase tracking-wider">
                <div className="col-span-6">Produkt</div>
                <div className="col-span-2 text-center">Pris</div>
                <div className="col-span-2 text-center">Antall</div>
                <div className="col-span-2 text-right">Sum</div>
              </div>

              <div className="divide-y divide-gray-200">
                {items.map((item) => (
                  <div key={item.productId} className="p-4">
                    {/* Mobile layout */}
                    <div className="md:hidden space-y-3">
                      <div className="flex gap-4">
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <Link
                            href={`/produkter/${item.slug}`}
                            className="font-semibold hover:text-primary transition-colors"
                          >
                            {item.title}
                          </Link>
                          <p className="mt-1">
                            {formatPrice(item.price, item.currency)}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          aria-label="Fjern produkt"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
                            aria-label="Reduser antall"
                          >
                            <MinusIcon className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
                            aria-label="Øk antall"
                          >
                            <PlusIcon className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="font-semibold">
                          {formatPrice(item.price * item.quantity, item.currency)}
                        </p>
                      </div>
                    </div>

                    {/* Desktop layout */}
                    <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
                      <div className="col-span-6 flex items-center gap-4">
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}
                        <Link
                          href={`/produkter/${item.slug}`}
                          className="font-semibold hover:text-primary transition-colors"
                        >
                          {item.title}
                        </Link>
                      </div>
                      <div className="col-span-2 text-center">
                        {formatPrice(item.price, item.currency)}
                      </div>
                      <div className="col-span-2 flex items-center justify-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
                          aria-label="Reduser antall"
                        >
                          <MinusIcon className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
                          aria-label="Øk antall"
                        >
                          <PlusIcon className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="col-span-2 flex items-center justify-end gap-4">
                        <span className="font-semibold">
                          {formatPrice(item.price * item.quantity, item.currency)}
                        </span>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          aria-label="Fjern produkt"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order summary */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Oppsummering</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span>Delsum</span>
                  <span>{formatPrice(totalPrice, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frakt</span>
                  <span>Gratis</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold">
                  <span>Totalt</span>
                  <span>{formatPrice(totalPrice, currency)}</span>
                </div>
              </div>

              <VippsCheckoutButton
                orderLines={orderLines}
                currency={currency}
              />

              <button
                onClick={clearCart}
                className="w-full mt-3 text-gray-500 hover:text-red-500 py-2 text-sm transition-colors"
              >
                Tøm handlekurv
              </button>
            </div>

            {/* Continue shopping */}
            <div className="text-center">
              <Link
                href="/perlepakker"
                className="text-primary hover:underline font-medium"
              >
                ← Fortsett å handle
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

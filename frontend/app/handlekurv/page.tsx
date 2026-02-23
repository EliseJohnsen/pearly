"use client";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import VippsCheckoutButton, { OrderLine } from "@/app/components/VippsCheckoutButton";
import { useCart, CartItem } from "@/app/contexts/CartContext";
import { TrashIcon, MinusIcon, PlusIcon, ShoppingBagIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

// Transform cart items to order lines (recursive)
function transformCartItemsToOrderLines(items: CartItem[]): OrderLine[] {
  return items.map((item) => ({
    product_id: item.productId,
    name: item.title,
    unit_price: Math.round(item.price * 100), // Convert to øre
    quantity: item.quantity,
    product_type: item.productType,
    children: item.children ? transformCartItemsToOrderLines(item.children) : undefined,
  }));
}

// Recursive cart item row component
function CartItemRow({
  item,
  level = 0,
  onRemove,
  onUpdateQuantity,
  formatPrice,
}: {
  item: CartItem;
  level?: number;
  onRemove: (lineId: string) => void;
  onUpdateQuantity: (lineId: string, qty: number) => void;
  formatPrice: (price: number, currency?: string) => string;
}) {
  const isChild = level > 0;

  return (
    <>
      <div className={`px-4 ${isChild ? "py-2" : "py-4"}`} data-testid="cart-item">
        {/* Mobile layout */}
        <div className="md:hidden space-y-3">
          <div className="flex gap-4">
            {item.imageUrl && !isChild && (
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-20 h-20 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <Link
                href={`/produkter/${item.slug}`}
                className={`font-semibold hover:text-primary transition-colors ${
                  isChild ? "text-sm" : ""
                }`}
              >
                {item.title}
              </Link>
              <p className={`mt-1 ${isChild ? "text-sm" : ""}`}>
                {formatPrice(item.price, item.currency)}
              </p>
            </div>
            <button
              onClick={() => onRemove(item.lineId)}
              className="text-gray-500 hover:text-red-500 transition-colors p-1"
              aria-label="Fjern produkt"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateQuantity(item.lineId, item.quantity - 1)}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
                aria-label="Reduser antall"
              >
                <MinusIcon className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-medium">{item.quantity}</span>
              <button
                onClick={() => onUpdateQuantity(item.lineId, item.quantity + 1)}
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
          <div className={`col-span-6 flex items-center gap-4`}>
            {item.imageUrl && !isChild && (
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-16 h-16 object-cover rounded-lg"
              />
            )}
            <Link
              href={`/produkter/${item.slug}`}
              className={`font-semibold hover:text-primary transition-colors ${
                isChild ? "text-sm pl-10" : ""
              }`}
            >
              {item.title}
            </Link>
          </div>
          <div className="col-span-2 text-center">
            {formatPrice(item.price, item.currency)}
          </div>
          <div className="col-span-2 flex items-center justify-center gap-2">
            <button
              onClick={() => onUpdateQuantity(item.lineId, item.quantity - 1)}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
              aria-label="Reduser antall"
            >
              <MinusIcon className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-medium">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.lineId, item.quantity + 1)}
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
              onClick={() => onRemove(item.lineId)}
              className="text-gray-500 hover:text-red-500 transition-colors p-1"
              aria-label="Fjern produkt"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Render children recursively */}
      {item.children?.map((child) => (
        <CartItemRow
          key={child.lineId}
          item={child}
          level={level + 1}
          onRemove={onRemove}
          onUpdateQuantity={onUpdateQuantity}
          formatPrice={formatPrice}
        />
      ))}
    </>
  );
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalPrice } = useCart();
  const shipping = 99;

  const formatPrice = (price: number, currency: string = "NOK") => {
    return new Intl.NumberFormat("nb-NO", {
      style: "currency",
      currency: currency,
    }).format(price);
  };

  const formatTotal = (price: number, currency: string = "NOK") => {
    let sum = price + shipping;
    return formatPrice(sum, currency);
  };

  const currency = items.length > 0 ? items[0].currency : "NOK";

  // Prepare order lines for checkout - convert to nested structure with prices in øre
  const orderLines: OrderLine[] = transformCartItemsToOrderLines(items);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Handlekurv</h1>

        {items.length === 0 ? (
          <div className="bg-white shadow-md rounded-lg p-8 text-center">
            <ShoppingBagIcon className="w-16 h-16 mx-auto text-primary mb-4" />
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
                  <CartItemRow
                    key={item.lineId}
                    item={item}
                    onRemove={removeItem}
                    onUpdateQuantity={updateQuantity}
                    formatPrice={formatPrice}
                  />
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
                  <span>{formatPrice(shipping, currency)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold">
                  <span>Totalt</span>
                  <span>{formatTotal(totalPrice, currency)}</span>
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

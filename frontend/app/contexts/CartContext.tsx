"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface CartItem {
  lineId: string;              // NEW: Unique identifier for this line
  productId: string;
  title: string;
  price: number;
  currency: string;
  quantity: number;
  imageUrl?: string;
  slug: string;
  productType?: string;        // NEW: Product type (kit, tools, structure)
  requiresParent?: boolean;    // NEW: Whether this is a strukturprodukt
  requiredBoards?: number;     // NEW: How many boards recommended for kits
  children?: CartItem[];       // NEW: Nested add-ons
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity" | "lineId">) => void;
  addChildItem: (parentLineId: string, item: Omit<CartItem, "quantity" | "lineId">, quantity?: number) => void;  // NEW
  removeItem: (lineId: string) => void;  // CHANGED: Use lineId instead of productId
  updateQuantity: (lineId: string, quantity: number) => void;  // CHANGED: Use lineId
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "perle-cart";

// Helper function to generate unique line IDs
function generateLineId(): string {
  return `line-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function to calculate total items (including children)
function calculateTotalItems(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    let itemSum = item.quantity;
    if (item.children) {
      itemSum += calculateTotalItems(item.children);
    }
    return sum + itemSum;
  }, 0);
}

// Helper function to calculate total price (including children)
function calculateTotalPrice(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    let itemSum = item.price * item.quantity;
    if (item.children) {
      itemSum += calculateTotalPrice(item.children);
    }
    return sum + itemSum;
  }, 0);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);

        // Check if migration needed (old format has no lineId)
        if (parsed.length > 0 && !parsed[0].lineId) {
          const migrated = parsed.map((item: any) => ({
            ...item,
            lineId: generateLineId(),
            // Keep flat structure (no children) for old items
          }));
          setItems(migrated);
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(migrated));
        } else {
          setItems(parsed);
        }
      } catch (e) {
        console.error("Error parsing cart from localStorage:", e);
        // Clear corrupted cart
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save cart to localStorage when items change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isInitialized]);

  const addItem = useCallback((item: Omit<CartItem, "quantity" | "lineId">) => {
    setItems((prev) => {
      // For top-level items, check if identical product already exists (without children)
      // If we want to support adding same product with different children, we need unique lineIds
      const existingIndex = prev.findIndex((i) =>
        i.productId === item.productId && !i.children?.length && !item.children?.length
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      }

      return [...prev, {
        ...item,
        lineId: generateLineId(),
        quantity: 1,
        children: item.children?.map(child => ({
          ...child,
          lineId: generateLineId(),
          quantity: child.quantity || 1,
        })),
      }];
    });
  }, []);

  const addChildItem = useCallback((parentLineId: string, item: Omit<CartItem, "quantity" | "lineId">, quantity: number = 1) => {
    setItems((prev) => {
      const updated = JSON.parse(JSON.stringify(prev)); // Deep clone

      // Find parent recursively
      function findAndAddChild(items: CartItem[]): boolean {
        for (let i = 0; i < items.length; i++) {
          if (items[i].lineId === parentLineId) {
            // Found parent - add child
            if (!items[i].children) {
              items[i].children = [];
            }
            items[i].children!.push({
              ...item,
              lineId: generateLineId(),
              quantity: quantity,
            });
            return true;
          }

          // Recurse into children
          if (items[i].children && findAndAddChild(items[i].children!)) {
            return true;
          }
        }
        return false;
      }

      findAndAddChild(updated);
      return updated;
    });
  }, []);

  const removeItem = useCallback((lineId: string) => {
    setItems((prev) => {
      // Recursively remove item by lineId
      function filterItems(items: CartItem[]): CartItem[] {
        return items.filter(item => item.lineId !== lineId).map(item => ({
          ...item,
          children: item.children ? filterItems(item.children) : undefined,
        }));
      }

      return filterItems(prev);
    });
  }, []);

  const updateQuantity = useCallback((lineId: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) {
        // Remove item if quantity is 0
        function filterItems(items: CartItem[]): CartItem[] {
          return items.filter(item => item.lineId !== lineId).map(item => ({
            ...item,
            children: item.children ? filterItems(item.children) : undefined,
          }));
        }
        return filterItems(prev);
      }

      // Recursively update quantity
      function updateItems(items: CartItem[]): CartItem[] {
        return items.map((item) => {
          if (item.lineId === lineId) {
            return { ...item, quantity };
          }
          if (item.children) {
            return { ...item, children: updateItems(item.children) };
          }
          return item;
        });
      }

      return updateItems(prev);
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = calculateTotalItems(items);
  const totalPrice = calculateTotalPrice(items);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        addChildItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

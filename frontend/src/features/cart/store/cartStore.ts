/**
 * Cart store using Zustand with persistence
 * Includes stock validation and async operations
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { validateProductStock } from "../api";

export interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  imagen?: string;
  precio: number;
  stock_cantidad: number;
  disponible: boolean;
}

export interface CartItem {
  productoId: number;
  producto: Producto;
  cantidad: number;
  personalizacion: number[]; // IDs of ingredients to exclude
}

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
}

interface CartActions {
  addItem: (
    producto: Producto,
    cantidad: number,
    personalizacion?: number[],
  ) => Promise<boolean>;
  removeItem: (productoId: number) => void;
  updateQuantity: (
    productoId: number,
    cantidad: number,
  ) => Promise<boolean>;
  updateItemPersonalization: (
    productoId: number,
    personalizacion: number[],
  ) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  validateAllItemsStock: () => Promise<boolean>;
}

type CartStore = CartState & CartActions;

// Maximum items allowed in cart
const MAX_CART_ITEMS = 50;

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // State
      items: [],
      isLoading: false,
      error: null,

      // Actions
      addItem: async (producto, cantidad, personalizacion = []) => {
        const items = get().items;

        // Check cart limit
        if (items.length >= MAX_CART_ITEMS) {
          set({ error: `Maximum ${MAX_CART_ITEMS} items allowed in cart` });
          return false;
        }

        // Validate stock before adding
        set({ isLoading: true, error: null });
        try {
          const isValid = await validateProductStock(producto.id, cantidad);
          if (!isValid) {
            set({
              error: `Insufficient stock for "${producto.nombre}"`,
              isLoading: false,
            });
            return false;
          }

          const existingIndex = items.findIndex(
            (item) => item.productoId === producto.id,
          );

          // Check if adding more would exceed stock
          if (existingIndex >= 0) {
            const newQuantity = items[existingIndex].cantidad + cantidad;
            const stockValid = await validateProductStock(
              producto.id,
              newQuantity,
            );
            if (!stockValid) {
              set({
                error: `Cannot add more of "${producto.nombre}". Insufficient stock.`,
                isLoading: false,
              });
              return false;
            }
          }

          if (existingIndex >= 0) {
            // Update existing item quantity
            const newItems = [...items];
            newItems[existingIndex].cantidad += cantidad;
            set({ items: newItems, isLoading: false });
          } else {
            // Add new item
            set({
              items: [
                ...items,
                {
                  productoId: producto.id,
                  producto,
                  cantidad,
                  personalizacion,
                },
              ],
              isLoading: false,
            });
          }
          return true;
        } catch (error) {
          set({
            error: "Failed to validate stock. Please try again.",
            isLoading: false,
          });
          return false;
        }
      },

      removeItem: (productoId) => {
        set({
          items: get().items.filter((item) => item.productoId !== productoId),
          error: null,
        });
      },

      updateQuantity: async (productoId, cantidad) => {
        if (cantidad <= 0) {
          get().removeItem(productoId);
          return true;
        }

        set({ isLoading: true, error: null });
        try {
          const isValid = await validateProductStock(productoId, cantidad);
          if (!isValid) {
            set({
              error: "Insufficient stock for this quantity",
              isLoading: false,
            });
            return false;
          }

          const items = get().items.map((item) =>
            item.productoId === productoId ? { ...item, cantidad } : item,
          );
          set({ items, isLoading: false });
          return true;
        } catch (error) {
          set({
            error: "Failed to update quantity. Please try again.",
            isLoading: false,
          });
          return false;
        }
      },

      updateItemPersonalization: (productoId, personalizacion) => {
        const items = get().items.map((item) =>
          item.productoId === productoId ? { ...item, personalizacion } : item,
        );
        set({ items });
      },

      clearCart: () => {
        set({ items: [], error: null, isLoading: false });
      },

      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.producto.precio * item.cantidad,
          0,
        );
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.cantidad, 0);
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setError: (error) => {
        set({ error });
      },

      validateAllItemsStock: async () => {
        set({ isLoading: true, error: null });
        try {
          for (const item of get().items) {
            const isValid = await validateProductStock(
              item.productoId,
              item.cantidad,
            );
            if (!isValid) {
              set({
                error: `Item "${item.producto.nombre}" is no longer available in requested quantity`,
                isLoading: false,
              });
              return false;
            }
          }
          set({ isLoading: false });
          return true;
        } catch (error) {
          set({
            error: "Failed to validate cart. Please try again.",
            isLoading: false,
          });
          return false;
        }
      },
    }),
    {
      name: "food-store-cart",
      partialize: (state) => ({
        items: state.items,
      }),
    },
  ),
);
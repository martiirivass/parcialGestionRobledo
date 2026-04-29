/**
 * Cart store using Zustand with persistence
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
}

interface CartActions {
  addItem: (producto: Producto, cantidad: number, personalizacion?: number[]) => void;
  removeItem: (productoId: number) => void;
  updateQuantity: (productoId: number, cantidad: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

type CartStore = CartState & CartActions;

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // State
      items: [],
      
      // Actions
      addItem: (producto, cantidad, personalizacion = []) => {
        const items = get().items;
        const existingIndex = items.findIndex(
          (item) => item.productoId === producto.id
        );
        
        if (existingIndex >= 0) {
          // Update existing item quantity
          const newItems = [...items];
          newItems[existingIndex].cantidad += cantidad;
          set({ items: newItems });
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
          });
        }
      },
      
      removeItem: (productoId) => {
        set({
          items: get().items.filter((item) => item.productoId !== productoId),
        });
      },
      
      updateQuantity: (productoId, cantidad) => {
        const items = get().items.map((item) =>
          item.productoId === productoId ? { ...item, cantidad } : item
        );
        set({ items });
      },
      
      clearCart: () => {
        set({ items: [] });
      },
      
      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.producto.precio * item.cantidad,
          0
        );
      },
      
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.cantidad, 0);
      },
    }),
    {
      name: 'food-store-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
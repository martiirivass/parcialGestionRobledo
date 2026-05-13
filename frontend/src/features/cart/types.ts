/**
 * Type definitions for the Cart module
 */

/**
 * Product information stored in cart items
 */
export interface CartProducto {
  id: number;
  nombre: string;
  descripcion?: string;
  imagen?: string;
  precio: number;
  stock_cantidad: number;
  disponible: boolean;
}

/**
 * Single item in the shopping cart
 */
export interface CartItem {
  productoId: number;
  producto: CartProducto;
  cantidad: number;
  personalizacion: number[]; // IDs of ingredients to exclude
}

/**
 * Cart state managed by Zustand
 */
export interface CartState {
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Cart actions/methods
 */
export interface CartActions {
  addItem: (
    producto: CartProducto,
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

/**
 * Complete cart store type
 */
export type CartStore = CartState & CartActions;

/**
 * Summary information for cart checkout
 */
export interface CartSummary {
  itemCount: number;
  subtotal: number;
  shipping: number;
  total: number;
  items: CartItem[];
}

/**
 * Props for CartItem component
 */
export interface CartItemProps {
  item: CartItem;
  onUpdateQuantity: (productoId: number, cantidad: number) => void;
  onRemove: (productoId: number) => void;
  onUpdatePersonalization?: (
    productoId: number,
    personalizacion: number[],
  ) => void;
}

/**
 * Props for CartSummary component
 */
export interface CartSummaryProps {
  subtotal: number;
  itemCount: number;
  onCheckout?: () => void;
}

/**
 * Props for EmptyCart component
 */
export interface EmptyCartProps {
  onContinueShopping?: () => void;
}

/**
 * Props for CartPage component
 */
export interface CartPageProps {
  // CartPage is a page component that uses the store directly
}
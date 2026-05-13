/**
 * Cart Zustand store tests
 * Tests cart operations, stock validation, and persistence
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { useCartStore } from "../src/features/cart/store/cartStore";

// Mock the API module
vi.mock("../src/features/cart/api", () => ({
  validateProductStock: vi.fn(),
}));

import { validateProductStock } from "../src/features/cart/api";

const mockedValidateProductStock = vi.mocked(validateProductStock);

describe("Cart Store", () => {
  // Sample product for testing
  const testProduct = {
    id: 1,
    nombre: "Test Product",
    descripcion: "A test product",
    imagen: "https://example.com/image.jpg",
    precio: 100,
    stock_cantidad: 10,
    disponible: true,
  };

  beforeEach(() => {
    // Reset store to initial state
    useCartStore.setState({
      items: [],
      isLoading: false,
      error: null,
    });

    // Clear mocks
    vi.clearAllMocks();
  });

  describe("Initialization", () => {
    it("should have correct initial state", () => {
      const store = useCartStore.getState();

      expect(store.items).toEqual([]);
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
    });
  });

  describe("addItem", () => {
    it("should add a new item to the cart", async () => {
      mockedValidateProductStock.mockResolvedValue(true);

      const store = useCartStore.getState();
      const result = await store.addItem(testProduct, 2, []);

      expect(result).toBe(true);
      expect(useCartStore.getState().items).toHaveLength(1);
      expect(useCartStore.getState().items[0].productoId).toBe(1);
      expect(useCartStore.getState().items[0].cantidad).toBe(2);
    });

    it("should increase quantity when adding existing product", async () => {
      mockedValidateProductStock.mockResolvedValue(true);

      const store = useCartStore.getState();
      await store.addItem(testProduct, 1, []);
      await store.addItem(testProduct, 2, []);

      expect(useCartStore.getState().items).toHaveLength(1);
      expect(useCartStore.getState().items[0].cantidad).toBe(3);
    });

    it("should reject adding when stock is insufficient", async () => {
      mockedValidateProductStock.mockResolvedValue(false);

      const store = useCartStore.getState();
      const result = await store.addItem(testProduct, 5, []);

      expect(result).toBe(false);
      expect(useCartStore.getState().error).toBe(
        'Insufficient stock for "Test Product"',
      );
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it("should reject when cart limit is exceeded", async () => {
      mockedValidateProductStock.mockResolvedValue(true);

      const store = useCartStore.getState();

      // Add 50 products (cart limit)
      for (let i = 0; i < 50; i++) {
        await store.addItem({ ...testProduct, id: i }, 1, []);
      }

      // Try to add 51st
      const result = await store.addItem(
        { ...testProduct, id: 999 },
        1,
        [],
      );

      expect(result).toBe(false);
      expect(useCartStore.getState().error).toContain("Maximum 50 items");
    });

    it("should include personalization", async () => {
      mockedValidateProductStock.mockResolvedValue(true);

      const store = useCartStore.getState();
      await store.addItem(testProduct, 1, [1, 2, 3]);

      expect(useCartStore.getState().items[0].personalizacion).toEqual([
        1, 2, 3,
      ]);
    });
  });

  describe("removeItem", () => {
    it("should remove an item from the cart", async () => {
      mockedValidateProductStock.mockResolvedValue(true);

      const store = useCartStore.getState();
      await store.addItem(testProduct, 1, []);
      expect(useCartStore.getState().items).toHaveLength(1);

      store.removeItem(1);
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it("should not affect other items when removing one", async () => {
      mockedValidateProductStock.mockResolvedValue(true);

      const store = useCartStore.getState();
      await store.addItem(testProduct, 1, []);
      await store.addItem({ ...testProduct, id: 2, nombre: "Product 2" }, 1, []);
      expect(useCartStore.getState().items).toHaveLength(2);

      store.removeItem(1);
      expect(useCartStore.getState().items).toHaveLength(1);
      expect(useCartStore.getState().items[0].productoId).toBe(2);
    });
  });

  describe("updateQuantity", () => {
    it("should update item quantity", async () => {
      mockedValidateProductStock.mockResolvedValue(true);

      const store = useCartStore.getState();
      await store.addItem(testProduct, 1, []);

      const result = await store.updateQuantity(1, 5);
      expect(result).toBe(true);
      expect(useCartStore.getState().items[0].cantidad).toBe(5);
    });

    it("should remove item when quantity is set to 0", async () => {
      mockedValidateProductStock.mockResolvedValue(true);

      const store = useCartStore.getState();
      await store.addItem(testProduct, 1, []);

      await store.updateQuantity(1, 0);
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it("should reject when stock is insufficient", async () => {
      mockedValidateProductStock.mockResolvedValue(false);

      const store = useCartStore.getState();
      await store.addItem(testProduct, 1, []);

      const result = await store.updateQuantity(1, 100);
      expect(result).toBe(false);
      expect(useCartStore.getState().error).toContain("Insufficient stock");
    });
  });

  describe("updateItemPersonalization", () => {
    it("should update item personalization", () => {
      const store = useCartStore.getState();

      // Add item directly to state
      store.addItem({ addItem: () => {} } as never, 0, []);
      useCartStore.setState({
        items: [
          {
            productoId: 1,
            producto: testProduct,
            cantidad: 1,
            personalizacion: [],
          },
        ],
      });

      store.updateItemPersonalization(1, [1, 2]);
      expect(useCartStore.getState().items[0].personalizacion).toEqual([1, 2]);
    });
  });

  describe("clearCart", () => {
    it("should remove all items from cart", async () => {
      mockedValidateProductStock.mockResolvedValue(true);

      const store = useCartStore.getState();
      await store.addItem(testProduct, 1, []);
      await store.addItem({ ...testProduct, id: 2 }, 2, []);

      expect(useCartStore.getState().items).toHaveLength(2);

      store.clearCart();
      expect(useCartStore.getState().items).toHaveLength(0);
      expect(useCartStore.getState().error).toBeNull();
    });
  });

  describe("getTotal", () => {
    it("should calculate correct total", async () => {
      mockedValidateProductStock.mockResolvedValue(true);

      const store = useCartStore.getState();
      await store.addItem({ ...testProduct, precio: 100 }, 2, []);
      await store.addItem({ ...testProduct, id: 2, precio: 50 }, 3, []);

      // 2 * 100 + 3 * 50 = 350
      expect(store.getTotal()).toBe(350);
    });

    it("should return 0 for empty cart", () => {
      const store = useCartStore.getState();
      expect(store.getTotal()).toBe(0);
    });
  });

  describe("getItemCount", () => {
    it("should return correct item count", async () => {
      mockedValidateProductStock.mockResolvedValue(true);

      const store = useCartStore.getState();
      await store.addItem(testProduct, 3, []);
      await store.addItem({ ...testProduct, id: 2 }, 2, []);

      expect(store.getItemCount()).toBe(5);
    });

    it("should return 0 for empty cart", () => {
      const store = useCartStore.getState();
      expect(store.getItemCount()).toBe(0);
    });
  });

  describe("Setters", () => {
    it("setLoading should update isLoading state", () => {
      const store = useCartStore.getState();

      store.setLoading(true);
      expect(useCartStore.getState().isLoading).toBe(true);

      store.setLoading(false);
      expect(useCartStore.getState().isLoading).toBe(false);
    });

    it("setError should update error state", () => {
      const store = useCartStore.getState();

      store.setError("Test error");
      expect(useCartStore.getState().error).toBe("Test error");

      store.setError(null);
      expect(useCartStore.getState().error).toBeNull();
    });
  });

  describe("validateAllItemsStock", () => {
    it("should return true when all items are valid", async () => {
      mockedValidateProductStock.mockResolvedValue(true);

      const store = useCartStore.getState();
      useCartStore.setState({
        items: [
          { productoId: 1, producto: testProduct, cantidad: 2, personalizacion: [] },
        ],
      });

      const result = await store.validateAllItemsStock();
      expect(result).toBe(true);
      expect(useCartStore.getState().isLoading).toBe(false);
    });

    it("should return false when any item is invalid", async () => {
      mockedValidateProductStock.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

      const store = useCartStore.getState();
      useCartStore.setState({
        items: [
          { productoId: 1, producto: testProduct, cantidad: 2, personalizacion: [] },
          { productoId: 2, producto: { ...testProduct, id: 2 }, cantidad: 1, personalizacion: [] },
        ],
      });

      const result = await store.validateAllItemsStock();
      expect(result).toBe(false);
      expect(useCartStore.getState().error).toContain("no longer available");
    });
  });
});
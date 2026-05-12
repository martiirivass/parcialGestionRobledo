/**
 * Products Zustand store tests
 * Tests initialization, setters, and API integration
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import useProductsStore from "../src/features/products/store/productsStore";
import * as api from "../src/features/products/api";

// Mock the API module
vi.mock("../src/features/products/api");

describe("Products Store", () => {
  beforeEach(() => {
    // Reset store to initial state
    useProductsStore.setState({
      products: [],
      currentProduct: null,
      isLoading: false,
      error: null,
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    });

    // Clear mocks
    vi.clearAllMocks();
  });

  describe("Initialization", () => {
    it("should have correct initial state", () => {
      const store = useProductsStore.getState();

      expect(store.products).toEqual([]);
      expect(store.currentProduct).toBeNull();
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
      expect(store.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      });
    });
  });

  describe("Setters", () => {
    it("setLoading should update isLoading state", () => {
      const store = useProductsStore.getState();

      store.setLoading(true);
      expect(useProductsStore.getState().isLoading).toBe(true);

      store.setLoading(false);
      expect(useProductsStore.getState().isLoading).toBe(false);
    });

    it("setError should update error state", () => {
      const store = useProductsStore.getState();

      store.setError("Test error");
      expect(useProductsStore.getState().error).toBe("Test error");

      store.setError(null);
      expect(useProductsStore.getState().error).toBeNull();
    });

    it("setCurrentProduct should update currentProduct state", () => {
      const store = useProductsStore.getState();
      const mockProduct = {
        id: "1",
        nombre: "Test Product",
        precio: "100.00",
        disponible: true,
        categorias: [],
        ingredientes: [],
        creado_en: "2026-05-11T00:00:00Z",
      };

      store.setCurrentProduct(mockProduct);
      expect(useProductsStore.getState().currentProduct).toEqual(mockProduct);

      store.setCurrentProduct(null);
      expect(useProductsStore.getState().currentProduct).toBeNull();
    });

    it("setPagination should update pagination state", () => {
      const store = useProductsStore.getState();
      const newPagination = {
        page: 2,
        limit: 20,
        total: 100,
        totalPages: 5,
      };

      store.setPagination(newPagination);
      expect(useProductsStore.getState().pagination).toEqual(newPagination);
    });

    it("clearProducts should reset store to initial state", () => {
      const store = useProductsStore.getState();

      // Pollute state
      store.setLoading(true);
      store.setError("Some error");
      store.setCurrentProduct({
        id: "1",
        nombre: "Test",
        precio: "100.00",
        disponible: true,
        categorias: [],
        ingredientes: [],
        creado_en: "2026-05-11T00:00:00Z",
      });

      store.clearProducts();

      const state = useProductsStore.getState();
      expect(state.products).toEqual([]);
      expect(state.currentProduct).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe("fetchProducts", () => {
    it("should fetch products and update state correctly", async () => {
      const mockResponse = {
        data: [
          {
            id: "1",
            nombre: "Product 1",
            precio: "50.00",
            disponible: true,
            categorias: [],
            ingredientes: [],
            creado_en: "2026-05-11T00:00:00Z",
          },
          {
            id: "2",
            nombre: "Product 2",
            precio: "75.00",
            disponible: true,
            categorias: [],
            ingredientes: [],
            creado_en: "2026-05-11T00:00:00Z",
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      };

      (api.getProducts as any).mockResolvedValue(mockResponse);

      const store = useProductsStore.getState();
      await store.fetchProducts();

      const state = useProductsStore.getState();
      expect(state.products).toEqual(mockResponse.data);
      expect(state.pagination).toEqual(mockResponse.pagination);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("should set loading state during fetch", async () => {
      (api.getProducts as any).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  data: [],
                  pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
                }),
              10,
            ),
          ),
      );

      const store = useProductsStore.getState();
      const fetchPromise = store.fetchProducts();

      expect(useProductsStore.getState().isLoading).toBe(true);

      await fetchPromise;
      expect(useProductsStore.getState().isLoading).toBe(false);
    });

    it("should handle API errors correctly", async () => {
      const errorMessage = "API Error";
      (api.getProducts as any).mockRejectedValue(new Error(errorMessage));

      const store = useProductsStore.getState();
      await store.fetchProducts();

      const state = useProductsStore.getState();
      expect(state.error).toBe(errorMessage);
      expect(state.isLoading).toBe(false);
      expect(state.products).toEqual([]);
    });

    it("should pass filters to API", async () => {
      const mockResponse = {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      };

      (api.getProducts as any).mockResolvedValue(mockResponse);

      const store = useProductsStore.getState();
      const filters = {
        page: 2,
        limit: 20,
        categoria_id: "cat-1",
        search: "pasta",
      };

      await store.fetchProducts(filters);

      expect(api.getProducts).toHaveBeenCalledWith(filters);
    });
  });

  describe("fetchProductById", () => {
    it("should fetch product by ID and update currentProduct", async () => {
      const mockProduct = {
        id: "1",
        nombre: "Product 1",
        precio: "100.00",
        disponible: true,
        categorias: [{ id: "cat-1", nombre: "Pasta" }],
        ingredientes: [{ id: "ing-1", nombre: "Tomate", es_alergeno: false }],
        creado_en: "2026-05-11T00:00:00Z",
      };

      (api.getProductById as any).mockResolvedValue(mockProduct);

      const store = useProductsStore.getState();
      await store.fetchProductById("1");

      const state = useProductsStore.getState();
      expect(state.currentProduct).toEqual(mockProduct);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("should set loading state during fetch", async () => {
      (api.getProductById as any).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  id: "1",
                  nombre: "Product",
                  precio: "100.00",
                  disponible: true,
                  categorias: [],
                  ingredientes: [],
                  creado_en: "2026-05-11T00:00:00Z",
                }),
              10,
            ),
          ),
      );

      const store = useProductsStore.getState();
      const fetchPromise = store.fetchProductById("1");

      expect(useProductsStore.getState().isLoading).toBe(true);

      await fetchPromise;
      expect(useProductsStore.getState().isLoading).toBe(false);
    });

    it("should handle API errors and clear currentProduct", async () => {
      const errorMessage = "Product not found";
      (api.getProductById as any).mockRejectedValue(new Error(errorMessage));

      const store = useProductsStore.getState();
      await store.fetchProductById("1");

      const state = useProductsStore.getState();
      expect(state.error).toBe(errorMessage);
      expect(state.isLoading).toBe(false);
      expect(state.currentProduct).toBeNull();
    });

    it("should call API with correct product ID", async () => {
      const mockProduct = {
        id: "prod-123",
        nombre: "Product",
        precio: "100.00",
        disponible: true,
        categorias: [],
        ingredientes: [],
        creado_en: "2026-05-11T00:00:00Z",
      };

      (api.getProductById as any).mockResolvedValue(mockProduct);

      const store = useProductsStore.getState();
      await store.fetchProductById("prod-123");

      expect(api.getProductById).toHaveBeenCalledWith("prod-123");
    });
  });
});

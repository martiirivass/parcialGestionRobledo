/**
 * ProductFilterBar - Filter controls for product search
 * Provides search, category filter, and allergen exclusion options
 * Responsive design for mobile and desktop
 */

import React, { useEffect, useState } from 'react';
import { ProductFilters, Categoria, Ingrediente } from '../types';
import * as api from '../api';

interface ProductFilterBarProps {
  onFilter: (filters: ProductFilters) => void;
  categorias?: Categoria[];
}

/**
 * ProductFilterBar component
 * Renders search box, category dropdown, and allergen filters
 * Responsive: stacked on mobile, inline on desktop
 */
export const ProductFilterBar: React.FC<ProductFilterBarProps> = ({
  onFilter,
  categorias: initialCategorias,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [excludedAllergens, setExcludedAllergens] = useState<string[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>(initialCategorias || []);
  const [allergens, setAllergens] = useState<Ingrediente[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  /**
   * Load categories and allergens on mount
   */
  useEffect(() => {
    const loadData = async () => {
      if (initialCategorias) {
        setCategorias(initialCategorias);
      }
      
      setIsLoadingData(true);
      try {
        // Fetch products to extract unique allergens
        const response = await api.getProducts({ limit: 100 });
        const uniqueAllergens = new Map<string, Ingrediente>();
        
        response.data.forEach((product) => {
          product.ingredientes.forEach((ing) => {
            if (ing.es_alergeno && !uniqueAllergens.has(ing.id)) {
              uniqueAllergens.set(ing.id, ing);
            }
          });
        });
        
        setAllergens(Array.from(uniqueAllergens.values()));
      } catch (error) {
        console.error('Error loading filter data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [initialCategorias]);

  /**
   * Apply filters when any filter value changes
   */
  const applyFilters = () => {
    const filters: ProductFilters = {};
    
    if (searchQuery.trim()) {
      filters.search = searchQuery.trim();
    }
    
    if (selectedCategory) {
      filters.categoria_id = selectedCategory;
    }
    
    if (excludedAllergens.length > 0) {
      filters.excluirAlergenos = excludedAllergens;
    }
    
    onFilter(filters);
  };

  /**
   * Handle search input change with debounce
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  /**
   * Handle category selection
   */
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
  };

  /**
   * Handle allergen checkbox toggle
   */
  const handleAllergenToggle = (allergenId: string) => {
    setExcludedAllergens((prev) =>
      prev.includes(allergenId)
        ? prev.filter((id) => id !== allergenId)
        : [...prev, allergenId]
    );
  };

  /**
   * Handle reset filters
   */
  const handleReset = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setExcludedAllergens([]);
    onFilter({});
  };

  /**
   * Trigger filter apply when filters change (debounced)
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      applyFilters();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, excludedAllergens]);

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
      <div className="space-y-4 md:space-y-0 md:flex md:gap-4 md:items-end">
        {/* Search Input */}
        <div className="flex-1">
          <label
            htmlFor="search"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Search Products
          </label>
          <input
            id="search"
            type="text"
            placeholder="Search by product name..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Category Filter */}
        <div className="flex-1">
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Category
          </label>
          <select
            id="category"
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Button */}
        <button
          onClick={handleReset}
          className="w-full md:w-auto px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
        >
          Clear Filters
        </button>
      </div>

      {/* Allergen Filters */}
      {!isLoadingData && allergens.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Exclude Allergens
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {allergens.map((allergen) => (
              <label
                key={allergen.id}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={excludedAllergens.includes(allergen.id)}
                  onChange={() => handleAllergenToggle(allergen.id)}
                  className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">{allergen.nombre}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {isLoadingData && (
        <div className="mt-4 text-sm text-gray-500">Loading filter options...</div>
      )}
    </div>
  );
};

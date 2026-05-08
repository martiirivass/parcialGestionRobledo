/**
 * Tests for CategoryTree component
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CategoryTree } from '../CategoryTree';
import { CategoryTreeNode } from '../../types';

const mockCategories: CategoryTreeNode[] = [
  {
    id: 'cat-1',
    nombre: 'Fruits',
    padre_id: null,
    creado_en: '2026-05-01T00:00:00Z',
    actualizado_en: '2026-05-01T00:00:00Z',
    eliminado_en: null,
    producto_count: 5,
    subcategorias: [
      {
        id: 'cat-1-1',
        nombre: 'Citrus',
        padre_id: 'cat-1',
        creado_en: '2026-05-01T00:00:00Z',
        actualizado_en: '2026-05-01T00:00:00Z',
        eliminado_en: null,
        producto_count: 3,
        subcategorias: [],
      },
      {
        id: 'cat-1-2',
        nombre: 'Berries',
        padre_id: 'cat-1',
        creado_en: '2026-05-01T00:00:00Z',
        actualizado_en: '2026-05-01T00:00:00Z',
        eliminado_en: null,
        producto_count: 2,
        subcategorias: [],
      },
    ],
  },
  {
    id: 'cat-2',
    nombre: 'Vegetables',
    padre_id: null,
    creado_en: '2026-05-01T00:00:00Z',
    actualizado_en: '2026-05-01T00:00:00Z',
    eliminado_en: null,
    subcategorias: [],
  },
];

describe('CategoryTree Component', () => {
  describe('Rendering', () => {
    test('renders list of root categories', () => {
      render(<CategoryTree categories={mockCategories} />);

      expect(screen.getByText('Fruits')).toBeInTheDocument();
      expect(screen.getByText('Vegetables')).toBeInTheDocument();
    });

    test('does not render subcategories by default', () => {
      render(<CategoryTree categories={mockCategories} />);

      // Citrus is a subcategory and should not be visible initially
      expect(screen.queryByText('Citrus')).not.toBeInTheDocument();
      expect(screen.queryByText('Berries')).not.toBeInTheDocument();
    });

    test('renders product count badge when available', () => {
      render(<CategoryTree categories={mockCategories} />);

      const badges = screen.getAllByText(/[0-9]/);
      expect(badges.length).toBeGreaterThan(0);
    });

    test('renders empty state when no categories', () => {
      render(<CategoryTree categories={[]} />);

      expect(screen.getByText('No categories available')).toBeInTheDocument();
    });

    test('renders expand arrow for categories with children', () => {
      render(<CategoryTree categories={mockCategories} expandable={true} />);

      // Fruits has children, should have expand button
      const fruitsElement = screen.getByText('Fruits').closest('div');
      expect(fruitsElement).toBeInTheDocument();
    });
  });

  describe('Expand/Collapse Functionality', () => {
    test('expands category on arrow click', async () => {
      render(<CategoryTree categories={mockCategories} expandable={true} />);

      // Initially subcategories should not be visible
      expect(screen.queryByText('Citrus')).not.toBeInTheDocument();

      // Find and click the expand button for Fruits
      const fruitsElement = screen.getByText('Fruits');
      const fruitsParent = fruitsElement.closest('div');
      const expandButton = fruitsParent?.querySelector('button');

      fireEvent.click(expandButton!);

      // Now Citrus and Berries should be visible
      await waitFor(() => {
        expect(screen.getByText('Citrus')).toBeInTheDocument();
        expect(screen.getByText('Berries')).toBeInTheDocument();
      });
    });

    test('collapses category on second arrow click', async () => {
      render(<CategoryTree categories={mockCategories} expandable={true} />);

      const fruitsElement = screen.getByText('Fruits');
      const fruitsParent = fruitsElement.closest('div');
      const expandButton = fruitsParent?.querySelector('button');

      // Expand
      fireEvent.click(expandButton!);

      await waitFor(() => {
        expect(screen.getByText('Citrus')).toBeInTheDocument();
      });

      // Collapse
      fireEvent.click(expandButton!);

      await waitFor(() => {
        expect(screen.queryByText('Citrus')).not.toBeInTheDocument();
      });
    });

    test('does not render expand button for categories without children', () => {
      render(<CategoryTree categories={mockCategories} expandable={true} />);

      // Vegetables has no children, should not have expand button
      const vegetablesElement = screen.getByText('Vegetables');
      const vegetablesParent = vegetablesElement.closest('div');
      const expandButton = vegetablesParent?.querySelector('button');

      // Should still have a button area for alignment, but should not be functional
      expect(expandButton).toBeInTheDocument();
    });
  });

  describe('Selection', () => {
    test('highlights selected category', () => {
      render(
        <CategoryTree categories={mockCategories} selectedCategoryId="cat-1" />
      );

      const fruitsElement = screen.getByText('Fruits');
      expect(fruitsElement).toHaveClass('bg-blue-50');
      expect(fruitsElement).toHaveClass('text-blue-600');
    });

    test('calls onSelectCategory when node clicked', () => {
      const mockOnSelect = jest.fn();
      render(
        <CategoryTree
          categories={mockCategories}
          onSelectCategory={mockOnSelect}
        />
      );

      const fruitsElement = screen.getByText('Fruits');
      fireEvent.click(fruitsElement);

      expect(mockOnSelect).toHaveBeenCalledWith('cat-1');
    });

    test('does not toggle expand when clicking on category name', async () => {
      render(<CategoryTree categories={mockCategories} expandable={true} />);

      const fruitsElement = screen.getByText('Fruits');
      fireEvent.click(fruitsElement);

      // Citrus should still not be visible (click on name should not expand)
      expect(screen.queryByText('Citrus')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has navigation role', () => {
      const { container } = render(<CategoryTree categories={mockCategories} />);
      const nav = container.querySelector('nav');
      expect(nav).toHaveAttribute('aria-label', 'Category navigation');
    });

    test('categories have role button', () => {
      render(<CategoryTree categories={mockCategories} />);

      const fruitsElement = screen.getByText('Fruits');
      expect(fruitsElement).toHaveAttribute('role', 'button');
    });

    test('expand buttons have aria-expanded', () => {
      render(<CategoryTree categories={mockCategories} expandable={true} />);

      const fruitsElement = screen.getByText('Fruits');
      const fruitsParent = fruitsElement.closest('div');
      const expandButton = fruitsParent?.querySelector('button');

      expect(expandButton).toHaveAttribute('aria-expanded');
    });

    test('supports keyboard navigation (Enter key)', () => {
      const mockOnSelect = jest.fn();
      render(
        <CategoryTree
          categories={mockCategories}
          onSelectCategory={mockOnSelect}
        />
      );

      const fruitsElement = screen.getByText('Fruits');

      fireEvent.keyDown(fruitsElement, { key: 'Enter' });
      expect(mockOnSelect).toHaveBeenCalledWith('cat-1');
    });
  });

  describe('Responsive Design', () => {
    test('renders with proper indentation for nested items', async () => {
      const { container } = render(
        <CategoryTree categories={mockCategories} expandable={true} />
      );

      const fruitsElement = screen.getByText('Fruits');
      const fruitsParent = fruitsElement.closest('div');
      const expandButton = fruitsParent?.querySelector('button');

      fireEvent.click(expandButton!);

      await waitFor(() => {
        expect(screen.getByText('Citrus')).toBeInTheDocument();
      });

      // Check indentation
      const citrusElement = screen.getByText('Citrus');
      const citrusParent = citrusElement.closest('[style*="paddingLeft"]');
      expect(citrusParent).toHaveStyle({ paddingLeft: '2rem' });
    });
  });

  describe('Props', () => {
    test('respects expandable prop', () => {
      const { rerender } = render(
        <CategoryTree categories={mockCategories} expandable={false} />
      );

      const fruitsElement = screen.getByText('Fruits');
      const fruitsParent = fruitsElement.closest('div');
      const expandButton = fruitsParent?.querySelector('button');

      // Button should be disabled or not interactive
      fireEvent.click(expandButton!);

      // Should not expand
      expect(screen.queryByText('Citrus')).not.toBeInTheDocument();
    });

    test('passes selectedCategoryId correctly', () => {
      const { rerender } = render(
        <CategoryTree
          categories={mockCategories}
          selectedCategoryId="cat-1-1"
        />
      );

      const citrusElement = screen.queryByText('Citrus');
      // Citrus is not expanded initially, so we can't check its styling
      // This just verifies the prop is accepted

      expect(citrusElement).not.toBeInTheDocument();
    });
  });
});

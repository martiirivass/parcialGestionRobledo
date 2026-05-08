/**
 * CategoryTree Component Tests
 * Unit and integration tests for recursive category rendering
 */
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryTree } from '../CategoryTree';
import { CategoryTreeNode } from '../../types';

// Mock category data
const mockCategories: CategoryTreeNode[] = [
  {
    id: 'cat-1',
    nombre: 'Fruits',
    padre_id: null,
    creado_en: '2024-01-01T00:00:00Z',
    actualizado_en: '2024-01-01T00:00:00Z',
    eliminado_en: null,
    subcategorias: [
      {
        id: 'cat-2',
        nombre: 'Citrus',
        padre_id: 'cat-1',
        creado_en: '2024-01-01T00:00:00Z',
        actualizado_en: '2024-01-01T00:00:00Z',
        eliminado_en: null,
        subcategorias: [
          {
            id: 'cat-3',
            nombre: 'Oranges',
            padre_id: 'cat-2',
            creado_en: '2024-01-01T00:00:00Z',
            actualizado_en: '2024-01-01T00:00:00Z',
            eliminado_en: null,
            subcategorias: [],
          },
        ],
      },
      {
        id: 'cat-4',
        nombre: 'Tropical',
        padre_id: 'cat-1',
        creado_en: '2024-01-01T00:00:00Z',
        actualizado_en: '2024-01-01T00:00:00Z',
        eliminado_en: null,
        subcategorias: [],
      },
    ],
  },
  {
    id: 'cat-5',
    nombre: 'Vegetables',
    padre_id: null,
    creado_en: '2024-01-01T00:00:00Z',
    actualizado_en: '2024-01-01T00:00:00Z',
    eliminado_en: null,
    subcategorias: [],
  },
];

describe('CategoryTree', () => {
  describe('Rendering', () => {
    it('should render list of categories', () => {
      render(
        <CategoryTree
          categories={mockCategories}
          expandable={true}
        />
      );

      expect(screen.getByText('Fruits')).toBeInTheDocument();
      expect(screen.getByText('Vegetables')).toBeInTheDocument();
    });

    it('should render empty state when no categories provided', () => {
      render(<CategoryTree categories={[]} />);

      expect(screen.getByText('No categories available')).toBeInTheDocument();
    });

    it('should render subcategories when parent is expanded', () => {
      render(
        <CategoryTree
          categories={mockCategories}
          expandable={true}
        />
      );

      // Root categories should be expanded by default
      expect(screen.getByText('Citrus')).toBeInTheDocument();
      expect(screen.getByText('Tropical')).toBeInTheDocument();
    });

    it('should not render deeply nested categories initially', () => {
      render(
        <CategoryTree
          categories={mockCategories}
          expandable={true}
        />
      );

      // Oranges (level 2) should be hidden initially
      const orangesElement = screen.queryByText('Oranges');
      expect(orangesElement).not.toBeInTheDocument();
    });

    it('should have proper navigation role', () => {
      const { container } = render(
        <CategoryTree categories={mockCategories} />
      );

      const nav = container.querySelector('[role="navigation"]');
      expect(nav).toBeInTheDocument();
      expect(nav).toHaveAttribute('aria-label', 'Categories');
    });
  });

  describe('Expand/Collapse Behavior', () => {
    it('should expand category on expand button click', async () => {
      render(
        <CategoryTree
          categories={mockCategories}
          expandable={true}
        />
      );

      const citrusItem = screen.getByText('Citrus');
      const expandButton = citrusItem.parentElement?.querySelector('button');

      expect(screen.queryByText('Oranges')).not.toBeInTheDocument();

      fireEvent.click(expandButton!);

      expect(screen.getByText('Oranges')).toBeInTheDocument();
    });

    it('should collapse category on expand button click', async () => {
      render(
        <CategoryTree
          categories={mockCategories}
          expandable={true}
        />
      );

      const citrusItem = screen.getByText('Citrus');
      const expandButton = citrusItem.parentElement?.querySelector('button');

      // First expand
      fireEvent.click(expandButton!);
      expect(screen.getByText('Oranges')).toBeInTheDocument();

      // Then collapse
      fireEvent.click(expandButton!);
      expect(screen.queryByText('Oranges')).not.toBeInTheDocument();
    });

    it('should have arrow icon rotation animation', () => {
      const { container } = render(
        <CategoryTree
          categories={mockCategories}
          expandable={true}
        />
      );

      const expandButtons = container.querySelectorAll('button');
      expect(expandButtons.length).toBeGreaterThan(0);

      const svg = expandButtons[0].querySelector('svg');
      expect(svg).toHaveClass('transition-transform');
    });

    it('should not show expand button for categories without children', () => {
      const leafCategory: CategoryTreeNode[] = [
        {
          id: 'cat-leaf',
          nombre: 'Leaf Category',
          padre_id: null,
          creado_en: '2024-01-01T00:00:00Z',
          actualizado_en: '2024-01-01T00:00:00Z',
          eliminado_en: null,
          subcategorias: [],
        },
      ];

      const { container } = render(
        <CategoryTree
          categories={leafCategory}
          expandable={true}
        />
      );

      // Should have one expand button (for the root level), but the leaf category shouldn't have one
      const buttons = container.querySelectorAll('[role="treeitem"] button');
      expect(buttons.length).toBe(0);
    });
  });

  describe('Selection', () => {
    it('should call onSelectCategory when category is clicked', async () => {
      const handleSelect = jest.fn();

      render(
        <CategoryTree
          categories={mockCategories}
          onSelectCategory={handleSelect}
          expandable={true}
        />
      );

      const fruitsItem = screen.getByText('Fruits');
      fireEvent.click(fruitsItem);

      expect(handleSelect).toHaveBeenCalledWith('cat-1');
    });

    it('should highlight selected category', () => {
      render(
        <CategoryTree
          categories={mockCategories}
          selectedCategoryId="cat-1"
          expandable={true}
        />
      );

      const fruitsItem = screen.getByText('Fruits');
      expect(fruitsItem).toHaveClass('bg-blue-50', 'text-blue-600');
    });

    it('should not highlight non-selected categories', () => {
      render(
        <CategoryTree
          categories={mockCategories}
          selectedCategoryId="cat-1"
          expandable={true}
        />
      );

      const vegetablesItem = screen.getByText('Vegetables');
      expect(vegetablesItem).not.toHaveClass('bg-blue-50');
    });

    it('should update highlighting when selectedCategoryId changes', () => {
      const { rerender } = render(
        <CategoryTree
          categories={mockCategories}
          selectedCategoryId="cat-1"
          expandable={true}
        />
      );

      const fruitsItem = screen.getByText('Fruits');
      expect(fruitsItem).toHaveClass('bg-blue-50');

      rerender(
        <CategoryTree
          categories={mockCategories}
          selectedCategoryId="cat-5"
          expandable={true}
        />
      );

      expect(fruitsItem).not.toHaveClass('bg-blue-50');
      const vegetablesItem = screen.getByText('Vegetables');
      expect(vegetablesItem).toHaveClass('bg-blue-50');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should expand on ArrowRight key when collapsed', async () => {
      render(
        <CategoryTree
          categories={mockCategories}
          expandable={true}
        />
      );

      const citrusItem = screen.getByText('Citrus');
      const citrusContainer = citrusItem.closest('[role="treeitem"]');

      // Collapse first
      const expandButton = citrusContainer?.querySelector('button');
      fireEvent.click(expandButton!);
      expect(screen.queryByText('Oranges')).not.toBeInTheDocument();

      // Expand with ArrowRight
      fireEvent.keyDown(citrusItem, { key: 'ArrowRight' });
      expect(screen.getByText('Oranges')).toBeInTheDocument();
    });

    it('should collapse on ArrowLeft key when expanded', async () => {
      render(
        <CategoryTree
          categories={mockCategories}
          expandable={true}
        />
      );

      const citrusItem = screen.getByText('Citrus');

      // Should be expanded by default (root level)
      expect(screen.getByText('Oranges')).toBeInTheDocument();

      // Collapse with ArrowLeft
      fireEvent.keyDown(citrusItem, { key: 'ArrowLeft' });
      expect(screen.queryByText('Oranges')).not.toBeInTheDocument();
    });

    it('should select category on Enter key', async () => {
      const handleSelect = jest.fn();

      render(
        <CategoryTree
          categories={mockCategories}
          onSelectCategory={handleSelect}
          expandable={true}
        />
      );

      const fruitsItem = screen.getByText('Fruits');
      fireEvent.keyDown(fruitsItem, { key: 'Enter' });

      expect(handleSelect).toHaveBeenCalledWith('cat-1');
    });
  });

  describe('Accessibility', () => {
    it('should have treeitem role on category nodes', () => {
      const { container } = render(
        <CategoryTree categories={mockCategories} expandable={true} />
      );

      const treeItems = container.querySelectorAll('[role="treeitem"]');
      expect(treeItems.length).toBeGreaterThan(0);
    });

    it('should have aria-expanded attribute on expandable items', () => {
      const { container } = render(
        <CategoryTree categories={mockCategories} expandable={true} />
      );

      const expandableItems = container.querySelectorAll('[role="treeitem"][aria-expanded]');
      expect(expandableItems.length).toBeGreaterThan(0);
    });

    it('should have aria-selected attribute on selected items', () => {
      const { container } = render(
        <CategoryTree
          categories={mockCategories}
          selectedCategoryId="cat-1"
          expandable={true}
        />
      );

      const selectedItems = container.querySelectorAll('[aria-selected="true"]');
      expect(selectedItems.length).toBeGreaterThan(0);
    });

    it('should have aria-label on expand/collapse buttons', () => {
      const { container } = render(
        <CategoryTree categories={mockCategories} expandable={true} />
      );

      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('aria-label');
      });
    });
  });

  describe('Props Behavior', () => {
    it('should not show expand buttons when expandable is false', () => {
      const { container } = render(
        <CategoryTree
          categories={mockCategories}
          expandable={false}
        />
      );

      const buttons = container.querySelectorAll('[role="treeitem"] button');
      expect(buttons.length).toBe(0);
    });

    it('should call onSelectCategory only when provided', () => {
      const { rerender } = render(
        <CategoryTree
          categories={mockCategories}
          expandable={true}
        />
      );

      const fruitsItem = screen.getByText('Fruits');
      fireEvent.click(fruitsItem);
      // Should not throw

      const handleSelect = jest.fn();
      rerender(
        <CategoryTree
          categories={mockCategories}
          onSelectCategory={handleSelect}
          expandable={true}
        />
      );

      fireEvent.click(fruitsItem);
      expect(handleSelect).toHaveBeenCalled();
    });
  });
});

/**
 * Recursive Category Tree Component
 * Renders hierarchical category structure with expand/collapse functionality
 */
import React, { useState } from 'react';
import { CategoryTreeNode } from '../types';

interface CategoryNodeProps {
  node: CategoryTreeNode;
  onSelectCategory?: (id: string) => void;
  selectedCategoryId?: string | null;
  expandable?: boolean;
  level?: number;
}

/**
 * Individual category node with expand/collapse
 */
const CategoryNode: React.FC<CategoryNodeProps> = ({
  node,
  onSelectCategory,
  selectedCategoryId,
  expandable = true,
  level = 0,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = node.subcategorias && node.subcategorias.length > 0;
  const isSelected = selectedCategoryId === node.id;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (expandable && hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectCategory?.(node.id);
  };

  return (
    <div>
      <div
        className={`flex items-center gap-2 p-2 cursor-pointer rounded transition-colors ${
          isSelected
            ? 'bg-blue-50 text-blue-600 font-semibold'
            : 'hover:bg-gray-100'
        }`}
        style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
        onClick={handleSelect}
        role="button"
        tabIndex={0}
        aria-selected={isSelected}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleSelect(e as any);
          }
        }}
      >
        {/* Expand/Collapse Arrow */}
        {expandable && hasChildren ? (
          <button
            className={`flex-shrink-0 w-5 h-5 flex items-center justify-center transition-transform ${
              isExpanded ? 'transform rotate-90' : ''
            }`}
            onClick={handleToggle}
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${node.nombre}`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        ) : (
          <div className="w-5 flex-shrink-0" />
        )}

        {/* Category Name */}
        <span className="flex-grow text-sm font-medium">{node.nombre}</span>

        {/* Product Count Badge (if available) */}
        {node.producto_count !== undefined && node.producto_count > 0 && (
          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-red-500 rounded-full">
            {node.producto_count}
          </span>
        )}
      </div>

      {/* Nested Children */}
      {expandable && isExpanded && hasChildren && (
        <div className="ml-2">
          {node.subcategorias.map((child) => (
            <CategoryNode
              key={child.id}
              node={child}
              onSelectCategory={onSelectCategory}
              selectedCategoryId={selectedCategoryId}
              expandable={expandable}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface CategoryTreeProps {
  categories: CategoryTreeNode[];
  onSelectCategory?: (id: string) => void;
  selectedCategoryId?: string | null;
  expandable?: boolean;
}

/**
 * Category Tree Component
 * Renders complete category hierarchy recursively
 */
export const CategoryTree: React.FC<CategoryTreeProps> = ({
  categories,
  onSelectCategory,
  selectedCategoryId,
  expandable = true,
}) => {
  if (!categories || categories.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        No categories available
      </div>
    );
  }

  return (
    <nav className="space-y-1" aria-label="Category navigation">
      {categories.map((category) => (
        <CategoryNode
          key={category.id}
          node={category}
          onSelectCategory={onSelectCategory}
          selectedCategoryId={selectedCategoryId}
          expandable={expandable}
          level={0}
        />
      ))}
    </nav>
  );
};

export default React.memo(CategoryTree);

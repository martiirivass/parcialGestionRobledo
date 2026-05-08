/**
 * CategoryTree Component
 * Recursive component for displaying hierarchical category structure
 * Features: expand/collapse, selection, keyboard navigation, accessibility
 */
import React, { useState, useCallback, useMemo } from 'react';
import { CategoryTreeNode, TreeNodeExpandState } from '../types';

interface CategoryTreeProps {
  categories: CategoryTreeNode[];
  onSelectCategory?: (id: string) => void;
  selectedCategoryId?: string | null;
  expandable?: boolean;
}

/**
 * Main CategoryTree component
 * Renders a list of root categories
 */
export const CategoryTree: React.FC<CategoryTreeProps> = ({
  categories,
  onSelectCategory,
  selectedCategoryId,
  expandable = true,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<TreeNodeExpandState>({});

  const toggleExpand = useCallback((id: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  if (categories.length === 0) {
    return (
      <div className="px-4 py-2 text-gray-500 text-sm">
        No categories available
      </div>
    );
  }

  return (
    <nav className="space-y-1" role="navigation" aria-label="Categories">
      {categories.map((category) => (
        <CategoryNode
          key={category.id}
          node={category}
          onSelectCategory={onSelectCategory}
          selectedCategoryId={selectedCategoryId}
          expandable={expandable}
          expandedNodes={expandedNodes}
          onToggleExpand={toggleExpand}
          level={0}
        />
      ))}
    </nav>
  );
};

interface CategoryNodeProps {
  node: CategoryTreeNode;
  onSelectCategory?: (id: string) => void;
  selectedCategoryId?: string | null;
  expandable?: boolean;
  expandedNodes: TreeNodeExpandState;
  onToggleExpand: (id: string) => void;
  level?: number;
}

/**
 * Recursive CategoryNode component
 * Renders individual categories and their children
 */
const CategoryNode: React.FC<CategoryNodeProps> = React.memo(
  ({
    node,
    onSelectCategory,
    selectedCategoryId,
    expandable,
    expandedNodes,
    onToggleExpand,
    level = 0,
  }) => {
    const isExpanded = expandedNodes[node.id] ?? level === 0; // Root categories expanded by default
    const hasChildren = node.subcategorias && node.subcategorias.length > 0;
    const isSelected = selectedCategoryId === node.id;

    const handleClick = useCallback(() => {
      if (onSelectCategory) {
        onSelectCategory(node.id);
      }
    }, [node.id, onSelectCategory]);

    const handleToggleExpand = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleExpand(node.id);
      },
      [node.id, onToggleExpand]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleClick();
        } else if (e.key === 'ArrowRight' && hasChildren && !isExpanded) {
          e.preventDefault();
          onToggleExpand(node.id);
        } else if (e.key === 'ArrowLeft' && hasChildren && isExpanded) {
          e.preventDefault();
          onToggleExpand(node.id);
        }
      },
      [handleClick, hasChildren, isExpanded, node.id, onToggleExpand]
    );

    const indentClass = `ml-${level * 4}`;
    const customIndentClass = useMemo(() => {
      const baseClass = 'block px-2 py-1 text-sm rounded cursor-pointer';
      const marginClass =
        level === 0
          ? 'ml-0'
          : level === 1
            ? 'ml-4'
            : level === 2
              ? 'ml-8'
              : level === 3
                ? 'ml-12'
                : 'ml-16';
      return `${baseClass} ${marginClass}`;
    }, [level]);

    return (
      <div className="space-y-0.5">
        <div
          className={`flex items-center gap-1 ${customIndentClass} transition-colors ${
            isSelected
              ? 'bg-blue-50 text-blue-600 font-semibold'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
          role="treeitem"
          aria-expanded={hasChildren ? isExpanded : undefined}
          aria-selected={isSelected}
          tabIndex={0}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
        >
          {expandable && hasChildren ? (
            <button
              className="inline-flex items-center justify-center w-5 h-5 p-0 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={handleToggleExpand}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
              tabIndex={-1}
            >
              <svg
                className={`w-4 h-4 transition-transform ${
                  isExpanded ? 'rotate-90' : 'rotate-0'
                }`}
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
            <div className="w-5" />
          )}
          <span className="flex-1">{node.nombre}</span>
        </div>

        {/* Render children if expanded */}
        {expandable && hasChildren && isExpanded && (
          <div role="group">
            {node.subcategorias.map((child) => (
              <CategoryNode
                key={child.id}
                node={child}
                onSelectCategory={onSelectCategory}
                selectedCategoryId={selectedCategoryId}
                expandable={expandable}
                expandedNodes={expandedNodes}
                onToggleExpand={onToggleExpand}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);

CategoryNode.displayName = 'CategoryNode';

export default CategoryTree;

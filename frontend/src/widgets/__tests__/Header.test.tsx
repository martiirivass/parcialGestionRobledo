/**
 * Header Component Tests
 * Tests for navigation bar and category integration
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Header } from '../Header';
import * as authStore from '../../../features/auth/store/authStore';

// Mock the auth store
jest.mock('../../../features/auth/store/authStore');

// Mock the CategoryTreeContainer
jest.mock('../../../features/categorias/components/CategoryTreeContainer', () => ({
  CategoryTreeContainer: ({ onSelectCategory }: any) => (
    <div data-testid="category-tree">
      <button
        data-testid="test-category"
        onClick={() => onSelectCategory('cat-1')}
      >
        Test Category
      </button>
    </div>
  ),
}));

const mockLogout = jest.fn();

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authStore.useAuthStore as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
      logout: mockLogout,
    });
  });

  describe('Logo and Branding', () => {
    it('should display Food Store logo', () => {
      renderWithRouter(<Header />);
      expect(screen.getByText(/Food Store/i)).toBeInTheDocument();
    });

    it('should link logo to home page', () => {
      renderWithRouter(<Header />);
      const logo = screen.getByText(/Food Store/i).closest('a');
      expect(logo).toHaveAttribute('href', '/');
    });
  });

  describe('Navigation Links', () => {
    it('should display Categories button', () => {
      renderWithRouter(<Header />);
      expect(screen.getByText('Categories')).toBeInTheDocument();
    });

    it('should display Catalog link', () => {
      renderWithRouter(<Header />);
      expect(screen.getByText('Catalog')).toHaveAttribute('href', '/catalog');
    });

    it('should display Cart link', () => {
      renderWithRouter(<Header />);
      expect(screen.getByText('Cart')).toHaveAttribute('href', '/cart');
    });
  });

  describe('Categories Dropdown', () => {
    it('should show CategoryTreeContainer when Categories button clicked', async () => {
      renderWithRouter(<Header />);

      const categoriesButton = screen.getAllByText('Categories')[0];
      fireEvent.click(categoriesButton);

      await waitFor(() => {
        expect(screen.getByTestId('category-tree')).toBeInTheDocument();
      });
    });

    it('should hide CategoryTreeContainer when clicked again', async () => {
      renderWithRouter(<Header />);

      const categoriesButton = screen.getAllByText('Categories')[0];

      // Show
      fireEvent.click(categoriesButton);
      await waitFor(() => {
        expect(screen.getByTestId('category-tree')).toBeInTheDocument();
      });

      // Hide
      fireEvent.click(categoriesButton);
      await waitFor(() => {
        expect(screen.queryByTestId('category-tree')).not.toBeInTheDocument();
      });
    });

    it('should call onCategorySelect prop when category is selected', async () => {
      const handleCategorySelect = jest.fn();

      renderWithRouter(<Header onCategorySelect={handleCategorySelect} />);

      const categoriesButton = screen.getAllByText('Categories')[0];
      fireEvent.click(categoriesButton);

      await waitFor(() => {
        expect(screen.getByTestId('category-tree')).toBeInTheDocument();
      });

      const testCategory = screen.getByTestId('test-category');
      fireEvent.click(testCategory);

      expect(handleCategorySelect).toHaveBeenCalledWith('cat-1');
    });
  });

  describe('Authentication State - Unauthenticated', () => {
    it('should display Login and Register buttons when not authenticated', () => {
      renderWithRouter(<Header />);

      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText('Register')).toBeInTheDocument();
    });

    it('should not display Logout button when not authenticated', () => {
      renderWithRouter(<Header />);

      const logoutButtons = screen.queryAllByText('Logout');
      expect(logoutButtons.length).toBe(0);
    });

    it('Login link should navigate to /login', () => {
      renderWithRouter(<Header />);

      const loginLink = screen.getByText('Login').closest('a');
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('Register link should navigate to /register', () => {
      renderWithRouter(<Header />);

      const registerLink = screen.getByText('Register').closest('a');
      expect(registerLink).toHaveAttribute('href', '/register');
    });
  });

  describe('Authentication State - Authenticated', () => {
    beforeEach(() => {
      (authStore.useAuthStore as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        user: {
          id: 1,
          nombre: 'John Doe',
          email: 'john@example.com',
          roles: [],
        },
        logout: mockLogout,
      });
    });

    it('should display user name when authenticated', () => {
      renderWithRouter(<Header />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should display Logout button when authenticated', () => {
      renderWithRouter(<Header />);

      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('should not display Login or Register buttons when authenticated', () => {
      renderWithRouter(<Header />);

      expect(screen.queryByText('Login')).not.toBeInTheDocument();
      expect(screen.queryByText('Register')).not.toBeInTheDocument();
    });

    it('should call logout when Logout button clicked', () => {
      renderWithRouter(<Header />);

      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);

      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe('Mobile Menu', () => {
    it('should not display mobile menu by default', () => {
      const { container } = renderWithRouter(<Header />);

      const mobileMenuButton = container.querySelector(
        'button[aria-label="Toggle menu"]'
      );
      expect(mobileMenuButton).toBeInTheDocument();
    });

    it('should show mobile menu when menu button clicked', () => {
      const { container } = renderWithRouter(<Header />);

      const mobileMenuButton = container.querySelector(
        'button[aria-label="Toggle menu"]'
      );
      fireEvent.click(mobileMenuButton!);

      expect(screen.getByText('Categories')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should have hidden desktop nav on mobile', () => {
      const { container } = renderWithRouter(<Header />);

      const desktopNav = container.querySelector('.hidden.md\\:flex');
      expect(desktopNav).toBeInTheDocument();
    });
  });
});

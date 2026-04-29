/**
 * UI store for interface state
 */
import { create } from 'zustand';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  createdAt: number;
}

interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  notifications: Notification[];
}

interface UIActions {
  toggleTheme: () => void;
  toggleSidebar: () => void;
  addNotification: (message: string, type: Notification['type']) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>()((set, get) => ({
  // State
  theme: 'light',
  sidebarOpen: false,
  notifications: [],
  
  // Actions
  toggleTheme: () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light';
    set({ theme: newTheme });
    // Optionally save to localStorage
    localStorage.setItem('food-store-theme', newTheme);
  },
  
  toggleSidebar: () => {
    set({ sidebarOpen: !get().sidebarOpen });
  },
  
  addNotification: (message, type) => {
    const notification: Notification = {
      id: crypto.randomUUID(),
      message,
      type,
      createdAt: Date.now(),
    };
    set({ notifications: [...get().notifications, notification] });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      get().removeNotification(notification.id);
    }, 5000);
  },
  
  removeNotification: (id) => {
    set({
      notifications: get().notifications.filter((n) => n.id !== id),
    });
  },
  
  clearNotifications: () => {
    set({ notifications: [] });
  },
}));
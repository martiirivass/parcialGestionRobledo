/**
 * Payment store for MercadoPago checkout
 */
import { create } from 'zustand';

interface PaymentPreference {
  id: string;
  init_point: string;
}

interface PaymentState {
  preferencia: PaymentPreference | null;
  status: 'idle' | 'creating' | 'ready' | 'processing' | 'success' | 'error';
  error: string | null;
}

interface PaymentActions {
  setPreferencia: (preferencia: PaymentPreference) => void;
  setStatus: (status: PaymentState['status']) => void;
  setError: (error: string) => void;
  reset: () => void;
}

type PaymentStore = PaymentState & PaymentActions;

export const usePaymentStore = create<PaymentStore>()((set) => ({
  // State
  preferencia: null,
  status: 'idle',
  error: null,
  
  // Actions
  setPreferencia: (preferencia) => set({ preferencia, status: 'ready', error: null }),
  
  setStatus: (status) => set({ status }),
  
  setError: (error) => set({ status: 'error', error }),
  
  reset: () => set({ preferencia: null, status: 'idle', error: null }),
}));
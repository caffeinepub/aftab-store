import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
  isPaused: boolean;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number) => string;
  removeToast: (id: string) => void;
  pauseToast: (id: string) => void;
  resumeToast: (id: string) => void;
}

const getDefaultDuration = (type: ToastType): number => {
  switch (type) {
    case 'success':
    case 'info':
      return 2000;
    case 'error':
    case 'warning':
      return 4000;
    default:
      return 3000;
  }
};

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (type, message, duration) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const toastDuration = duration ?? getDefaultDuration(type);
    
    set((state) => ({
      toasts: [...state.toasts, { id, type, message, duration: toastDuration, isPaused: false }],
    }));
    
    return id;
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },
  pauseToast: (id) => {
    set((state) => ({
      toasts: state.toasts.map((toast) =>
        toast.id === id ? { ...toast, isPaused: true } : toast
      ),
    }));
  },
  resumeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.map((toast) =>
        toast.id === id ? { ...toast, isPaused: false } : toast
      ),
    }));
  },
}));

// Helper functions for creating toasts
export const toast = {
  success: (message: string, duration?: number) => {
    return useToastStore.getState().addToast('success', message, duration);
  },
  error: (message: string, duration?: number) => {
    return useToastStore.getState().addToast('error', message, duration);
  },
  warning: (message: string, duration?: number) => {
    return useToastStore.getState().addToast('warning', message, duration);
  },
  info: (message: string, duration?: number) => {
    return useToastStore.getState().addToast('info', message, duration);
  },
};

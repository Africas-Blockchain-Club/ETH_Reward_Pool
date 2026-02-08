import { useState, useCallback } from 'react';

interface Toast {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'winner';
  address?: string;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type?: Toast['type'], address?: string) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type, address }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showSuccess = useCallback((message: string) => {
    addToast(message, 'success');
  }, [addToast]);

  const showError = useCallback((message: string) => {
    addToast(message, 'error');
  }, [addToast]);

  const showInfo = useCallback((message: string) => {
    addToast(message, 'info');
  }, [addToast]);

  const showWinner = useCallback((address: string) => {
    addToast('🎉 Winner Selected!', 'winner', address);
  }, [addToast]);

  return {
    toasts,
    removeToast,
    showSuccess,
    showError,
    showInfo,
    showWinner,
  };
}


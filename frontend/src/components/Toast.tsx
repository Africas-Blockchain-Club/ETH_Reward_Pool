import { useEffect } from 'react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'winner';
  duration?: number;
  onClose: () => void;
  address?: string;
}

export function Toast({ message, type = 'info', duration = 5000, onClose, address }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-black',
    winner: 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600',
  }[type];

  const textColor = type === 'winner' ? 'text-black' : 'text-white';

  return (
    <div
      className={`fixed top-24 right-4 z-50 ${bgColor} ${textColor} px-6 py-4 rounded-lg shadow-2xl border-2 border-black max-w-md animate-slide-in`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="text-3xl">
          {type === 'success' && '✅'}
          {type === 'error' && '❌'}
          {type === 'info' && 'ℹ️'}
          {type === 'winner' && '🏆'}
        </div>
        <div className="flex-1">
          <p className="font-bold text-lg mb-1">{message}</p>
          {address && (
            <code className="text-sm font-mono bg-black bg-opacity-20 px-2 py-1 rounded">
              {address.slice(0, 6)}...{address.slice(-4)}
            </code>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-2xl leading-none hover:opacity-70 transition-opacity"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Array<{
    id: string;
    message: string;
    type?: 'success' | 'error' | 'info' | 'winner';
    address?: string;
  }>;
  removeToast: (id: string) => void;
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div className="fixed top-24 right-4 z-50 space-y-3">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          address={toast.address}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}


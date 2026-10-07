import React, { useEffect, useState, useCallback, createContext, useContext } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  toast: () => {},
  success: () => {},
  error: () => {},
  warning: () => {},
  info: () => {},
});

export const useToast = () => useContext(ToastContext);

const ICON_MAP = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const STYLE_MAP = {
  success: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: 'text-emerald-500',
    title: 'text-emerald-900',
    msg: 'text-emerald-700',
    progress: 'bg-emerald-500',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-500',
    title: 'text-red-900',
    msg: 'text-red-700',
    progress: 'bg-red-500',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: 'text-amber-500',
    title: 'text-amber-900',
    msg: 'text-amber-700',
    progress: 'bg-amber-500',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-500',
    title: 'text-blue-900',
    msg: 'text-blue-700',
    progress: 'bg-blue-500',
  },
};

const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({
  toast: t,
  onDismiss,
}) => {
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const duration = t.duration || 4000;
  const styles = STYLE_MAP[t.type];
  const Icon = ICON_MAP[t.type];

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        setExiting(true);
        setTimeout(() => onDismiss(t.id), 300);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [duration, t.id, onDismiss]);

  return (
    <div
      className={`relative overflow-hidden rounded-xl border shadow-lg backdrop-blur-sm transition-all duration-300 ${
        exiting ? 'opacity-0 translate-x-8 scale-95' : 'opacity-100 translate-x-0 scale-100'
      } ${styles.bg} ${styles.border}`}
      style={{ minWidth: 320, maxWidth: 420 }}
    >
      <div className="flex items-start gap-3 p-4">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${styles.icon}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${styles.title}`}>{t.title}</p>
          {t.message && (
            <p className={`text-xs mt-0.5 leading-relaxed ${styles.msg}`}>{t.message}</p>
          )}
        </div>
        <button
          onClick={() => {
            setExiting(true);
            setTimeout(() => onDismiss(t.id), 300);
          }}
          className="p-1 rounded-lg hover:bg-black/5 transition flex-shrink-0"
        >
          <X className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>
      {/* Progress Bar */}
      <div className="h-0.5 w-full bg-black/5">
        <div
          className={`h-full transition-all duration-100 ease-linear ${styles.progress}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, title: string, message?: string, duration?: number) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-4), { id, type, title, message, duration }]);
    },
    []
  );

  const value: ToastContextType = {
    toast: addToast,
    success: (title, message) => addToast('success', title, message),
    error: (title, message) => addToast('error', title, message),
    warning: (title, message) => addToast('warning', title, message),
    info: (title, message) => addToast('info', title, message),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast Container */}
      <div
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none"
        style={{ maxHeight: 'calc(100vh - 2rem)' }}
      >
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto animate-slideIn">
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

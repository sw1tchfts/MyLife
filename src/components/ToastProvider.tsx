"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface Toast {
  id: string;
  message: string;
  onUndo?: () => void;
  onExpire?: () => void;
  duration: number;
}

interface ToastContextValue {
  showToast: (opts: {
    message: string;
    onUndo?: () => void;
    onExpire?: () => void;
    duration?: number;
  }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

let nextId = 0;

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (opts: {
      message: string;
      onUndo?: () => void;
      onExpire?: () => void;
      duration?: number;
    }) => {
      const id = String(++nextId);
      setToasts((prev) => [
        ...prev,
        {
          id,
          message: opts.message,
          onUndo: opts.onUndo,
          onExpire: opts.onExpire,
          duration: opts.duration ?? 5000,
        },
      ]);
    },
    [],
  );

  const dismiss = useCallback((id: string, undone: boolean) => {
    setToasts((prev) => {
      const toast = prev.find((t) => t.id === id);
      if (toast && !undone && toast.onExpire) {
        toast.onExpire();
      }
      return prev.filter((t) => t.id !== id);
    });
  }, []);

  const handleUndo = useCallback((id: string) => {
    setToasts((prev) => {
      const toast = prev.find((t) => t.id === id);
      if (toast?.onUndo) toast.onUndo();
      return prev.filter((t) => t.id !== id);
    });
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={() => dismiss(toast.id, false)}
            onUndo={() => handleUndo(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onDismiss,
  onUndo,
}: {
  toast: Toast;
  onDismiss: () => void;
  onUndo: () => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [exiting, setExiting] = useState(false);

  const animatedDismiss = useCallback(() => {
    setExiting(true);
    setTimeout(onDismiss, 200);
  }, [onDismiss]);

  const animatedUndo = useCallback(() => {
    setExiting(true);
    setTimeout(onUndo, 200);
  }, [onUndo]);

  useEffect(() => {
    timerRef.current = setTimeout(animatedDismiss, toast.duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast.duration, animatedDismiss]);

  return (
    <div
      className={`flex items-center gap-3 rounded-xl bg-elevated px-4 py-3 text-sm text-white shadow-lg ${exiting ? "animate-slide-down" : "animate-slide-up"}`}
    >
      <span>{toast.message}</span>
      {toast.onUndo && (
        <button
          onClick={animatedUndo}
          className="font-medium text-accent-text hover:text-accent-text/70"
        >
          Undo
        </button>
      )}
      <button
        onClick={animatedDismiss}
        className="ml-1 text-muted hover:text-body"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

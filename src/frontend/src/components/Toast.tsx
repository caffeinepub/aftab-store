import React, { useEffect, useRef, memo } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useToastStore, type Toast as ToastType } from '../stores/toastStore';

interface ToastProps {
  toast: ToastType;
}

const Toast = memo(({ toast }: ToastProps) => {
  const { removeToast, pauseToast, resumeToast } = useToastStore();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(toast.duration);

  const startTimer = () => {
    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      removeToast(toast.id);
    }, remainingTimeRef.current);
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      const elapsed = Date.now() - startTimeRef.current;
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
    }
  };

  useEffect(() => {
    startTimer();
    return () => clearTimer();
  }, []);

  useEffect(() => {
    if (toast.isPaused) {
      clearTimer();
    } else {
      startTimer();
    }
  }, [toast.isPaused]);

  const handleMouseEnter = () => {
    pauseToast(toast.id);
  };

  const handleMouseLeave = () => {
    resumeToast(toast.id);
  };

  const handleDismiss = () => {
    removeToast(toast.id);
  };

  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'toast-success';
      case 'error':
        return 'toast-error';
      case 'warning':
        return 'toast-warning';
      case 'info':
        return 'toast-info';
      default:
        return 'toast-info';
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 flex-shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 flex-shrink-0" />;
      case 'info':
        return <Info className="w-5 h-5 flex-shrink-0" />;
      default:
        return <Info className="w-5 h-5 flex-shrink-0" />;
    }
  };

  const getAriaLabel = () => {
    switch (toast.type) {
      case 'success':
        return 'Notificación de éxito';
      case 'error':
        return 'Notificación de error';
      case 'warning':
        return 'Notificación de advertencia';
      case 'info':
        return 'Notificación informativa';
      default:
        return 'Notificación';
    }
  };

  return (
    <div
      className={`toast ${getToastStyles()}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="alert"
      aria-live="polite"
      aria-label={getAriaLabel()}
    >
      <div className="toast-icon">{getIcon()}</div>
      <div className="toast-message">{toast.message}</div>
      <button
        onClick={handleDismiss}
        className="toast-close"
        aria-label="Cerrar notificación"
        type="button"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
});

Toast.displayName = 'Toast';

export default Toast;

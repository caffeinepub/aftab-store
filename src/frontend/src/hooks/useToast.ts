import { toast } from '../stores/toastStore';

/**
 * Hook personalizado para usar el sistema de notificaciones toast
 * Proporciona funciones helper para crear diferentes tipos de toasts
 */
export const useToast = () => {
  return {
    success: (message: string, duration?: number) => toast.success(message, duration),
    error: (message: string, duration?: number) => toast.error(message, duration),
    warning: (message: string, duration?: number) => toast.warning(message, duration),
    info: (message: string, duration?: number) => toast.info(message, duration),
  };
};

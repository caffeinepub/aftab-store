/**
 * API Response Handler Utilities
 * Provides standardized API response handling with BigInt support
 */

import { parseJSONWithBigInt } from './BigIntSerializer';

/**
 * Standardized API response format
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

/**
 * API error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode?: number;
}

/**
 * Error types for retry logic
 */
export enum ErrorType {
  Network = 'NETWORK',
  Timeout = 'TIMEOUT',
  ServerError = 'SERVER_ERROR',
  ClientError = 'CLIENT_ERROR',
  Unauthorized = 'UNAUTHORIZED',
  Unknown = 'UNKNOWN',
}

/**
 * Handles API responses with BigInt parsing support
 * @param response - The fetch Response object
 * @returns Parsed API response with BigInt support
 */
export async function handleApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  try {
    // Check if response is ok
    if (!response.ok) {
      const errorData = await response.text();
      let errorMessage = 'Error en la solicitud';

      try {
        const parsedError = parseJSONWithBigInt(errorData);
        errorMessage = parsedError.message || parsedError.error || errorMessage;
      } catch {
        errorMessage = errorData || `Error ${response.status}: ${response.statusText}`;
      }

      return {
        success: false,
        error: createApiError(
          determineErrorType(response.status),
          errorMessage,
          response.status
        ),
      };
    }

    // Parse response body
    const responseText = await response.text();

    if (!responseText || responseText.trim() === '') {
      return {
        success: true,
        data: undefined as T,
      };
    }

    try {
      const data = parseJSONWithBigInt<T>(responseText);
      return {
        success: true,
        data,
      };
    } catch (parseError) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[ApiResponseHandler] Error al parsear respuesta JSON:', parseError);
      }
      return {
        success: false,
        error: createApiError(
          ErrorType.Unknown,
          'Error al procesar la respuesta del servidor',
          response.status
        ),
      };
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[ApiResponseHandler] Error al manejar respuesta:', error);
    }

    return {
      success: false,
      error: createApiError(
        ErrorType.Network,
        error.message || 'Error de red al procesar la respuesta',
        undefined,
        error
      ),
    };
  }
}

/**
 * Creates a standardized API error object
 * @param type - The error type
 * @param message - The error message in Spanish
 * @param statusCode - Optional HTTP status code
 * @param details - Optional additional error details
 * @returns Standardized API error
 */
export function createApiError(
  type: ErrorType | string,
  message: string,
  statusCode?: number,
  details?: any
): ApiError {
  const errorMessages: Record<ErrorType, string> = {
    [ErrorType.Network]: 'Error de conexión. Por favor, verifica tu conexión a internet.',
    [ErrorType.Timeout]: 'La solicitud ha excedido el tiempo de espera. Por favor, inténtalo de nuevo.',
    [ErrorType.ServerError]: 'Error del servidor. Por favor, inténtalo más tarde.',
    [ErrorType.ClientError]: 'Error en la solicitud. Por favor, verifica los datos enviados.',
    [ErrorType.Unauthorized]: 'No autorizado. Por favor, inicia sesión nuevamente.',
    [ErrorType.Unknown]: 'Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.',
  };

  const defaultMessage = errorMessages[type as ErrorType] || message;

  return {
    code: type,
    message: message || defaultMessage,
    statusCode,
    details,
  };
}

/**
 * Determines if a request should be retried based on error type
 * @param error - The API error
 * @param attemptNumber - Current attempt number
 * @param maxAttempts - Maximum number of retry attempts (default: 3)
 * @returns True if the request should be retried
 */
export function shouldRetryRequest(
  error: ApiError,
  attemptNumber: number,
  maxAttempts: number = 3
): boolean {
  // Don't retry if max attempts reached
  if (attemptNumber >= maxAttempts) {
    return false;
  }

  // Retry on network errors
  if (error.code === ErrorType.Network) {
    return true;
  }

  // Retry on timeout errors
  if (error.code === ErrorType.Timeout) {
    return true;
  }

  // Retry on specific server errors (500, 502, 503, 504)
  if (error.statusCode && [500, 502, 503, 504].includes(error.statusCode)) {
    return true;
  }

  // Don't retry on client errors (4xx except 408 Request Timeout and 429 Too Many Requests)
  if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
    return error.statusCode === 408 || error.statusCode === 429;
  }

  // Don't retry on unauthorized errors
  if (error.code === ErrorType.Unauthorized) {
    return false;
  }

  // Don't retry by default
  return false;
}

/**
 * Determines error type from HTTP status code
 * @param statusCode - HTTP status code
 * @returns Error type
 */
function determineErrorType(statusCode: number): ErrorType {
  if (statusCode === 401 || statusCode === 403) {
    return ErrorType.Unauthorized;
  }

  if (statusCode === 408) {
    return ErrorType.Timeout;
  }

  if (statusCode >= 400 && statusCode < 500) {
    return ErrorType.ClientError;
  }

  if (statusCode >= 500) {
    return ErrorType.ServerError;
  }

  return ErrorType.Unknown;
}


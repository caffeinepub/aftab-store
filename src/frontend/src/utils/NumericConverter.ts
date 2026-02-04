/**
 * Numeric Conversion Utilities
 * Provides type-safe number conversions and validations for Spanish locale
 */

/**
 * Safely converts a value to a number with robust validation
 * @param value - The value to convert (string, number, BigInt, or null/undefined)
 * @param fieldName - Optional field name for error messages
 * @returns The converted number or null if input is null/undefined
 * @throws Error if conversion fails
 */
export function safeConvertToNumber(
  value: string | number | bigint | null | undefined,
  fieldName?: string
): number | null {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return null;
  }

  // Handle BigInt type
  if (typeof value === 'bigint') {
    try {
      const num = Number(value);
      if (isNaN(num) || !isFinite(num)) {
        const errorMsg = `BigInt no convertible a número${fieldName ? ` en campo "${fieldName}"` : ''}: ${value}`;
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[NumericConverter] ${errorMsg}`);
        }
        throw new Error(errorMsg);
      }
      return num;
    } catch (err: any) {
      const errorMsg = `Error al convertir BigInt${fieldName ? ` en campo "${fieldName}"` : ''}: ${err.message || 'valor inválido'}`;
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[NumericConverter] ${errorMsg}`);
      }
      throw new Error(errorMsg);
    }
  }

  // Handle number type
  if (typeof value === 'number') {
    if (isNaN(value) || !isFinite(value)) {
      const errorMsg = `Número inválido${fieldName ? ` en campo "${fieldName}"` : ''}: ${value}`;
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[NumericConverter] ${errorMsg}`);
      }
      throw new Error(errorMsg);
    }
    return value;
  }

  // Handle string type
  if (typeof value === 'string') {
    const trimmed = value.trim();
    
    // Empty string returns null
    if (trimmed === '') {
      return null;
    }

    // Handle Spanish decimal format (comma as decimal separator)
    const normalized = trimmed.replace(',', '.');
    const parsed = Number(normalized);

    if (isNaN(parsed) || !isFinite(parsed)) {
      const errorMsg = `Valor no numérico${fieldName ? ` en campo "${fieldName}"` : ''}: "${value}"`;
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[NumericConverter] ${errorMsg}`);
      }
      throw new Error(errorMsg);
    }

    return parsed;
  }

  // Handle unexpected types
  const errorMsg = `Tipo de dato inválido${fieldName ? ` en campo "${fieldName}"` : ''}: ${typeof value}`;
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[NumericConverter] ${errorMsg}`);
  }
  throw new Error(errorMsg);
}

/**
 * Validates IVA (VAT) percentage
 * Valid values: 0, 4, 10, 21
 * @param value - The IVA percentage to validate
 * @returns True if valid, false otherwise
 */
export function validateIvaNumber(value: number | null | undefined): boolean {
  if (value === null || value === undefined) {
    return true; // null/undefined is considered valid (no IVA)
  }

  const validIvaRates = [0, 4, 10, 21];
  const isValid = validIvaRates.includes(value);

  if (!isValid && process.env.NODE_ENV === 'development') {
    console.warn(`[NumericConverter] Tasa de IVA inválida: ${value}. Valores válidos: 0, 4, 10, 21`);
  }

  return isValid;
}

/**
 * Validates profit margin percentage
 * Must be between 0 and 1000 (0% to 1000%)
 * @param value - The profit margin to validate
 * @returns True if valid, false otherwise
 */
export function validateProfitMargin(value: number | null | undefined): boolean {
  if (value === null || value === undefined) {
    return true; // null/undefined is considered valid (no margin)
  }

  const isValid = value >= 0 && value <= 1000;

  if (!isValid && process.env.NODE_ENV === 'development') {
    console.warn(`[NumericConverter] Margen de beneficio inválido: ${value}. Debe estar entre 0 y 1000`);
  }

  return isValid;
}

/**
 * Converts stock value to boolean with robust handling
 * @param value - The stock value (number, string, or boolean)
 * @returns True if stock is available, false otherwise
 */
export function convertStockToBoolean(value: number | string | boolean | null | undefined): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value > 0;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase();
    
    // Handle empty string
    if (trimmed === '') {
      return false;
    }
    
    // Handle explicit boolean strings
    if (trimmed === 'true' || trimmed === 'sí' || trimmed === 'si') {
      return true;
    }
    if (trimmed === 'false' || trimmed === 'no') {
      return false;
    }

    // Try to parse as number
    const num = Number(trimmed);
    if (!isNaN(num) && isFinite(num)) {
      return num > 0;
    }

    // Unrecognized string defaults to false
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[NumericConverter] Valor de stock no reconocido: "${value}". Asumiendo false.`);
    }
    return false;
  }

  if (process.env.NODE_ENV === 'development') {
    console.warn(`[NumericConverter] Tipo de stock inesperado: ${typeof value}. Asumiendo false.`);
  }
  return false;
}

/**
 * Formats a price for display in Spanish format
 * @param value - The price value to format
 * @param includeSymbol - Whether to include the € symbol (default: true)
 * @returns Formatted price string (e.g., "€12,34")
 */
export function formatPriceForDisplay(value: number | null | undefined, includeSymbol: boolean = true): string {
  if (value === null || value === undefined) {
    return includeSymbol ? '€0,00' : '0,00';
  }

  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[NumericConverter] Valor de precio inválido para formatear: ${value}`);
    }
    return includeSymbol ? '€0,00' : '0,00';
  }

  // Format with 2 decimal places and Spanish locale (comma as decimal separator)
  const formatted = value.toFixed(2).replace('.', ',');

  return includeSymbol ? `€${formatted}` : formatted;
}

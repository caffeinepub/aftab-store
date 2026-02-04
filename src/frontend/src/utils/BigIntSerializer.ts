/**
 * BigInt Serialization Utilities
 * Provides safe BigInt handling for JSON serialization and parsing
 */

/**
 * Safely converts a BigInt to string with validation
 * @param value - The BigInt value to convert
 * @returns String representation of the BigInt
 */
export function safeBigIntToString(value: bigint): string {
  if (typeof value !== 'bigint') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[BigIntSerializer] Valor no es BigInt:', typeof value);
    }
    throw new Error('El valor proporcionado no es un BigInt');
  }
  return value.toString();
}

/**
 * Safely converts a string to BigInt with validation
 * @param value - The string value to convert
 * @returns BigInt representation of the string
 */
export function safeStringToBigInt(value: string): bigint {
  if (typeof value !== 'string') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[BigIntSerializer] Valor no es string:', typeof value);
    }
    throw new Error('El valor proporcionado no es una cadena de texto');
  }

  if (!isValidBigIntString(value)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[BigIntSerializer] Cadena inválida para BigInt:', value);
    }
    throw new Error('La cadena no representa un número BigInt válido');
  }

  try {
    return BigInt(value);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[BigIntSerializer] Error al convertir a BigInt:', error);
    }
    throw new Error('Error al convertir la cadena a BigInt');
  }
}

/**
 * Validates if a string can be converted to BigInt
 * @param value - The string to validate
 * @returns True if the string is a valid BigInt representation
 */
export function isValidBigIntString(value: string): boolean {
  if (typeof value !== 'string' || value.trim() === '') {
    return false;
  }

  // Check if it matches a valid integer pattern (with optional leading minus)
  const bigIntPattern = /^-?\d+$/;
  return bigIntPattern.test(value.trim());
}

/**
 * Parses JSON string with BigInt support
 * Automatically converts fields containing "Date", "Timestamp", or "id" to BigInt
 * @param jsonString - The JSON string to parse
 * @returns Parsed object with BigInt values
 */
export function parseJSONWithBigInt<T = any>(jsonString: string): T {
  if (typeof jsonString !== 'string') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[BigIntSerializer] parseJSONWithBigInt recibió un valor no-string');
    }
    throw new Error('El valor proporcionado no es una cadena JSON válida');
  }

  try {
    return JSON.parse(jsonString, (key, value) => {
      // Convert specific fields to BigInt
      if (
        typeof value === 'string' &&
        (key.toLowerCase().includes('date') ||
          key.toLowerCase().includes('timestamp') ||
          key.toLowerCase().includes('id')) &&
        isValidBigIntString(value)
      ) {
        try {
          return BigInt(value);
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`[BigIntSerializer] No se pudo convertir el campo "${key}" a BigInt:`, value);
          }
          return value;
        }
      }
      return value;
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[BigIntSerializer] Error al parsear JSON:', error);
    }
    throw new Error('Error al parsear la cadena JSON');
  }
}

/**
 * Stringifies an object to JSON with BigInt support
 * Automatically converts BigInt values to strings
 * @param value - The value to stringify
 * @param space - Optional spacing for formatting
 * @returns JSON string representation
 */
export function stringifyWithBigInt(value: any, space?: string | number): string {
  try {
    return JSON.stringify(
      value,
      (key, val) => {
        if (typeof val === 'bigint') {
          return val.toString();
        }
        return val;
      },
      space
    );
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[BigIntSerializer] Error al convertir a JSON:', error);
    }
    throw new Error('Error al convertir el objeto a JSON');
  }
}


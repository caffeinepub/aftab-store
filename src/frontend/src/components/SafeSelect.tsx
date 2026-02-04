/**
 * SafeSelect Component
 * Wraps the standard Select component to prevent empty string errors
 * Uses sentinel values for special cases: 'none', 'all', 'no-change'
 */

import React from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Sentinel values for special cases
export type SentinelValue = 'none' | 'all' | 'no-change';

export interface SafeSelectProps {
  value: string | SentinelValue;
  onValueChange: (value: string | SentinelValue) => void;
  placeholder?: string;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Checks if a value is a sentinel value
 */
export function isSentinelValue(value: string): value is SentinelValue {
  return value === 'none' || value === 'all' || value === 'no-change';
}

/**
 * Converts sentinel values to null for API calls
 * @param value - The value to convert
 * @returns null if sentinel, otherwise the original value
 */
export function convertSentinelToNull(value: string | SentinelValue): string | null {
  if (isSentinelValue(value)) {
    return null;
  }
  return value;
}

/**
 * Initializes select state with proper sentinel handling
 * @param initialValue - The initial value (can be null)
 * @param defaultSentinel - The default sentinel to use if value is null
 * @returns A valid select value
 */
export function initializeSelectState(
  initialValue: string | null | undefined,
  defaultSentinel: SentinelValue = 'none'
): string | SentinelValue {
  if (initialValue === null || initialValue === undefined) {
    return defaultSentinel;
  }
  if (initialValue === '') {
    throw new Error('SafeSelect: No se permiten cadenas vacías. Use un valor centinela (none, all, no-change).');
  }
  return initialValue;
}

/**
 * SafeSelect Component
 * Prevents empty string errors by enforcing sentinel values
 */
export function SafeSelect({ value, onValueChange, placeholder, disabled, children, className }: SafeSelectProps) {
  // Validate that empty strings are never used
  if (value === '') {
    throw new Error(
      'SafeSelect: Se detectó una cadena vacía como valor. Use un valor centinela (none, all, no-change) en su lugar.'
    );
  }

  const handleValueChange = (newValue: string) => {
    if (newValue === '') {
      console.error('SafeSelect: Intento de establecer una cadena vacía. Operación bloqueada.');
      return;
    }
    onValueChange(newValue);
  };

  return (
    <Select value={value} onValueChange={handleValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="scrollable-category-dropdown">{children}</SelectContent>
    </Select>
  );
}

// Export Select components for convenience
export { SelectGroup, SelectItem, SelectLabel };

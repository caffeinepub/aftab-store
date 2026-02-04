/**
 * Phone number formatting utilities for WhatsApp and telephone display
 */

/**
 * Formats a phone number for WhatsApp API URLs
 * Removes all non-digit characters and prepends "34" if not present
 * @param phoneNumber - The phone number to format
 * @returns Clean digits string with country code
 * @example formatWhatsAppApiNumber("695 25 06 55") => "34695250655"
 */
export function formatWhatsAppApiNumber(phoneNumber: string): string {
  if (!phoneNumber) return '34695250655'; // Default fallback
  
  // Remove all non-digit characters
  const cleanedNumber = phoneNumber.replace(/\D/g, '');
  
  // Prepend "34" if not already present
  if (!cleanedNumber.startsWith('34')) {
    return `34${cleanedNumber}`;
  }
  
  return cleanedNumber;
}

/**
 * Formats a phone number for Spanish display format
 * Uses formatWhatsAppApiNumber to clean digits first, then formats as +34 XXX XX XX XX
 * @param phoneNumber - The phone number to format
 * @returns Formatted phone number string
 * @example formatSpanishPhoneDisplay("695250655") => "+34 695 25 06 55"
 */
export function formatSpanishPhoneDisplay(phoneNumber: string): string {
  if (!phoneNumber) return '+34 695 25 06 55'; // Default fallback
  
  // Clean and normalize the number first
  const cleanedNumber = formatWhatsAppApiNumber(phoneNumber);
  
  // Extract the parts (assuming format is 34XXXXXXXXX)
  if (cleanedNumber.length >= 11) {
    const countryCode = cleanedNumber.substring(0, 2); // "34"
    const part1 = cleanedNumber.substring(2, 5); // XXX
    const part2 = cleanedNumber.substring(5, 7); // XX
    const part3 = cleanedNumber.substring(7, 9); // XX
    const part4 = cleanedNumber.substring(9, 11); // XX
    
    return `+${countryCode} ${part1} ${part2} ${part3} ${part4}`;
  }
  
  // Fallback if number is too short
  return `+${cleanedNumber}`;
}

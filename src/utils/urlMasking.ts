/**
 * Simple URL masking utilities to hide sensitive information like database IDs
 * from being exposed in URLs.
 */

const MASK_SALT = 'evalus-url-mask-2024';

/**
 * Masks a numeric ID or string by encoding it with a salt
 * @param value - The value to mask (number or string)
 * @returns Masked string safe for URLs
 */
export function maskUrlParam(value: number | string): string {
    try {
        const stringValue = String(value);
        const saltedValue = `${MASK_SALT}:${stringValue}`;

        // Convert to base64 and make URL-safe
        const encoded = Buffer.from(saltedValue, 'utf8').toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');

        return encoded;
    } catch (error) {
        console.error('Error masking URL parameter:', error);
        return String(value); // Fallback to original value
    }
}

/**
 * Unmasks a URL parameter back to its original value
 * @param maskedValue - The masked value from URL
 * @returns Original value or null if invalid
 */
export function unmaskUrlParam(maskedValue: string): string | null {
    try {
        // Restore base64 padding and characters
        let base64 = maskedValue
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        // Add padding if needed
        while (base64.length % 4) {
            base64 += '=';
        }

        const decoded = Buffer.from(base64, 'base64').toString('utf8');

        if (!decoded.startsWith(`${MASK_SALT}:`)) {
            return null; // Invalid or tampered mask
        }

        return decoded.substring(MASK_SALT.length + 1);
    } catch (error) {
        console.error('Error unmasking URL parameter:', error);
        return null;
    }
}

/**
 * Converts a masked parameter to a number if possible
 * @param maskedValue - The masked value from URL
 * @returns Number or null if invalid/non-numeric
 */
export function unmaskUrlParamAsNumber(maskedValue: string): number | null {
    const unmasked = unmaskUrlParam(maskedValue);
    if (unmasked === null) return null;

    const num = parseInt(unmasked, 10);
    return isNaN(num) ? null : num;
}

/**
 * Type-safe helper for masking IDs in admin routes
 */
export function maskAdminId(id: number | string): string {
    return maskUrlParam(id);
}

/**
 * Type-safe helper for unmasking IDs in admin routes
 */
export function unmaskAdminId(maskedId: string): number | null {
    return unmaskUrlParamAsNumber(maskedId);
}
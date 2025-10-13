/**
 * Password validation utility with strong password policy
 * Requirements:
 * - Minimum 8 characters length
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 lowercase letter (a-z)
 * - At least 1 number (0-9)
 * - At least 1 special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
 * - Maximum 128 characters to prevent extremely long passwords
 * - No common weak passwords
 */

interface PasswordValidationResult {
    isValid: boolean;
    errors: string[];
    strength: 'weak' | 'fair' | 'good' | 'strong';
    score: number; // 0-100
}

const COMMON_WEAK_PASSWORDS = [
    'password', 'password123', '123456', '12345678', 'qwerty',
    'abc123', 'password1', 'admin', 'administrator', 'welcome',
    'letmein', 'monkey', 'dragon', 'pass', 'master'
];

const MIN_LENGTH = 8;
const MAX_LENGTH = 128;

export const validatePassword = (password: string): PasswordValidationResult => {
    const errors: string[] = [];
    let score = 0;

    // Check if password is provided
    if (!password || password.trim().length === 0) {
        return {
            isValid: false,
            errors: ['Password is required'],
            strength: 'weak',
            score: 0
        };
    }

    const trimmedPassword = password.trim();

    // Length validation
    if (trimmedPassword.length < MIN_LENGTH) {
        errors.push(`Password must be at least ${MIN_LENGTH} characters long`);
    } else {
        score += 20; // Base score for minimum length
    }

    if (trimmedPassword.length > MAX_LENGTH) {
        errors.push(`Password must not exceed ${MAX_LENGTH} characters`);
    }

    // Character type validations
    const hasUppercase = /[A-Z]/.test(trimmedPassword);
    const hasLowercase = /[a-z]/.test(trimmedPassword);
    const hasNumbers = /\d/.test(trimmedPassword);
    const hasSpecialChars = /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(trimmedPassword);

    if (!hasUppercase) {
        errors.push('Password must contain at least one uppercase letter (A-Z)');
    } else {
        score += 15;
    }

    if (!hasLowercase) {
        errors.push('Password must contain at least one lowercase letter (a-z)');
    } else {
        score += 15;
    }

    if (!hasNumbers) {
        errors.push('Password must contain at least one number (0-9)');
    } else {
        score += 15;
    }

    if (!hasSpecialChars) {
        errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)');
    } else {
        score += 15;
    }

    // Check against common weak passwords
    const lowerPassword = trimmedPassword.toLowerCase();
    if (COMMON_WEAK_PASSWORDS.includes(lowerPassword)) {
        errors.push('Password is too common. Please choose a more unique password');
        score = Math.max(0, score - 30);
    }

    // Additional scoring for complexity
    if (trimmedPassword.length >= 12) {
        score += 10; // Bonus for longer passwords
    }

    if (trimmedPassword.length >= 16) {
        score += 10; // Extra bonus for very long passwords
    }

    // Check for repeated characters (more than 3 consecutive)
    if (/(.)\1{3,}/.test(trimmedPassword)) {
        errors.push('Password should not contain more than 3 consecutive identical characters');
        score = Math.max(0, score - 10);
    }

    // Check for simple sequences (123, abc, qwerty patterns)
    const hasSimpleSequence = /(?:123|abc|qwe|asd|zxc)/i.test(trimmedPassword);
    if (hasSimpleSequence) {
        score = Math.max(0, score - 5);
    }

    // Determine strength based on score and errors
    let strength: 'weak' | 'fair' | 'good' | 'strong' = 'weak';
    if (errors.length === 0) {
        if (score >= 90) {
            strength = 'strong';
        } else if (score >= 70) {
            strength = 'good';
        } else if (score >= 50) {
            strength = 'fair';
        }
    }

    const isValid = errors.length === 0;

    return {
        isValid,
        errors,
        strength,
        score: Math.min(100, Math.max(0, score))
    };
};

/**
 * Get password strength color for UI display
 */
export const getPasswordStrengthColor = (strength: string): string => {
    switch (strength) {
        case 'strong':
            return 'text-green-600';
        case 'good':
            return 'text-blue-600';
        case 'fair':
            return 'text-yellow-600';
        case 'weak':
        default:
            return 'text-red-600';
    }
};

/**
 * Get password strength background color for progress bars
 */
export const getPasswordStrengthBgColor = (strength: string): string => {
    switch (strength) {
        case 'strong':
            return 'bg-green-500';
        case 'good':
            return 'bg-blue-500';
        case 'fair':
            return 'bg-yellow-500';
        case 'weak':
        default:
            return 'bg-red-500';
    }
};

/**
 * Get password requirements for display
 */
export const getPasswordRequirements = (): string[] => {
    return [
        `Minimum ${MIN_LENGTH} characters length`,
        'At least 1 uppercase letter (A-Z)',
        'At least 1 lowercase letter (a-z)',
        'At least 1 number (0-9)',
        'At least 1 special character (!@#$%^&*()_+-=[]{}|;:,.<>?)',
        'Avoid common passwords and simple patterns'
    ];
};

/**
 * Real-time password validation for form fields
 * Returns validation result with user-friendly messages
 */
export const validatePasswordRealTime = (password: string, confirmPassword?: string): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    strength: 'weak' | 'fair' | 'good' | 'strong';
    score: number;
    confirmMatch: boolean;
} => {
    const validation = validatePassword(password);
    const warnings: string[] = [];

    // Add warnings for non-critical issues
    if (password && password.length >= MIN_LENGTH && password.length < 12) {
        warnings.push('Consider using a longer password for better security');
    }

    // Check password confirmation match
    let confirmMatch = true;
    if (confirmPassword !== undefined) {
        confirmMatch = password === confirmPassword;
        if (confirmPassword && !confirmMatch) {
            validation.errors.push('Passwords do not match');
            validation.isValid = false;
        }
    }

    return {
        ...validation,
        warnings,
        confirmMatch
    };
};
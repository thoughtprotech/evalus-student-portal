import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Eye, EyeOff, Check, X, AlertCircle } from 'lucide-react';
import {
    validatePasswordRealTime,
    getPasswordStrengthColor,
    getPasswordStrengthBgColor,
    getPasswordRequirements
} from '@/utils/passwordValidation';

interface PasswordInputProps {
    value: string;
    onChange: (value: string) => void;
    onValidationChange?: (isValid: boolean, errors: string[]) => void;
    placeholder?: string;
    disabled?: boolean;
    showRequirements?: boolean;
    showStrengthIndicator?: boolean;
    confirmPassword?: string;
    onConfirmPasswordChange?: (value: string) => void;
    showConfirmPassword?: boolean;
    label?: string;
    required?: boolean;
    className?: string;
    error?: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
    value,
    onChange,
    onValidationChange,
    placeholder = "Enter password",
    disabled = false,
    showRequirements = true,
    showStrengthIndicator = true,
    confirmPassword = "",
    onConfirmPasswordChange,
    showConfirmPassword = false,
    label = "Password",
    required = false,
    className = "",
    error
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [validation, setValidation] = useState(validatePasswordRealTime(value, confirmPassword));

    // Use ref to store the latest callback to avoid dependency issues
    const onValidationChangeRef = useRef(onValidationChange);
    onValidationChangeRef.current = onValidationChange;

    // Update validation when password or confirmPassword changes
    useEffect(() => {
        const newValidation = validatePasswordRealTime(
            value,
            showConfirmPassword ? confirmPassword : undefined
        );
        setValidation(newValidation);

        // Notify parent component of validation state using ref to avoid infinite loops
        if (onValidationChangeRef.current) {
            onValidationChangeRef.current(newValidation.isValid, newValidation.errors);
        }
    }, [value, confirmPassword, showConfirmPassword]); // Removed onValidationChange from dependencies

    const requirements = getPasswordRequirements();

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (onConfirmPasswordChange) {
            onConfirmPasswordChange(e.target.value);
        }
    };

    const strengthWidthPercentage = validation.score;
    const strengthColor = getPasswordStrengthColor(validation.strength);
    const strengthBgColor = getPasswordStrengthBgColor(validation.strength);

    return (
        <div className={`w-full ${className}`}>
            {/* Password Input */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        value={value}
                        onChange={handlePasswordChange}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder={placeholder}
                        disabled={disabled}
                        className={`
              w-full px-3 py-2 pr-10 border rounded-lg transition-colors
              ${error || (!validation.isValid && value)
                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                : validation.isValid && value
                                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                                    : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                            }
              focus:ring-2 focus:ring-opacity-50 focus:outline-none
              disabled:bg-gray-100 disabled:cursor-not-allowed
            `}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                        tabIndex={-1}
                        disabled={disabled}
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>

                {/* Show external error or validation errors */}
                {(error || (!validation.isValid && value && !isFocused)) && (
                    <div className="mt-1">
                        {error && (
                            <p className="text-sm text-red-600 flex items-center gap-1">
                                <X size={16} />
                                {error}
                            </p>
                        )}
                        {!error && validation.errors.map((err, index) => (
                            <p key={index} className="text-sm text-red-600 flex items-center gap-1">
                                <X size={16} />
                                {err}
                            </p>
                        ))}
                    </div>
                )}

                {/* Show warnings */}
                {validation.warnings.length > 0 && value && (
                    <div className="mt-1">
                        {validation.warnings.map((warning, index) => (
                            <p key={index} className="text-sm text-yellow-600 flex items-center gap-1">
                                <AlertCircle size={16} />
                                {warning}
                            </p>
                        ))}
                    </div>
                )}
            </div>

            {/* Password Strength Indicator */}
            {showStrengthIndicator && value && (
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">Password Strength:</span>
                        <span className={`text-sm font-medium ${strengthColor} capitalize`}>
                            {validation.strength}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className={`${strengthBgColor} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${strengthWidthPercentage}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Confirm Password Input */}
            {showConfirmPassword && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm Password {required && <span className="text-red-500">*</span>}
                    </label>
                    <div className="relative">
                        <input
                            type={showConfirmPass ? "text" : "password"}
                            value={confirmPassword}
                            onChange={handleConfirmPasswordChange}
                            placeholder="Confirm your password"
                            disabled={disabled}
                            className={`
                w-full px-3 py-2 pr-10 border rounded-lg transition-colors
                ${!validation.confirmMatch && confirmPassword
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                    : validation.confirmMatch && confirmPassword && value
                                        ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                                }
                focus:ring-2 focus:ring-opacity-50 focus:outline-none
                disabled:bg-gray-100 disabled:cursor-not-allowed
              `}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPass(!showConfirmPass)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                            tabIndex={-1}
                            disabled={disabled}
                        >
                            {showConfirmPass ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    {/* Confirm password validation */}
                    {confirmPassword && !validation.confirmMatch && (
                        <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                            <X size={16} />
                            Passwords do not match
                        </p>
                    )}
                    {confirmPassword && validation.confirmMatch && value && (
                        <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                            <Check size={16} />
                            Passwords match
                        </p>
                    )}
                </div>
            )}

            {/* Password Requirements */}
            {showRequirements && (isFocused || (value && !validation.isValid)) && (
                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</h4>
                    <ul className="space-y-1">
                        {requirements.map((requirement, index) => {
                            // Check individual requirements
                            const isMinLength = value.length >= 8;
                            const hasUppercase = /[A-Z]/.test(value);
                            const hasLowercase = /[a-z]/.test(value);
                            const hasNumbers = /\d/.test(value);
                            const hasSpecialChars = /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(value);

                            let isMet = false;
                            switch (index) {
                                case 0:
                                    isMet = isMinLength;
                                    break;
                                case 1:
                                    isMet = hasUppercase;
                                    break;
                                case 2:
                                    isMet = hasLowercase;
                                    break;
                                case 3:
                                    isMet = hasNumbers;
                                    break;
                                case 4:
                                    isMet = hasSpecialChars;
                                    break;
                                case 5:
                                    // For common passwords, we'll show as met if no error about common passwords
                                    isMet = !validation.errors.some(err => err.includes('too common'));
                                    break;
                            }

                            return (
                                <li key={index} className={`text-sm flex items-center gap-2 ${isMet ? 'text-green-600' : 'text-gray-600'
                                    }`}>
                                    {isMet ? <Check size={16} /> : <X size={16} />}
                                    {requirement}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default PasswordInput;
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import PasswordInput from "@/components/PasswordInput";
import { validatePassword } from "@/utils/passwordValidation";

interface ResetPasswordForm {
    newPassword: string;
    confirmPassword: string;
}

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<"email" | "reset">("email");
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Password reset form state
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordValid, setPasswordValid] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            setError("Email is required");
            return;
        }

        if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/.test(email)) {
            setError("Please enter a valid email address");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            // TODO: Implement actual forgot password API call
            // For now, we'll simulate the process and move to password reset
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

            // In a real implementation, this would send an email with a reset token
            // and the user would click a link that brings them to the reset form
            setStep("reset");
        } catch (err) {
            setError("Failed to send reset email. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePasswordValidationChange = useCallback((isValid: boolean, errors: string[]) => {
        setPasswordValid(isValid);
        setPasswordErrors(errors);
    }, []);

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!passwordValid || !password) {
            setError("Please enter a valid password that meets all requirements");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            // TODO: Implement actual password reset API call
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

            setSuccess(true);

            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push("/");
            }, 3000);
        } catch (err) {
            setError("Failed to reset password. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
                        <h2 className="mt-6 text-3xl font-bold text-gray-900">
                            Password Reset Successfully
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Your password has been reset. You will be redirected to the login page shortly.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <Link
                        href="/"
                        className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500 mb-6"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Login
                    </Link>

                    <div className="text-center">
                        <Mail className="mx-auto h-12 w-12 text-indigo-600" />
                        <h2 className="mt-6 text-3xl font-bold text-gray-900">
                            {step === "email" ? "Forgot your password?" : "Reset your password"}
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            {step === "email"
                                ? "Enter your email address and we'll help you reset your password."
                                : "Enter your new password below."
                            }
                        </p>
                    </div>
                </div>

                {step === "email" ? (
                    <form className="mt-8 space-y-6" onSubmit={handleEmailSubmit}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Enter your email address"
                            />
                        </div>

                        {error && (
                            <div className="text-red-600 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${isSubmitting
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                                    }`}
                            >
                                {isSubmitting ? 'Sending...' : 'Send Reset Instructions'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handlePasswordReset}>
                        <div>
                            <PasswordInput
                                value={password}
                                onChange={setPassword}
                                onValidationChange={handlePasswordValidationChange}
                                confirmPassword={confirmPassword}
                                onConfirmPasswordChange={setConfirmPassword}
                                showConfirmPassword={true}
                                placeholder="Enter a strong new password"
                                label="New Password"
                                required={true}
                                showRequirements={true}
                                showStrengthIndicator={true}
                            />
                        </div>

                        {error && (
                            <div className="text-red-600 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={isSubmitting || !passwordValid || !password || !confirmPassword || password !== confirmPassword}
                                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${isSubmitting || !passwordValid || !password || !confirmPassword || password !== confirmPassword
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                                    }`}
                            >
                                {isSubmitting ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </div>
                    </form>
                )}

                <div className="text-center">
                    <p className="text-sm text-gray-600">
                        Remember your password?{' '}
                        <Link href="/" className="font-medium text-indigo-600 hover:text-indigo-500">
                            Sign in here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
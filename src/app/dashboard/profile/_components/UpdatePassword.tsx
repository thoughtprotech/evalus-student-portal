"use client";

import { SubmitHandler, useForm } from "react-hook-form";
import Modal from "@/components/Modal";
import { useState, useCallback } from "react";
import { Eye, EyeOff } from "lucide-react";
import PasswordInput from "@/components/PasswordInput";
import { validatePassword } from "@/utils/passwordValidation";

type PasswordUpdateForm = {
  newPassword: string;
  confirmPassword: string;
};

export default function UpdatePassword({
  handleUserUpdate,
}: {
  handleUserUpdate: (text: string, field: string) => void;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordValid, setPasswordValid] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    register,
  } = useForm<PasswordUpdateForm>({
    mode: "onBlur",
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Handle password validation and submission using the new PasswordInput component
  const handlePasswordValidationChange = useCallback((isValid: boolean, errors: string[]) => {
    setPasswordValid(isValid);
    setPasswordErrors(errors);
  }, []);

  const handlePasswordSubmit = async () => {
    if (!passwordValid || !password) {
      return;
    }

    // Validate that passwords match
    if (password !== confirmPassword) {
      return;
    }

    setIsSubmitting(true);
    try {
      handleUserUpdate(password, "password");
      handleCloseForm();
    } catch (error) {
      console.error("Password update failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit: SubmitHandler<PasswordUpdateForm> = async (data) => {
    // This is kept for backward compatibility if needed
    const validation = validatePassword(data.newPassword);
    if (!validation.isValid) {
      return;
    }

    handleUserUpdate(data.newPassword, "password");
    setIsModalOpen(false);
    reset();
  };

  const handleCloseForm = () => {
    setIsModalOpen(false);
    setPassword("");
    setConfirmPassword("");
    setPasswordValid(false);
    setPasswordErrors([]);
    reset(); // Reset form fields
  };

  return (
    <>
      <button
        className="w-full px-4 py-2 rounded-md shadow-md cursor-pointer border border-gray-300 whitespace-nowrap flex items-center justify-center"
        onClick={() => setIsModalOpen(true)}
      >
        <span className="text-indigo-500 font-bold text-sm">Update Password</span>
      </button>
      <Modal
        title="Update Password"
        isOpen={isModalOpen}
        closeModal={handleCloseForm}
        className="max-w-lg"
      >
        <div className="space-y-4">
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

          <div className="w-full flex gap-4 mt-6">
            <button
              className={`w-full px-4 py-2 rounded-md shadow-md font-bold transition-colors ${passwordValid && password && confirmPassword && password === confirmPassword
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                  : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                }`}
              onClick={handlePasswordSubmit}
              disabled={!passwordValid || !password || !confirmPassword || password !== confirmPassword || isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </button>
            <button
              className="w-full px-4 py-2 rounded-md cursor-pointer shadow-md bg-gray-300 hover:bg-gray-400 font-bold transition-colors"
              onClick={handleCloseForm}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

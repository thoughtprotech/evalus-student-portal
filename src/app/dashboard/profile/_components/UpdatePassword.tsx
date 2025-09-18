"use client";

import { SubmitHandler, useForm } from "react-hook-form";
import Modal from "@/components/Modal";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordUpdateForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export default function UpdatePassword({
  handleUserUpdate,
}: {
  handleUserUpdate: (text: string, field: string) => void;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const {
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    register,
  } = useForm<PasswordUpdateForm>({
    mode: "onBlur", // Validation will trigger when input loses focus
  });

  const onSubmit: SubmitHandler<PasswordUpdateForm> = async (data) => {
    // Here you'd make the API call to update the password
    handleUserUpdate(data.newPassword, "password");
    setIsModalOpen(false); // Close the modal after submit
    reset(); // Reset form fields
  };

  const handleCloseForm = () => {
    setIsModalOpen(false);
    reset(); // Reset form fields
  };

  return (
    <>
      <button
        className="px-4 py-2 rounded-md shadow-md cursor-pointer border border-gray-300"
        onClick={() => setIsModalOpen(true)}
      >
        <h1 className="text-indigo-500 font-bold">Update Password</h1>
      </button>
      <Modal
        title="Update Password"
        isOpen={isModalOpen}
        closeModal={handleCloseForm}
        className="max-w-md"
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {/* Current Password */}
          <div className="flex flex-col items-start gap-2">
            <label
              htmlFor="currentPassword"
              className="block text-sm font-semibold"
            >
              Current Password <span className="text-red-500">*</span>
            </label>
            <div className="relative w-full">
              <input
                id="currentPassword"
                type={showCurrent ? "text" : "password"}
                className="w-full p-2 border border-gray-300 shadow-md rounded-md pr-10"
                {...register("currentPassword", {
                  required: "Current password is required",
                })}
              />
              <button
                type="button"
                className="absolute right-2 top-2 text-gray-500"
                tabIndex={-1}
                onClick={() => setShowCurrent((v) => !v)}
              >
                {showCurrent ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-red-500 text-xs font-bold">
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          {/* New Password */}
          <div className="flex flex-col items-start gap-2">
            <label
              htmlFor="newPassword"
              className="block text-sm font-semibold"
            >
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative w-full">
              <input
                id="newPassword"
                type={showNew ? "text" : "password"}
                className="w-full p-2 border border-gray-300 shadow-md rounded-md pr-10"
                {...register("newPassword", {
                  required: "New password is required",
                })}
              />
              <button
                type="button"
                className="absolute right-2 top-2 text-gray-500"
                tabIndex={-1}
                onClick={() => setShowNew((v) => !v)}
              >
                {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-red-500 text-xs font-bold">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col items-start gap-2">
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-semibold"
            >
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative w-full">
              <input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                className="w-full p-2 border border-gray-300 shadow-md rounded-md pr-10"
                {...register("confirmPassword", {
                  required: "Confirm password is required",
                  validate: (value) =>
                    value === watch("newPassword") || "Passwords do not match",
                })}
              />
              <button
                type="button"
                className="absolute right-2 top-2 text-gray-500"
                tabIndex={-1}
                onClick={() => setShowConfirm((v) => !v)}
              >
                {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs font-bold">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="w-full flex gap-4">
            <button
              className="w-full px-4 py-2 rounded-md shadow-md cursor-pointer bg-blue-600 text-white font-bold"
              type="submit"
            >
              Save
            </button>
            <button
              className="w-full px-4 py-2 rounded-md cursor-pointer shadow-md bg-gray-300 font-bold"
              onClick={handleCloseForm}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

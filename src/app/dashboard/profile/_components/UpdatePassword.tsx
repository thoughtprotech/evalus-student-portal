"use client";

import { SubmitHandler, useForm } from "react-hook-form";
import Modal from "@/components/Modal";
import { useState } from "react";

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
    handleUserUpdate(data.newPassword, "password");
    setIsModalOpen(false);
    reset();
  };

  const handleCloseForm = () => {
    setIsModalOpen(false);
    reset(); // Reset form fields
  };

  return (
    <>
      <button
        className="px-4 py-2 rounded-md shadow-md cursor-pointer border border-gray-300 text-indigo-600 font-semibold hover:bg-gray-50"
        onClick={() => setIsModalOpen(true)}
      >
        Update Password
      </button>
      <Modal
        title="Update Password"
        isOpen={isModalOpen}
        closeModal={handleCloseForm}
        className="max-w-lg"
      >
        <form className="space-y-5 text-left" onSubmit={handleSubmit(onSubmit)}>
          {/* Current Password */}
          <div className="flex flex-col items-start gap-2">
            <label
              htmlFor="currentPassword"
              className="block text-sm font-semibold"
            >
              Current Password <span className="text-red-500">*</span>
            </label>
            <input
              id="currentPassword"
              type="password"
              className="w-full p-2 border border-gray-300 shadow-md rounded-md"
              {...register("currentPassword", {
                required: "Current password is required",
              })}
            />
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
            <input
              id="newPassword"
              type="password"
              className="w-full p-2 border border-gray-300 shadow-md rounded-md"
              {...register("newPassword", {
                required: "New password is required",
                minLength: { value: 6, message: "Password must be at least 6 characters" },
              })}
            />
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
            <input
              id="confirmPassword"
              type="password"
              className="w-full p-2 border border-gray-300 shadow-md rounded-md"
              {...register("confirmPassword", {
                required: "Confirm password is required",
                validate: (value) =>
                  value === watch("newPassword") || "Passwords do not match",
              })}
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs font-bold">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="w-full flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium border border-gray-300"
              onClick={handleCloseForm}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow"
              type="submit"
            >
              Save
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

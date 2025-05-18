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
    // Here you'd make the API call to update the password
    console.log("Updated password:", data);
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
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {/* Current Password */}
          <div className="flex flex-col items-start gap-2">
            <label
              htmlFor="currentPassword"
              className="block text-sm font-semibold"
            >
              Current Password
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
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              className="w-full p-2 border border-gray-300 shadow-md rounded-md"
              {...register("newPassword", {
                required: "New password is required",
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
              Confirm Password
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

          <div className="w-full flex gap-4">
            <button
              className="w-full px-4 py-2 rounded-md shadow-md cursor-pointer bg-green-600 text-white font-bold"
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

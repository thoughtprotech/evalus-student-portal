"use client";

import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";

import { useRouter } from "next/navigation";
import { loginAction } from "./actions/authentication/login";
import toast from "react-hot-toast";

type FormData = {
  username: string;
  password: string;
};

export default function Home() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();
  const router = useRouter();

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      const formData = new FormData();
      formData.append("username", data.username);
      formData.append("password", data.password);
      const res = await loginAction(formData);
      if (res.status === 200) {
        if (res.data!.role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
        toast.success(res.message!);
      } else {
        toast.error(res.errorMessage!);
      }
    } catch (error) {
      toast.error("Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-indigo-100 p-6">
      <div className="bg-white rounded-lg shadow-md max-w-md w-full p-10">
        <div className="mb-8 text-center">
          {/* Branding Section */}
          <div className="flex items-end justify-center gap-1">
            <h1 className="text-5xl font-bold text-indigo-700 transition duration-300">
              E
              <span className="text-5xl font-bold text-gray-800 transition duration-300">
                valus
              </span>
            </h1>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            Welcome back! Please sign in to your account.
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              {...register("username", { required: "Username is required" })}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-400 focus:border-indigo-400"
              placeholder="you@example.com"
            />
            {errors.username && (
              <p className="mt-1 text-xs text-red-600">
                {errors.username.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password", { required: "Password is required" })}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-400 focus:border-indigo-400"
              placeholder="********"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 md:flex md:flex-row items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-indigo-500 focus:ring-indigo-400 border-gray-300 rounded"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-700"
              >
                Remember me
              </label>
            </div>
            <div className="text-sm">
              <a
                href="#"
                className="font-medium text-indigo-500 hover:text-indigo-600"
              >
                Forgot your password?
              </a>
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-semibold rounded-md text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 transition-colors cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

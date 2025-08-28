"use client";

import Link from "next/link";

export type Props = {
  title?: string;
  detail?: string;
  linkHref?: string;
  linkText?: string;
  variant?: "plain" | "attractive";
};

export default function ImportantInstructions({
  title = "Important Instructions",
  detail = "This will help in making a test by adding questions, amending parameters, assigning of tests and sharing reports symmetrically with the candidates.",
  linkHref = "",
  linkText = "",
  variant = "plain",
}: Props) {
  return (
    <div className="flex h-full">
      <div className={
        variant === "attractive"
          ? "rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-100 p-6 w-full h-full shadow-lg flex flex-col justify-center items-center"
          : "rounded-md border bg-white p-4 w-full h-full"
      }>
        <div className={
          variant === "attractive"
            ? "text-lg font-bold text-blue-700 mb-2 flex items-center gap-2"
            : "text-sm font-semibold text-gray-800 mb-1"
        }>
          {variant === "attractive" && (
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 2" /></svg>
          )}
          {title}
        </div>
        <div className={
          variant === "attractive"
            ? "text-base text-blue-900 leading-relaxed mb-3 text-center"
            : "text-xs text-gray-600 leading-5"
        }>{detail}</div>
        {linkHref && linkText ? (
          <Link href={linkHref} className={
            variant === "attractive"
              ? "inline-block mt-3 text-sm font-semibold text-blue-600 hover:text-blue-800 underline"
              : "inline-block mt-3 text-xs text-indigo-600 hover:text-indigo-700"
          }>
            {linkText}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

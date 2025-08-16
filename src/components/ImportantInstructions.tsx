"use client";

import Link from "next/link";

type Props = {
  title?: string;
  detail?: string;
  linkHref?: string;
  linkText?: string;
};

export default function ImportantInstructions({
  title = "Important Instructions",
  detail = "This will help in making a test by adding questions, amending parameters, assigning of tests and sharing reports symmetrically with the candidates.",
  linkHref = "#",
  linkText = "Read more",
}: Props) {
  return (
    <div className="hidden lg:flex h-full">
      <div className="rounded-md border bg-white p-4 w-full h-full">
        <div className="text-sm font-semibold text-gray-800 mb-1">{title}</div>
        <div className="text-xs text-gray-600 leading-5">{detail}</div>
        {linkHref && linkText ? (
          <Link href={linkHref} className="inline-block mt-3 text-xs text-indigo-600 hover:text-indigo-700">
            {linkText}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

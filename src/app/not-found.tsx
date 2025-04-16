import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="h-screen flex flex-col justify-center items-center gap-5 bg-white p-4 text-center">
      <div className="flex items-end gap-1">
        <h1 className="text-5xl font-bold text-indigo-700 transition duration-300">
          E
          <span className="text-5xl font-bold text-gray-800 transition duration-300">
            valus
          </span>
        </h1>
      </div>
      <div className="flex flex-col items-center">
        <h1 className="text-4xl font-semibold text-gray-800">
          404 - Page Not Found
        </h1>
        <p className="text-lg text-gray-600 mt-4">
          The page you are looking for doesn't exist.
        </p>
        <Link
          href="/dashboard"
          className="w-full flex justify-center font-bold duration-300 mt-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
}

import {
  ShieldCheck,
  Download,
  ArrowLeft,
  Lock,
  FileCheck,
} from "lucide-react";
import Link from "next/link";

export default function UseSEBPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="backdrop-blur-2xl bg-white/60 shadow-xl border border-white/30 rounded-3xl p-8 w-full max-w-3xl">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <ShieldCheck className="w-12 h-12 text-blue-600 drop-shadow-sm" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Safe Exam Browser Needed
              </h1>
              <p className="text-gray-600 text-xs">
                Complete these quick steps to start your secure exam.
              </p>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/70 border border-gray-300 hover:bg-white transition font-medium text-gray-700 shadow-sm self-start sm:self-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* Step 1 */}
          <StepCard
            icon={<Lock className="w-7 h-7 text-blue-600" />}
            title="Install SEB"
            description="Download and install Safe Exam Browser."
            link={{
              text: "Click to Download",
              href: "https://safeexambrowser.org/download",
              color: "text-blue-600",
            }}
          />

          {/* Step 2 */}
          <StepCard
            icon={<Download className="w-7 h-7 text-green-600" />}
            title="Get Exam File"
            description="Download your exam configuration file."
            link={{
              text: "Click to Download .SEB",
              href: "/seb/EvalusSEBConfig.seb",
              color: "text-green-600",
            }}
          />

          {/* Step 3 */}
          <StepCard
            icon={<FileCheck className="w-7 h-7 text-purple-600" />}
            title="Open & Begin"
            description="Open the file to launch SEB and start."
            readyText="Ready"
            readyColor="text-purple-600"
          />

        </div>
      </div>
    </div>
  );
}

/* Step Card Component */
function StepCard({ icon, title, description, link, readyText, readyColor }: any) {
  return (
    <div className="flex flex-col items-center text-center bg-white/50 backdrop-blur p-4 rounded-2xl shadow-sm hover:shadow-md transition">
      <div className="mb-2">{icon}</div>

      <h3 className="font-semibold text-sm text-gray-800">{title}</h3>

      <p className="text-gray-600 text-xs mt-1 mb-3 leading-snug px-1">
        {description}
      </p>

      {link && (
        <a
          href={link.href}
          target="_blank"
          className={`${link.color} text-xs font-medium hover:underline`}
        >
          {link.text}
        </a>
      )}

      {readyText && (
        <span className={`${readyColor} text-xs font-semibold`}>
          {readyText}
        </span>
      )}
    </div>
  );
}

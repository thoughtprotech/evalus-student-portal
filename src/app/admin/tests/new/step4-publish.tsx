"use client";

import ImportantInstructions from "@/components/ImportantInstructions";
import { useRouter } from "next/navigation";
import { CheckCircle2, Share2, Eye, Send, ShieldCheck } from "lucide-react";

export default function Step4Publish() {
  const router = useRouter();

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left: Cards (similar styling to Step 3) */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card: Pre-publish check */}
            <div className="rounded-md border bg-gray-50">
              <div className="p-8 text-center">
                <ShieldCheck className="mx-auto mb-4 h-16 w-16 text-gray-400" strokeWidth={1.5} />
                <p className="text-sm text-gray-600">
                  Validate settings and questions before making the test live. Run basic checks for timing,
                  navigation, and visibility.
                </p>
              </div>
              <div className="px-4 pb-4">
                <button className="w-full rounded bg-indigo-600 hover:bg-indigo-700 text-white py-2 text-sm">
                  Run Pre‑publish Check
                </button>
              </div>
            </div>

            {/* Card: Preview */}
            <div className="rounded-md border bg-gray-50">
              <div className="p-8 text-center">
                <Eye className="mx-auto mb-4 h-16 w-16 text-gray-400" strokeWidth={1.5} />
                <p className="text-sm text-gray-600">
                  Preview the candidate experience before publishing. Opens a read-only view of the test.
                </p>
              </div>
              <div className="px-4 pb-4">
                <button className="w-full rounded bg-gray-800 hover:bg-black text-white py-2 text-sm">
                  Preview Test
                </button>
              </div>
            </div>

            {/* Card: Publish */}
            <div className="rounded-md border bg-gray-50">
              <div className="p-8 text-center">
                <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-gray-400" strokeWidth={1.5} />
                <p className="text-sm text-gray-600">
                  Make the test available to candidates. You can still edit settings later if needed.
                </p>
              </div>
              <div className="px-4 pb-4">
                <button className="w-full rounded bg-green-600 hover:bg-green-700 text-white py-2 text-sm">
                  Publish Test
                </button>
              </div>
            </div>

            {/* Card: Share/Invite (wraps next row) */}
            <div className="rounded-md border bg-gray-50">
              <div className="p-8 text-center">
                <Share2 className="mx-auto mb-4 h-16 w-16 text-gray-400" strokeWidth={1.5} />
                <p className="text-sm text-gray-600">
                  Get a shareable link or invite candidates via email after publishing.
                </p>
              </div>
              <div className="px-4 pb-4">
                <button disabled className="w-full rounded bg-gray-300 text-white py-2 text-sm cursor-not-allowed">
                  Invite Candidates
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Important Instructions */}
        <div className="lg:col-span-1">
          <ImportantInstructions
            title="Publish Guidance"
            detail="Preview and validate your test before publishing. Once published, you can assign to candidates or share a link from the Assign step."
          />
        </div>
      </div>
    </div>
  );
}

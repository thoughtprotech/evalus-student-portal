"use client";

// Instruction panel hidden for Step 4 per requirement
import { useRouter } from "next/navigation";
import YesNoToggle from "@/components/ui/YesNoToggle";
import { useEffect, useState } from "react";
import { useTestDraft } from "@/contexts/TestDraftContext";

// helpers for datetime-local value mapping
function toLocalDateTimeInputValue(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIsoFromLocal(local: string): string | null {
  if (!local || local.trim() === "") return null;
  const d = new Date(local);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

type Props = {
  registerValidator?: (fn: () => boolean) => void;
};

export default function Step4Publish({ registerValidator }: Props) {
  const router = useRouter();
  const { draft, setDraft } = useTestDraft();

  const [published, setPublished] = useState(false);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [extraTime, setExtraTime] = useState("");
  const [entryRestriction, setEntryRestriction] = useState("");
  const [startError, setStartError] = useState<string | null>(null);
  const [endError, setEndError] = useState<string | null>(null);

  // hydrate from draft
  useEffect(() => {
    const status = (draft?.TestStatus ?? "New").toString().toLowerCase();
    setPublished(status === "published");
    setStartAt(toLocalDateTimeInputValue(draft?.TestStartDate));
    setEndAt(toLocalDateTimeInputValue(draft?.TestEndDate));
    setExtraTime(
      draft?.ExtraTimeDuration != null && draft.ExtraTimeDuration !== undefined
        ? String(draft.ExtraTimeDuration)
        : ""
    );
    setEntryRestriction(
      draft?.EntryRestrictionDuration != null && draft.EntryRestrictionDuration !== undefined
        ? String(draft.EntryRestrictionDuration)
        : ""
    );
  }, [draft?.TestStatus, draft?.TestStartDate, draft?.TestEndDate, draft?.ExtraTimeDuration]);

  // expose validator to parent so navigation can trigger it
  useEffect(() => {
    if (!registerValidator) return;
    const validate = () => {
      let ok = true;
      setStartError(null);
      setEndError(null);
      if (!startAt) { setStartError("Start date/time is required."); ok = false; }
      if (!endAt) { setEndError("End date/time is required."); ok = false; }
      const s = startAt ? new Date(startAt).getTime() : NaN;
      const e = endAt ? new Date(endAt).getTime() : NaN;
      if (startAt) {
        if (isNaN(s)) { setStartError("Invalid start date/time."); ok = false; }
      }
      if (startAt && endAt) {
        if (!isNaN(s) && !isNaN(e) && e <= s) { setEndError("End date/time must be later than start date/time."); ok = false; }
      }
      return ok;
    };
    registerValidator(() => validate());
  }, [registerValidator, startAt, endAt]);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 gap-4">
        {/* Publish form */}
        <div>
          <section className="border rounded-lg bg-white shadow-sm">
            <div className="bg-blue-600 text-white px-4 py-2 text-sm font-semibold">Publish Settings</div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-800">Publish Test</span>
                <YesNoToggle
                  size="sm"
                  segmentWidthClass="w-20"
                  value={published}
                  onChange={(v) => {
                    setPublished(v);
                    setDraft((d: any) => ({ ...d, TestStatus: v ? "Published" : "New" }));
                  }}
                />
              </div>
              <div></div>

              <div>
                <label className="block text-gray-800 mb-1">Test Start Date & Time</label>
                <input
                  type="datetime-local"
                  className={`w-full border rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:border-blue-500 focus:ring-blue-500 ${startError ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-300"}`}
                  value={startAt}
                  onChange={(e) => {
                    const v = e.target.value;
                    setStartAt(v);
                    setDraft((d: any) => ({ ...d, TestStartDate: toIsoFromLocal(v) }));
                    // field-level validation
                    if (!v) { setStartError("Start date/time is required."); }
                    else {
                      const s = new Date(v).getTime();
                      if (isNaN(s)) setStartError("Invalid start date/time.");
                      else setStartError(null);
                    }
                    // also ensure end > start if end exists
                    if (endAt && v) {
                      const s = new Date(v).getTime();
                      const eMs = new Date(endAt).getTime();
                      if (!isNaN(s) && !isNaN(eMs) && eMs <= s) setEndError("End date/time must be later than start date/time.");
                      else setEndError(null);
                    }
                  }}
                />
                {startError && (
                  <p className="mt-1 text-sm text-red-600">{startError}</p>
                )}
              </div>
              <div>
                <label className="block text-gray-800 mb-1">Test End Date & Time</label>
                <input
                  type="datetime-local"
                  className={`w-full border rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${endError ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-300"}`}
                  value={endAt}
                  onChange={(e) => {
                    const v = e.target.value;
                    setEndAt(v);
                    // validate
                    if (!v) {
                      setEndError("End date/time is required.");
                      setDraft((d: any) => ({ ...d, TestEndDate: null }));
                      return;
                    }
                    if (startAt) {
                      const s = new Date(startAt).getTime();
                      const eMs = new Date(v).getTime();
                      if (!isNaN(s) && !isNaN(eMs) && eMs <= s) {
                        setEndError("End date/time must be later than start date/time.");
                        setDraft((d: any) => ({ ...d, TestEndDate: null }));
                        return;
                      }
                    }
                    setEndError(null);
                    setDraft((d: any) => ({ ...d, TestEndDate: toIsoFromLocal(v) }));
                  }}
                />
                {endError && (
                  <p className="mt-1 text-sm text-red-600">{endError}</p>
                )}
              </div>

              <div>
                <label className="block text-gray-800 mb-1">Entry Restricted (mins)</label>
                <input
                  type="number"
                  min={0}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={entryRestriction}
                  onChange={(e) => {
                    const v = e.target.value;
                    setEntryRestriction(v);
                    setDraft((d: any) => ({
                      ...d,
                      EntryRestrictionDuration: v.trim() === "" ? null : Number(v),
                    }));
                  }}
                  placeholder="e.g., 15"
                />
                <p className="mt-1 text-xs text-gray-600">After a certain period of time, candidates will not be able to enter or login.</p>
              </div>

              <div>
                <label className="block text-gray-800 mb-1">Additional Time (mins)</label>
                <input
                  type="number"
                  min={0}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={extraTime}
                  onChange={(e) => {
                    const v = e.target.value;
                    setExtraTime(v);
                    setDraft((d: any) => ({
                      ...d,
                      ExtraTimeDuration: v.trim() === "" ? null : Number(v),
                    }));
                  }}
                  placeholder="e.g., 5"
                />
                <p className="mt-1 text-xs text-gray-600">To prevent any candidate from missing their test</p>
              </div>
            </div>
          </section>
        </div>

        {/* Instruction panel removed for this step */}
      </div>
    </div>
  );
}

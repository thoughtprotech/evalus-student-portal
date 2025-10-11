"use client";

import React, { useState } from "react";
import Toast from "@/components/Toast";
import getCookie from "@/utils/getCookie";

type ValidationError = { row: number; messages: string[] };
type ValidationResponse = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: ValidationError[];
};

type ImportFailure = { row: number; error: string };
type ImportResponse = {
  totalRows: number;
  createdCount: number;
  failedCount: number;
  failures: ImportFailure[];
};

export default function CandidateImport() {
  const [file, setFile] = useState<File | null>(null);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [validation, setValidation] = useState<ValidationResponse | null>(null);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" | "warning" } | null>(null);

  const downloadTemplate = async () => {
    try {
      const token = await getCookie("token");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`/api/proxy/api/CandidateRegistration/bulk/template`, {
        method: "GET",
        headers,
      });

      if (!res.ok) {
        setToast({ message: `Failed to download template: ${res.statusText}`, type: "error" });
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "candidate-import-template.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setToast({ message: "Template downloaded", type: "success" });
    } catch (err: any) {
      setToast({ message: err?.message ?? "Download failed", type: "error" });
    }
  };

  const onFileChange = (f?: File) => {
    setFile(f ?? null);
    setValidation(null);
    setImportResult(null);
  };

  const validateFile = async () => {
    if (!file) return;
    setValidating(true);
    setValidation(null);
    setImportResult(null);
    try {
      const token = await getCookie("token");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const fd = new FormData();
      fd.append("file", file, file.name);

  const res = await fetch(`/api/proxy/api/CandidateRegistration/bulk/validate`, {
        method: "POST",
        headers,
        body: fd,
      });

      const status = res.status;
      const json = await res.json().catch(() => null);

      if (status === 200) {
        setValidation(json?.data ?? null);
        setToast({ message: "Validation passed", type: "success" });
      } else if (status === 422) {
        setValidation(json?.data ?? null);
        setToast({ message: "Validation found issues", type: "warning" });
      } else {
        setToast({ message: json?.message ?? `Validate failed: ${res.statusText}`, type: "error" });
      }
    } catch (err: any) {
      setToast({ message: err?.message ?? "Validation failed", type: "error" });
    } finally {
      setValidating(false);
    }
  };

  const importFile = async () => {
    if (!file || !validation) return;
    // Ensure no validation errors
    if ((validation.invalidRows ?? 0) > 0) {
      setToast({ message: "Fix validation errors before importing", type: "error" });
      return;
    }
    setImporting(true);
    setImportResult(null);
    try {
      const token = await getCookie("token");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const fd = new FormData();
      fd.append("file", file, file.name);

  const res = await fetch(`/api/proxy/api/CandidateRegistration/bulk/import`, {
        method: "POST",
        headers,
        body: fd,
      });

      const status = res.status;
      const json = await res.json().catch(() => null);

      if (status === 201 || status === 207) {
        setImportResult(json?.data ?? null);
        setToast({ message: status === 201 ? "Import completed" : "Import partially completed", type: "success" });
      } else {
        setToast({ message: json?.message ?? `Import failed: ${res.statusText}`, type: "error" });
      }
    } catch (err: any) {
      setToast({ message: err?.message ?? "Import failed", type: "error" });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-md border shadow-sm">
      <h3 className="text-lg font-medium mb-2">Candidate Import</h3>
      <p className="text-sm text-gray-600 mb-3">Use the provided template. "Active" and "Handicapped" columns accept Yes/No. "Company" and "Candidate Groups" accept names.</p>

      <div className="flex gap-2 mb-3">
        <button onClick={downloadTemplate} className="px-3 py-2 bg-blue-600 text-white rounded-md">Download Template</button>
        <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer">
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => onFileChange(e.target.files?.[0])}
            className="hidden"
          />
          <span className="text-sm">{file ? file.name : "Choose .xlsx file"}</span>
        </label>
        <button
          onClick={validateFile}
          disabled={!file || validating}
          className="px-3 py-2 bg-yellow-500 text-white rounded-md disabled:opacity-50"
        >
          {validating ? "Validating..." : "Validate"}
        </button>
        <button
          onClick={importFile}
          disabled={!file || !!validation?.invalidRows || importing || !validation}
          className="px-3 py-2 bg-green-600 text-white rounded-md disabled:opacity-50"
        >
          {importing ? "Importing..." : "Import"}
        </button>
      </div>

      {validation && (
        <div className="mb-3">
          <div className="text-sm text-gray-700">Validation summary: {validation.totalRows} rows — {validation.validRows} valid, {validation.invalidRows} invalid</div>
          {validation.errors && validation.errors.length > 0 && (
            <div className="mt-2 border rounded p-2 bg-gray-50 max-h-52 overflow-auto">
              {validation.errors.map((err) => (
                <div key={err.row} className="text-sm text-red-700 mb-1">
                  <strong>Row {err.row}:</strong>
                  <ul className="list-disc list-inside ml-3">
                    {err.messages.map((m, i) => (<li key={i}>{m}</li>))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {importResult && (
        <div className="mt-3">
          <div className="text-sm text-gray-700">Import: {importResult.totalRows} rows — {importResult.createdCount} created, {importResult.failedCount} failed</div>
          {importResult.failures && importResult.failures.length > 0 && (
            <div className="mt-2 border rounded p-2 bg-gray-50 max-h-52 overflow-auto">
              {importResult.failures.map((f) => (
                <div key={f.row} className="text-sm text-red-700 mb-1">Row {f.row}: {f.error}</div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-3">
        <small className="text-xs text-gray-500">Notes: Company and Group names must match existing names. Unknown names appear in validation errors. Groups may be parent names; backend expands descendants.</small>
      </div>

      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toast ? (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} durationMs={3000} />
        ) : null}
      </div>
    </div>
  );
}

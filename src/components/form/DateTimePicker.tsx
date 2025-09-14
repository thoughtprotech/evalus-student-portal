"use client";

import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export type DateTimePickerProps = {
  label: string;
  value?: string; // ISO or empty
  onChange: (iso: string) => void;
  placeholder?: string;
  minDateTime?: string; // ISO
  maxDateTime?: string; // ISO
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

// Utility to parse an ISO string (or empty) to Date | null
function parseISO(val?: string): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

// Utility to format Date -> ISO string without milliseconds
function toIso(d: Date | null): string {
  if (!d) return "";
  return new Date(d.getTime()).toISOString();
}

export default function DateTimePicker({
  label,
  value,
  onChange,
  placeholder = "Select date & time",
  minDateTime,
  maxDateTime,
  required,
  disabled,
  className = "",
}: DateTimePickerProps) {
  const selected = parseISO(value);
  const min = parseISO(minDateTime) || undefined;
  const max = parseISO(maxDateTime) || undefined;

  return (
    <div className={`w-full ${className || ""}`}>
      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <DatePicker
        selected={selected}
        onChange={(d) => onChange(toIso(d))}
        showTimeSelect
        timeIntervals={15}
        dateFormat="dd/MM/yyyy, hh:mm aa"
        placeholderText={placeholder}
        className="w-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-md px-3 py-2.5 text-[15px] bg-white"
        wrapperClassName="w-full"
        minDate={min}
        maxDate={max}
        disabled={disabled}
        isClearable
        popperClassName="z-50"
        popperPlacement="bottom-start"
      />
    </div>
  );
}

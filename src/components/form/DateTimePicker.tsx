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

    // If the stored value is in our custom format (preserving local time)
    // we need to parse it correctly to show the intended time
    if (val.endsWith('Z')) {
        // Parse the ISO string but interpret as local time
        const isoMatch = val.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.000Z$/);
        if (isoMatch) {
            const [, year, month, day, hours, minutes, seconds] = isoMatch;
            // Create date using local timezone interpretation
            const d = new Date(
                parseInt(year),
                parseInt(month) - 1, // Month is 0-indexed
                parseInt(day),
                parseInt(hours),
                parseInt(minutes),
                parseInt(seconds)
            );
            return isNaN(d.getTime()) ? null : d;
        }
    }

    // Fallback to standard Date parsing
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
}

// Utility to format Date -> ISO string preserving local time
function toIso(d: Date | null): string {
    if (!d) return "";

    // Problem: toISOString() converts to UTC, changing the user's intended time
    // Solution: Create ISO string that preserves the local date/time values
    const pad = (n: number) => String(n).padStart(2, '0');

    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());

    // Create ISO string without timezone conversion
    // This preserves the exact date/time the user selected
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
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
                onChange={(d: Date | null) => {
                    const isoString = toIso(d);
                    onChange(isoString);
                }}
                showTimeSelect
                timeIntervals={15}
                timeFormat="HH:mm"
                dateFormat="dd/MM/yyyy HH:mm"
                placeholderText={placeholder}
                className="w-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-md px-3 py-2.5 text-[15px] bg-white"
                wrapperClassName="w-full"
                minDate={min}
                maxDate={max}
                disabled={disabled}
                isClearable
                popperClassName="z-50"
                popperPlacement="bottom-start"
                timeCaption="Time"
                fixedHeight
                timeInputLabel="Time:"
                showTimeInput={false}
                strictParsing={false}
                adjustDateOnChange={false}
            />
        </div>
    );
}

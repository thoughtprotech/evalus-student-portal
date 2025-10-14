import React, { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import {
  startOfToday,
  endOfToday,
  startOfWeek,
  endOfWeek,
  subWeeks,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  subYears,
  format,
} from "date-fns";

const dateFormats = "yyyy-MM-dd";

const DateRangeSelector = ({
  onDateRangeChange,
}: {
  onDateRangeChange: ({
    startDate,
    endDate,
  }: {
    startDate: string;
    endDate: string;
  }) => void;
}) => {
  const [selectedFilter, setSelectedFilter] = useState("today");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  useEffect(() => {
    const now = new Date();
    let startDate, endDate;
    setShowCustomPicker(false);

    switch (selectedFilter) {
      case "today":
        startDate = startOfToday();
        endDate = endOfToday();
        break;
      case "thisWeek":
        startDate = startOfWeek(now, { weekStartsOn: 1 }); // Monday start
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case "lastWeek":
        const lastWeek = subWeeks(now, 1);
        startDate = startOfWeek(lastWeek, { weekStartsOn: 1 });
        endDate = endOfWeek(lastWeek, { weekStartsOn: 1 });
        break;
      case "thisMonth":
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case "lastMonth":
        const lastMonth = subMonths(now, 1);
        startDate = startOfMonth(lastMonth);
        endDate = endOfMonth(lastMonth);
        break;
      case "thisYear":
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      case "lastYear":
        const lastYear = subYears(now, 1);
        startDate = startOfYear(lastYear);
        endDate = endOfYear(lastYear);
        break;
      case "custom":
        setShowCustomPicker(true);
        return; // Don't trigger range change yet; wait for user input
      default:
        return;
    }

    onDateRangeChange &&
      onDateRangeChange({
        startDate: format(startDate, dateFormats),
        endDate: format(endDate, dateFormats),
      });
  }, [selectedFilter, onDateRangeChange]);

  // On custom date change, notify parent if both dates are valid
  useEffect(() => {
    if (showCustomPicker && customStartDate && customEndDate) {
      onDateRangeChange({
        startDate: customStartDate,
        endDate: customEndDate,
      });
    }
  }, [customStartDate, customEndDate, showCustomPicker, onDateRangeChange]);

  return (
    <div className="space-y-2 w-full max-w-sm">
      <label htmlFor="dateFilter" className="block font-medium text-gray-700">
        Select Date Range
      </label>
      <div className="flex items-center space-x-2">
        <select
          id="dateFilter"
          name="dateFilter"
          className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={selectedFilter}
          onChange={(e) => setSelectedFilter(e.target.value)}
        >
          <option value="today">Today</option>
          <option value="thisWeek">This Week</option>
          <option value="lastWeek">Last Week</option>
          <option value="thisMonth">This Month</option>
          <option value="lastMonth">Last Month</option>
          <option value="thisYear">This Year</option>
          <option value="lastYear">Last Year</option>
          <option value="custom">Custom</option>
        </select>
        <Calendar className="h-6 w-6 text-gray-500" />
      </div>

      {showCustomPicker && (
        <div className="flex space-x-4">
          <div className="flex flex-col w-1/2">
            <label
              htmlFor="customStartDate"
              className="block text-sm font-medium text-gray-700"
            >
              Start Date
            </label>
            <input
              type="date"
              id="customStartDate"
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={customStartDate}
              max={customEndDate || ""}
              onChange={(e) => setCustomStartDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col w-1/2">
            <label
              htmlFor="customEndDate"
              className="block text-sm font-medium text-gray-700"
            >
              End Date
            </label>
            <input
              type="date"
              id="customEndDate"
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={customEndDate}
              min={customStartDate || ""}
              onChange={(e) => setCustomEndDate(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangeSelector;

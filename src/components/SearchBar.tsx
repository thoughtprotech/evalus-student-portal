'use client';

import { Search, XCircle } from 'lucide-react';
import { ChangeEvent, useEffect, useState } from 'react';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  className?: string;
  value?: string; // controlled value
}

export default function SearchBar({
  placeholder = 'Search...',
  onSearch,
  className = '',
  value: controlledValue,
}: SearchBarProps) {
  const [value, setValue] = useState(controlledValue ?? '');

  // Sync internal state when controlled value changes
  useEffect(() => {
    if (controlledValue !== undefined) {
      setValue(controlledValue);
    }
  }, [controlledValue]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onSearch(newValue);
  };

  const handleClear = () => {
    setValue('');
    onSearch('');
  };

  return (
    <div
      className={`relative w-full h-12 border border-gray-300 rounded-xl bg-white shadow-md flex items-center py-4 px-4 ${className}`}
    >
      <Search className="w-6 h-6 text-gray-500 mr-2" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400 font-bold"
      />
      {value && (
        <XCircle
          onClick={handleClear}
          className="w-6 h-6 text-gray-500 cursor-pointer absolute right-4"
        />
      )}
    </div>
  );
}

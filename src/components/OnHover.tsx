import React from 'react';

interface OnHoverProps {
  /** The element that the user hovers over */
  trigger: React.ReactNode;
  /** The content to show in the dropdown */
  children: React.ReactNode;
  /** Optional additional classes for the dropdown container */
  dropdownClassName?: string;
}

export default function OnHover({
  trigger,
  children,
  dropdownClassName = '',
}: OnHoverProps) {
  return (
    <div className="group relative inline-block">
      {/* trigger */}
      <div className="cursor-pointer flex">
        {trigger}
      </div>

      {/* dropdown */}
  <div
        className={
          `opacity-0 invisible group-hover:opacity-100 group-hover:visible
           transition-opacity duration-200
       absolute z-50 mt-2
           bg-white border border-gray-200 rounded shadow-lg
           p-2 max-w-xs whitespace-normal break-words ${dropdownClassName}`
        }
      >
        {children}
      </div>
    </div>
  );
}

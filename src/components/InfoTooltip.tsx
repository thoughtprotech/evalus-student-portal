import React from "react";
import { Info } from "lucide-react";
import OnHover from "@/components/OnHover";

type InfoTooltipProps = {
  text: string;
  iconClassName?: string;
  maxWidthClass?: string; // e.g., "max-w-sm", "max-w-md"
  widthClass?: string; // e.g., "w-64" to enforce a base width
};

export default function InfoTooltip({
  text,
  iconClassName = "w-4 h-4 text-gray-400",
  maxWidthClass = "max-w-sm",
  widthClass = "w-64",
}: InfoTooltipProps) {
  return (
    <OnHover
      trigger={<Info className={iconClassName} />}
      dropdownClassName={`${widthClass} ${maxWidthClass} whitespace-normal break-words`}
    >
      <div className="text-xs leading-snug text-gray-700">{text}</div>
    </OnHover>
  );
}

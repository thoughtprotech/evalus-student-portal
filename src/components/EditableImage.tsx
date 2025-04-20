"use client";

import { useRef, ChangeEvent } from "react";
import clsx from "clsx";
import { Edit2 } from "lucide-react";
import { useAvatar } from "@/hooks/useAvatar";

interface EditableImageProps {
  src: string | undefined | null;
  firstName: string;
  lastName: string;
  onEdit: (formData: FormData) => any;
  size?: number;
  className?: string;
}

export function EditableImage({
  src,
  firstName,
  lastName,
  onEdit,
  size = 120,
  className,
}: EditableImageProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const avatar = useAvatar(firstName, lastName, src, size);
  const handleIconClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    // invoke your server action
    await onEdit(formData);
    // you can add optimistic UI or refresh logic here
  };

  return (
    <div
      className={clsx(
        "relative inline-block rounded-full overflow-hidden",
        className
      )}
      style={{ width: size, height: size }}
    >
      {/* Displayed image */}
      {avatar}

      {/* Hover overlay */}
      <div
        onClick={handleIconClick}
        className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-1 cursor-pointer"
      >
        <Edit2 className="w-6 h-6 text-white" />
        <h1 className="text-white font-bold">Edit</h1>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*"
        ref={inputRef}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

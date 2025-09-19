import React, { JSX } from "react";
import Image from "next/image";

/**
 * useAvatar returns a JSX element representing the user's avatar.
 * If an imageSrc is provided, it renders a circular Image.
 * Otherwise, it generates initials and a deterministic background color.
 */
export function useAvatar(
  firstName: string,
  lastName: string,
  imageSrc?: string | null,
  size = 64
): JSX.Element {
  // If an image is provided, render it directly
  const [imgError, setImgError] = React.useState(false);
  if (imageSrc && imageSrc !== 'null' && imageSrc !== '' && !imgError) {
    return (
      <Image
        src={imageSrc}
        alt={`${firstName} ${lastName}`}
        width={size}
        height={size}
        className="rounded-full object-cover"
        onError={() => setImgError(true)}
      />
    );
  }

  // Compute initials
  const initials =
    (firstName?.[0]?.toUpperCase() || "") +
    (lastName?.[0]?.toUpperCase() || "");

  // Pick a background color based on initials
  const colors = [
    "bg-indigo-200",
    "bg-green-200",
    "bg-yellow-200",
    "bg-pink-200",
    "bg-blue-200",
  ];
  const hash = Array.from(initials).reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0
  );
  const bgColor = colors[hash % colors.length];

  return (
    <div
      className={`${bgColor} rounded-full flex items-center justify-center font-bold text-gray-700`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  );
}

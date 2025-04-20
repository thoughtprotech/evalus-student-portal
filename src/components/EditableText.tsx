"use client";

import { useState, useEffect, useRef } from "react";
import { Pencil, Check, X } from "lucide-react";

interface EditableTextProps {
  text: string;
  onSubmit: (newText: string) => Promise<void>;
  className?: string;
  inputClassName?: string;
  type?: "text" | "email" | "phone" | "number"; // Optional type for validation
}

export default function EditableText({
  text,
  onSubmit,
  className = "",
  inputClassName = "",
  type = "text", // Default to 'text' type
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(text);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Use a ref to always keep track of the latest value
  const valueRef = useRef(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update the valueRef when value changes
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // Validate the input value based on the type
  const validateInput = (inputValue: string) => {
    switch (type) {
      case "email":
        // Regex for basic email validation
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
        return emailRegex.test(inputValue) ? null : "Invalid email address";
      case "phone":
        // Regex for phone validation (simple example)
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        return phoneRegex.test(inputValue) ? null : "Invalid phone number";
      case "number":
        // Ensure the input is a valid number
        const numberRegex = /^[0-9]+$/;
        return numberRegex.test(inputValue) ? null : "Invalid number";
      case "text":
      default:
        // Ensure the text is not empty
        return inputValue.trim() !== "" ? null : "Text cannot be empty";
    }
  };

  const handleSubmit = async () => {
    const validationError = validateInput(valueRef.current);
    if (validationError) {
      setErrorMessage(validationError); // Set the error message
      return; // Prevent form submission if validation fails
    }

    setLoading(true);
    await onSubmit(valueRef.current); // Always use the latest value from ref
    setLoading(false);
    setIsEditing(false);
    setErrorMessage(null); // Reset error message on successful submit
  };

  const handleCancel = () => {
    setValue(text); // Reset to original text
    setIsEditing(false); // Exit editing mode
    setErrorMessage(null); // Reset error message
  };

  // Handle keyboard events for Enter (submit) and Escape (cancel)
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevent default action to avoid form submission
      handleSubmit();
    } else if (event.key === "Escape") {
      event.preventDefault(); // Prevent default action (optional)
      handleCancel();
    }
  };

  useEffect(() => {
    if (isEditing) {
      // Add event listener when editing
      window.addEventListener("keydown", handleKeyDown);
    } else {
      // Remove event listener when not editing
      window.removeEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // Update the value in state whenever the text changes
  useEffect(() => {
    setValue(text);
  }, [text]);

  return (
    <div className={`w-fit flex flex-col items-start group ${className}`}>
      {isEditing ? (
        <div className="w-fit flex items-center gap-2">
          <input
            ref={inputRef}
            type={
              type === "email" ? "email" : type === "phone" ? "tel" : "text"
            }
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={`w-full max-w-sm border border-gray-300 shadow-md px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClassName}`}
          />
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="text-green-600 hover:text-green-800 transition cursor-pointer"
          >
            <Check size={20} />
          </button>
          <button
            onClick={handleCancel}
            className="text-red-600 hover:text-red-800 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span>{value}</span>
          <button
            onClick={() => setIsEditing(true)}
            className="text-gray-500 hover:text-black transition cursor-pointer opacity-100 lg:opacity-0 group-hover:opacity-100 duration-300"
          >
            <Pencil size={16} />
          </button>
        </div>
      )}

      {errorMessage && (
        <p className="text-red-600 text-sm mt-2">{errorMessage}</p> // Show the error message if any
      )}
    </div>
  );
}

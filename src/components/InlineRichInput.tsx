"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Image as ImageIcon } from "lucide-react";

export interface InlineRichInputProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number | string;
}

/**
 * A compact, input-like rich text field that supports inline images.
 * - Looks like a textbox (rounded, bordered)
 * - Supports pasting images and an insert-image button (stored as base64)
 * - Emits HTML via onChange so it binds like a normal input value
 */
export default function InlineRichInput({
  value,
  onChange,
  placeholder = "",
  className = "",
  minHeight = 44,
}: InlineRichInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const extensions = useMemo(
    () => [
      StarterKit,
      Image.configure({ allowBase64: true }),
      Placeholder.configure({ placeholder }),
    ],
    [placeholder]
  );

  const editor = useEditor({
    extensions,
    content: value || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          // Keep it compact and input-like
          "ProseMirror p-0 m-0 leading-6 text-sm sm:text-base focus:outline-none",
      },
      handleKeyDown(view, event) {
        // Optional: keep Enter from creating too much spacing; allow natural growth
        if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
          // allow ctrl/cmd+enter for new line
          return false;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (editor) {
      const current = editor.getHTML();
      if ((value || "") !== current) {
        editor.commands.setContent(value || "");
      }
    }
  }, [value, editor]);

  // Paste handler for images
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || !editor) return;
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            const reader = new FileReader();
            reader.onload = () => {
              const src = String(reader.result);
              editor.chain().focus().setImage({ src }).run();
            };
            reader.readAsDataURL(file);
            break;
          }
        }
      }
    };
    el.addEventListener("paste", onPaste as any);
    return () => {
      el.removeEventListener("paste", onPaste as any);
    };
  }, [editor]);

  if (!editor) return null;

  const handleImageClick = () => fileInputRef.current?.click();
  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result);
      editor.chain().focus().setImage({ src }).run();
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const resolvedMinHeight = typeof minHeight === "number" ? `${minHeight}px` : minHeight;

  return (
    <div ref={wrapperRef} className={`group relative ${className}`.trim()}>
      <style jsx>{`
        .inline-rich-input img { max-width: 100%; height: auto; display: inline-block; }
      `}</style>
      <div
        className="inline-rich-input px-3 py-2 border border-gray-300 rounded-xl bg-white focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500"
        style={{ minHeight: resolvedMinHeight }}
      >
        <EditorContent editor={editor} className="max-w-full" />
      </div>
      {/* Insert image button (shows on hover/focus) */}
      <button
        type="button"
        onClick={handleImageClick}
        title="Insert image"
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label="Insert image"
      >
        <ImageIcon size={16} />
      </button>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  );
}

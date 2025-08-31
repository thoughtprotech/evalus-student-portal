"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List as ListIcon,
  ListOrdered,
  Quote,
  Code as CodeIcon,
  Image as ImageIcon,
  RotateCcw,
  RotateCw,
} from "lucide-react";

// Tailwind classes for toolbar buttons
const btn = "p-2 rounded-xl hover:bg-gray-200 flex items-center justify-center";

export interface RichTextEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  returnPlainText?: boolean; // Control output format (HTML vs plain text)
  minHeight?: number | string; // Minimum editor content height (px if number)
  height?: number | string; // Fixed height (px if number) – overrides minHeight when provided
  className?: string; // Optional extra classes for outer wrapper
}

export default function RichTextEditor({
  initialContent = "",
  onChange,
  placeholder = "Start typing...",
  returnPlainText = false, // Default to HTML for backward compatibility
  minHeight = 200,
  height,
  className = "",
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Memoize extensions to ensure stable instances
  const extensions = useMemo(
    () => [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      // Allow embedding & reloading of base64 (data URI) images for persisted questions
      Image.configure({ allowBase64: true }),
      Placeholder.configure({ placeholder }),
      CharacterCount,
    ],
    [placeholder]
  );

  const editor = useEditor({
    extensions,
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "ProseMirror min-h-full p-4 focus:outline-none overflow-auto",
      },
    },
    onUpdate: ({ editor }) => {
      const content = returnPlainText ? editor.getText() : editor.getHTML();
      onChange?.(content);
    },
  });

  // Sync external content changes
  useEffect(() => {
    if (editor) {
      const currentContent = returnPlainText ? editor.getText() : editor.getHTML();
      if (initialContent !== currentContent) {
        editor.commands.setContent(initialContent);
      }
    }
  }, [initialContent, editor, returnPlainText]);

  if (!editor) return null;

  // Trigger file input
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  // Read selected file and insert as base64
  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      editor.chain().focus().setImage({ src }).run();
    };
    reader.readAsDataURL(file);
    // reset input
    e.target.value = "";
  };

  const text = editor.state.doc.textContent;
  const wordCount = text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  // Compute style object for editor content area
  const resolvedMinHeight = height ? undefined : (typeof minHeight === 'number' ? `${minHeight}px` : minHeight);
  const resolvedHeight = height ? (typeof height === 'number' ? `${height}px` : height) : undefined;

  return (
    <div className={`flex flex-col h-full border border-gray-300 rounded-xl ${className}`.trim()}>
      <style jsx>{`
        /* Ensure embedded images (including large base64 data URIs) scale nicely */
        .editor-content img { max-width: 100%; height: auto; display: inline-block; }
      `}</style>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 border-b border-b-gray-300 p-2 bg-white z-10 rounded-t-xl">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btn + (editor.isActive("bold") ? " bg-gray-200" : "")}
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btn + (editor.isActive("italic") ? " bg-gray-200" : "")}
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={btn + (editor.isActive("underline") ? " bg-gray-200" : "")}
          title="Underline"
        >
          <UnderlineIcon size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={btn + (editor.isActive("strike") ? " bg-gray-200" : "")}
          title="Strikethrough"
        >
          <Strikethrough size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={
            btn + (editor.isActive("bulletList") ? " bg-gray-200" : "")
          }
          title="Bullet List"
        >
          <ListIcon size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={
            btn + (editor.isActive("orderedList") ? " bg-gray-200" : "")
          }
          title="Ordered List"
        >
          <ListOrdered size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={
            btn + (editor.isActive("blockquote") ? " bg-gray-200" : "")
          }
          title="Blockquote"
        >
          <Quote size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={btn + (editor.isActive("codeBlock") ? " bg-gray-200" : "")}
          title="Code Block"
        >
          <CodeIcon size={16} />
        </button>
        <button onClick={handleImageClick} className={btn} title="Insert Image">
          <ImageIcon size={16} />
        </button>
        {/* hidden file input */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={() => editor.chain().focus().undo().run()}
          className={btn}
          title="Undo"
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          className={btn}
          title="Redo"
        >
          <RotateCw size={16} />
        </button>
        <div className="ml-auto p-2 text-sm text-gray-500">
          {wordCount} words
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 overflow-auto">
        <EditorContent
          editor={editor}
          className="h-full focus:outline-none focus:ring-0 max-w-full editor-content prose prose-sm"
          // Inline style allows dynamic sizing without needing Tailwind arbitrary class generation
          style={{
            minHeight: resolvedMinHeight,
            height: resolvedHeight,
          }}
        />
      </div>
    </div>
  );
}

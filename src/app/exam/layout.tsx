// app/layout.tsx
"use client";
import type { Metadata } from "next";
import { useEffect } from "react";

export default function ExamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // useEffect(() => {
  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     // F12, Ctrl+Shift+I/C/J, Ctrl+U (view source), Ctrl+R/F5 (reload)
  //     if (
  //       e.key === "F12" ||
  //       (e.ctrlKey &&
  //         e.shiftKey &&
  //         ["I", "C", "J"].includes(e.key.toUpperCase())) ||
  //       (e.ctrlKey && ["U", "R"].includes(e.key.toUpperCase())) ||
  //       ["F5", "Ctrl+P"].includes(e.key)
  //     ) {
  //       e.preventDefault();
  //       e.stopPropagation();
  //     }
  //   };

  //   const handleContextMenu = (e: MouseEvent) => {
  //     e.preventDefault(); // disable right-click
  //   };

  //   const handleCopyPaste = (e: ClipboardEvent) => {
  //     e.preventDefault(); // disable copy/cut/paste
  //   };

  //   window.addEventListener("keydown", handleKeyDown, true);
  //   window.addEventListener("contextmenu", handleContextMenu, true);
  //   window.addEventListener("copy", handleCopyPaste, true);
  //   window.addEventListener("cut", handleCopyPaste, true);
  //   window.addEventListener("paste", handleCopyPaste, true);

  //   return () => {
  //     window.removeEventListener("keydown", handleKeyDown, true);
  //     window.removeEventListener("contextmenu", handleContextMenu, true);
  //     window.removeEventListener("copy", handleCopyPaste, true);
  //     window.removeEventListener("cut", handleCopyPaste, true);
  //     window.removeEventListener("paste", handleCopyPaste, true);
  //   };
  // }, []);

  // useEffect(() => {
  //   const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  //     e.preventDefault();
  //     e.returnValue = ""; // Chrome requires returnValue to be set
  //   };

  //   window.addEventListener("beforeunload", handleBeforeUnload);
  //   return () => {
  //     window.removeEventListener("beforeunload", handleBeforeUnload);
  //   };
  // }, []);

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     const threshold = 160; // pixels
  //     if (
  //       window.outerWidth - window.innerWidth > threshold ||
  //       window.outerHeight - window.innerHeight > threshold
  //     ) {
  //       // DevTools likely open
  //       document.body.classList.add("blurred-lock");
  //     } else {
  //       document.body.classList.remove("blurred-lock");
  //     }
  //   }, 1000);

  //   return () => clearInterval(interval);
  // }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-100">
      {/* Fixed navbar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white shadow-md border-b border-b-gray-300 flex items-center z-30">
        <div className="mx-auto px-3 sm:px-6 lg:px-8 flex justify-between items-center w-full">
          <div className="flex items-end gap-1">
            <h1 className="text-3xl font-bold text-indigo-700 transition duration-300">
              E
              <span className="text-3xl font-bold text-gray-800 transition duration-300">
                valus
              </span>
            </h1>
          </div>
        </div>
      </header>
      {/* Main content area with top padding equal to navbar height */}
      <main className="flex-1 pt-16 overflow-y-auto">{children}</main>
    </div>
  );
}

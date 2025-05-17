import { ReactNode } from "react";
import Navbar from "./components/Navbar";

export default function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Navbar stays fixed at top */}
      <header className="flex-none">
        <Navbar />
      </header>

      {/* Content fills remaining space and scrolls */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

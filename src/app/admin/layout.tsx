// app/admin/layout.tsx
import { ReactNode } from "react";
import Navbar from "./components/Navbar";
import { getUserAction } from "../actions/getUser";

export default async function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  let user = "";
  const userRes = await getUserAction();
  if (userRes) {
    user = userRes;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Navbar stays fixed at top and receives server‐side username */}
      <header className="flex-none">
        <Navbar username={user} />
      </header>

      {/* Content fills remaining space and scrolls */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

"use client";

import { ReactNode, useEffect } from "react";
import Navbar from "./components/Navbar";
import { getUserAction } from "../actions/getUser";
import { useUser } from "@/contexts/UserContext";

export default function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { username, setUsername } = useUser();

  const getUser = async () => {
    const user = await getUserAction();
    if (user) {
      setUsername(user);
    }
  };

  useEffect(() => {
    getUser();
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Navbar stays fixed at top and receives server‐side username */}
      <header className="flex-none">
        <Navbar username={username} />
      </header>

      {/* Content fills remaining space and scrolls */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

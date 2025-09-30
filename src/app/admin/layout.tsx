"use client";

import { ReactNode, useEffect } from "react";
import Navbar from "./components/Navbar";
import { getUserDisplayNameAction } from "../actions/authentication/getUserDisplayName";
import { useUser } from "@/contexts/UserContext";

export default function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { username, displayName, userPhoto, setUsername, setDisplayName, setUserPhoto } = useUser();

  const getUser = async () => {
    const userData = await getUserDisplayNameAction();
    if (userData) {
      setUsername(userData.username); // Keep username for API calls
      setDisplayName(userData.displayName); // Use displayName for UI
      setUserPhoto(userData.userPhoto || null); // Set user photo
    }
  };

  useEffect(() => {
    getUser();
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Navbar stays fixed at top and receives server‐side username */}
      <header className="flex-none">
        <Navbar
          username={displayName || username}
          userPhoto={userPhoto}
        />
      </header>

      {/* Content fills remaining space and scrolls */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

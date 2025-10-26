"use client";

import { ReactNode, useEffect } from "react";
import Navbar from "./components/Navbar";
import { getUserDisplayNameAction } from "../actions/authentication/getUserDisplayName";
import { useUser } from "@/contexts/UserContext";
import { useState, useCallback } from "react";
import { getCompanyForUser } from "@/app/actions/admin/getCompanyForUser";

export default function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { username, displayName, userPhoto, setUsername, setDisplayName, setUserPhoto } = useUser();
  const [company, setCompany] = useState<{ companyName: string; companyLogo?: string } | null>(null);

  const getUser = async () => {
    const userData = await getUserDisplayNameAction();
    if (userData) {
      setUsername(userData.username);
      setDisplayName(userData.displayName);
      setUserPhoto(userData.userPhoto || null);
    }
  };

  const getCompany = useCallback(async () => {
    const companyData = await getCompanyForUser();
    if (companyData) {
      setCompany({ companyName: companyData.companyName, companyLogo: companyData.companyLogo });
    }
  }, []);

  useEffect(() => {
    getUser();
    getCompany();
  }, [getCompany]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Navbar stays fixed at top and receives server‐side username */}
      <header className="flex-none">
        <Navbar
          username={displayName || username}
          userPhoto={userPhoto}
          companyName={company?.companyName}
          companyLogo={company?.companyLogo}
        />
      </header>

      {/* Content fills remaining space and scrolls */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

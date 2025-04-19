"use client";

import {
  Bell,
  Bookmark,
  ClipboardList,
  FileText,
  NotebookPen,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { JSX, ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { logout } from "../actions/authentication/logout";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Define header metadata mappings for parent routes.
  const pathHeaderMappings: Record<
    string,
    { title: string; icon: JSX.Element }
  > = {
    "/dashboard/analytics": {
      title: "Analytics",
      icon: <ClipboardList className="w-6 h-6 md:w-8 md:h-8" />,
    },
    "/dashboard/starred": {
      title: "Starred",
      icon: <Bookmark className="w-6 h-6 md:w-8 md:h-8" />,
    },
    "/dashboard/references": {
      title: "References",
      icon: <FileText className="w-6 h-6 md:w-8 md:h-8" />,
    },
    "/dashboard/spotlight": {
      title: "Spotlight",
      icon: <Bell className="w-6 h-6 md:w-8 md:h-8" />,
    },
    "/dashboard": {
      title: "TestHub",
      icon: <NotebookPen className="w-6 h-6 md:w-8 md:h-8" />,
    },
  };

  // Sort keys by length descending and then find a matching header based on the current pathname.
  const currentPathMeta = Object.entries(pathHeaderMappings)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([path]) => pathname.startsWith(path))?.[1] || {
    title: "Dashboard",
    icon: <NotebookPen className="w-6 h-6 md:w-8 md:h-8" />,
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    const res = await logout();
    if (res.success) {
      router.push("/");
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-gray-100 to-indigo-100 text-gray-800 relative flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col transition-all duration-300 ease-in-out overflow-hidden bg-white border-r border-gray-300 shadow-md group w-20 hover:w-48">
        <div className="h-16 px-2 flex gap-1 items-center justify-center shadow-md border-b border-gray-300 relative">
          <div className="absolute top-3 left-7 flex items-end gap-1">
            <h1 className="text-3xl font-bold text-indigo-700 transition duration-300">
              E
              <span className="text-3xl font-bold text-gray-800 transition duration-300 opacity-0 group-hover:opacity-100">
                valus
              </span>
            </h1>
          </div>
        </div>

        <nav className="flex-1 py-5 px-4 space-y-2">
          <SidebarItem icon={NotebookPen} label="TestHub" href="/dashboard" />
          <SidebarItem
            icon={ClipboardList}
            label="Analytics"
            href="/dashboard/analytics"
          />
          <SidebarItem
            icon={Bookmark}
            label="Starred"
            href="/dashboard/starred"
          />
          <SidebarItem
            icon={FileText}
            label="References"
            href="/dashboard/references"
          />
          <SidebarItem
            icon={Bell}
            label="Spotlight"
            href="/dashboard/spotlight"
          />
        </nav>
      </aside>

      {/* Mobile Background Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black transition-opacity duration-300 ${
          mobileMenuOpen
            ? "opacity-50 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        } md:hidden`}
        onClick={toggleMobileMenu}
      />

      {/* Mobile Sidebar Overlay */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } md:hidden`}
      >
        <aside className="bg-white border-r border-gray-300 shadow-md flex flex-col h-full">
          <div className="h-16 px-4 flex items-center justify-between shadow-md border-b border-gray-300">
            <div className="flex items-end gap-1">
              <h1 className="text-3xl font-bold text-indigo-700 transition duration-300">
                E
                <span className="text-3xl font-bold text-gray-800 transition duration-300">
                  valus
                </span>
              </h1>
            </div>
            <button onClick={toggleMobileMenu} aria-label="Close Menu">
              <X className="w-6 h-6 text-gray-800" />
            </button>
          </div>
          <nav className="flex-1 py-5 px-4 space-y-2">
            <SidebarItemMobile
              icon={NotebookPen}
              label="TestHub"
              href="/dashboard"
              onClick={toggleMobileMenu}
            />
            <SidebarItemMobile
              icon={ClipboardList}
              label="Analytics"
              href="/dashboard/analytics"
              onClick={toggleMobileMenu}
            />
            <SidebarItemMobile
              icon={Bookmark}
              label="Starred"
              href="/dashboard/starred"
              onClick={toggleMobileMenu}
            />
            <SidebarItemMobile
              icon={FileText}
              label="References"
              href="/dashboard/references"
              onClick={toggleMobileMenu}
            />
            <SidebarItemMobile
              icon={Bell}
              label="Spotlight"
              href="/dashboard/spotlight"
              onClick={toggleMobileMenu}
            />
          </nav>
        </aside>
      </div>

      {/* Main Layout Column */}
      <div className="flex-1 flex flex-col transition-all duration-300">
        {/* Navbar */}
        <header className="fixed md:static top-0 right-0 left-0 bg-white backdrop-blur-md border-b border-gray-200 shadow-md px-6 flex items-center justify-between h-16 z-30">
          <div className="flex items-center space-x-2">
            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 rounded-md hover:bg-gray-200 transition"
              onClick={toggleMobileMenu}
              aria-label="Toggle Menu"
            >
              <Menu className="w-6 h-6 text-gray-800" />
            </button>
            <div className="text-2xl font-bold text-black flex items-center space-x-2">
              {isMounted && currentPathMeta?.icon}
              <h1 className="text-base md:text-2xl text-indigo-700">
                {isMounted && currentPathMeta?.title}
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 md:w-9 md:h-9 bg-indigo-200 text-indigo-800 rounded-full flex items-center justify-center font-bold text-sm shadow-inner">
                U
              </div>
              <h1 className="text-xs md:text-base font-bold text-gray-600">
                John Doe
              </h1>
            </div>
            <div onClick={handleLogout}>
              <LogOut className="w-4 h-4 md:w-5 md:h-5 text-red-500 cursor-pointer" />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="pt-20 md:pt-3 overflow-y-auto flex-1 p-3">
          <div className="mx-auto backdrop-blur-sm w-full min-h-full flex-1 bg-white rounded-xl p-6 shadow-xl border border-gray-200">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  onClick?: () => void;
}

function SidebarItem({ icon: Icon, label, href, onClick }: SidebarItemProps) {
  const pathname = usePathname();
  return (
    <a
      href={href}
      onClick={onClick}
      className={`flex items-center space-x-3 px-2 py-3 font-bold transition-all rounded-lg ${
        pathname === href ? "text-indigo-600" : "text-gray-600"
      } hover:bg-indigo-500/40 hover:text-indigo-600`}
    >
      <Icon className="w-6 h-6 min-w-[24px]" />
      <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {label}
      </span>
    </a>
  );
}

function SidebarItemMobile({
  icon: Icon,
  label,
  href,
  onClick,
}: SidebarItemProps) {
  const pathname = usePathname();
  return (
    <a
      href={href}
      onClick={onClick}
      className={`flex items-center space-x-3 px-2 py-3 font-bold ${
        pathname === href ? "text-indigo-600" : "text-gray-600"
      } hover:bg-indigo-500/40 hover:text-indigo-600 transition-all rounded-lg`}
    >
      <Icon className="w-6 h-6 min-w-[24px]" />
      <span className="whitespace-nowrap">{label}</span>
    </a>
  );
}

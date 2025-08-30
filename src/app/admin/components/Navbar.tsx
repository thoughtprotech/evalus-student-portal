// components/Navbar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logoutAction } from "@/app/actions/authentication/logout";
import { DropDown } from "@/components/DropDown";
import {
  LayoutDashboard,
  HelpCircle,
  ClipboardList,
  Box,
  BarChart2,
  LogOut,
  UserCircle,
  User,
  Menu,
  X,
  Settings,
  BarcodeIcon,
  BookOpen,
} from "lucide-react";

interface NavItem {
  label: string;
  path: string;
  Icon: React.ComponentType<any>;
}

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/admin", Icon: LayoutDashboard },
  { label: "Questions", path: "/admin/questions", Icon: HelpCircle },
  { label: "Subjects", path: "/admin/subjects", Icon: BookOpen },
  { label: "Tests", path: "/admin/tests", Icon: ClipboardList },
  { label: "Products", path: "/admin/products", Icon: Box },
  { label: "Candidates", path: "/admin/candidates", Icon: User },
  { label: "Reports", path: "/admin/reports", Icon: BarChart2 },
  { label: "Settings", path: "/admin/settings", Icon: Settings },
];

// Group Questions + Subjects under a dropdown style for desktop
const hasSubMenu = (label: string) => label === 'Questions';

interface NavbarProps {
  username: string;
}

export default function Navbar({ username }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    const res = await logoutAction();
    if (res.status === 200) {
      try {
        sessionStorage.removeItem("admin:newTest:model");
        sessionStorage.removeItem("admin:newTest:inWizard");
        sessionStorage.removeItem("admin:newTest:suppressClear");
        sessionStorage.removeItem("admin:newTest:preselectedIds");
        sessionStorage.removeItem("admin:newTest:selectedQuestions");
      } catch { }
      router.push("/");
    }
  };

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  return (
    <header className="w-full border-b border-gray-300 shadow-md px-6 flex items-center justify-between h-16 relative">
      {/* Logo */}
      <div className="flex items-center space-x-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-indigo-700">
          E<span className="text-gray-800">valus</span>
        </h1>
        <h1 className="text-2xl sm:text-3xl font-bold text-indigo-700">
          A<span className="text-gray-800">dmin</span>
        </h1>
      </div>

      {/* Desktop Nav */}
      <nav className="hidden md:flex items-center space-x-6">
        {navItems.filter(n => n.label !== 'Subjects').map(({ label, path, Icon }) => {
          if (label === 'Questions') {
            const isActive = pathname.startsWith('/admin/questions') || pathname.startsWith('/admin/subjects');
            return (
              <div key={path} className="relative group">
                <Link
                  href={path}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md transition ${isActive ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:text-indigo-700 hover:bg-indigo-100'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">Questions</span>
                </Link>
                <div className="absolute left-0 top-full hidden group-hover:block bg-white border border-gray-200 rounded-md shadow-md mt-1 min-w-[170px] z-30">
                  <Link href="/admin/questions" className={`block px-4 py-2 text-sm hover:bg-indigo-50 ${pathname.startsWith('/admin/questions') && !pathname.startsWith('/admin/subjects') ? 'text-indigo-700' : 'text-gray-700'}`}>Questions</Link>
                  <Link href="/admin/subjects" className={`block px-4 py-2 text-sm hover:bg-indigo-50 ${pathname.startsWith('/admin/subjects') ? 'text-indigo-700' : 'text-gray-700'}`}>Subjects</Link>
                </div>
              </div>
            );
          }
          const isActive = pathname === path;
          return (
            <Link
              key={path}
              href={path}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md transition ${isActive ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:text-indigo-700 hover:bg-indigo-100'
                }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile Menu Button & User */}
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleMenu}
          className="md:hidden focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? (
            <X className="w-6 h-6 text-gray-700" />
          ) : (
            <Menu className="w-6 h-6 text-gray-700" />
          )}
        </button>

        <DropDown
          face={
            <div className="flex items-center space-x-2 cursor-pointer">
              <div className="w-8 h-8 bg-indigo-200 text-indigo-800 rounded-full flex items-center justify-center font-bold shadow-inner">
                {username.charAt(0).toUpperCase()}
              </div>
              <span className="font-semibold text-gray-700">{username}</span>
            </div>
          }
        >
          <div className="bg-white shadow-md rounded-md flex flex-col">
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 hover:bg-indigo-50"
            >
              <UserCircle className="w-5 h-5 text-indigo-500" />
              <span>Profile</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 hover:bg-indigo-50 text-left whitespace-nowrap"
            >
              <LogOut className="w-5 h-5 text-red-500" />
              <span>Log Out</span>
            </button>
          </div>
        </DropDown>
      </div>

      {/* Mobile Nav */}
      {menuOpen && (
        <nav className="absolute top-full left-0 w-full bg-white border-t border-gray-200 shadow-md md:hidden">
          <div className="flex flex-col">
            {navItems.map(({ label, path, Icon }) => {
              const isActive = pathname === path;
              return (
                <Link
                  key={path}
                  href={path}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center space-x-2 px-4 py-3 transition ${isActive
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-gray-700 hover:bg-indigo-50"
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-base font-medium">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}

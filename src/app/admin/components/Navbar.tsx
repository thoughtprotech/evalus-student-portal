// components/Navbar.tsx
"use client";

import { useEffect, useRef, useState } from "react";
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
            return <QuestionsSubmenu key={path} Icon={Icon} isActive={isActive} pathname={pathname} basePath={path} />;
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
            {/* Inline grouping for mobile (explicit) */}
            <div className="border-t border-gray-200">
              <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">Content</p>
              <Link href="/admin/questions" onClick={() => setMenuOpen(false)} className={`flex items-center space-x-2 px-4 py-2 text-sm ${pathname.startsWith('/admin/questions') ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-indigo-50'}`}>Questions</Link>
              <Link href="/admin/subjects" onClick={() => setMenuOpen(false)} className={`flex items-center space-x-2 px-4 py-2 text-sm ${pathname.startsWith('/admin/subjects') ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-indigo-50'}`}>Subjects</Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}

interface QuestionsSubmenuProps { Icon: React.ComponentType<any>; isActive: boolean; pathname: string; basePath: string; }
function QuestionsSubmenu({ Icon, isActive, pathname, basePath }: QuestionsSubmenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  // Close on outside click / escape
  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (open && ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keyup', onKey);
    return () => { window.removeEventListener('mousedown', onClick); window.removeEventListener('keyup', onKey); };
  }, [open]);
  // Auto close when navigating away
  useEffect(() => { setOpen(false); }, [pathname]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => { if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); } }}
        className={`flex items-center space-x-1 px-3 py-2 rounded-md transition focus:outline-none focus:ring-2 focus:ring-indigo-400 ${isActive ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:text-indigo-700 hover:bg-indigo-100'}`}
      >
        <Icon className="w-5 h-5" />
        <span className="text-sm font-medium">Questions</span>
        <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div role="menu" aria-label="Questions submenu" className="absolute left-0 top-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 min-w-[190px] z-30 p-1 animate-fade-in">
          <Link role="menuitem" href="/admin/questions" className={`block rounded px-3 py-2 text-sm focus:outline-none focus:bg-indigo-100 ${pathname.startsWith('/admin/questions') && !pathname.startsWith('/admin/subjects') ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-indigo-50'}`}>Questions</Link>
          <Link role="menuitem" href="/admin/subjects" className={`block rounded px-3 py-2 text-sm focus:outline-none focus:bg-indigo-100 ${pathname.startsWith('/admin/subjects') ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-indigo-50'}`}>Subjects</Link>
        </div>
      )}
    </div>
  );
}


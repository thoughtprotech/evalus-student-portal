"use client";

import {
  Bookmark,
  ClipboardList,
  FileText,
  NotebookPen,
  Menu,
  X,
  LogOut,
  UserCircle,
  LampDesk,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { JSX, ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { logoutAction } from "../actions/authentication/logout";
import { DropDown } from "@/components/DropDown";
import Link from "next/link";
import toast from "react-hot-toast";
import { getUserDisplayNameAction } from "../actions/authentication/getUserDisplayName";
import { GetSidebarMenusResponse } from "@/utils/api/types";
import { fetchSideBarMenuAction } from "../actions/dashboard/sideBarMenu";
import Loader from "@/components/Loader";
import { SideBarFileTree } from "./components/SideBarFileTree";
import { useUser } from "@/contexts/UserContext";
import { getCompanyForUser } from "@/app/actions/dashboard/getCompanyForUser";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const [sideBarItems, setSideBarItems] = useState<GetSidebarMenusResponse[]>(
    []
  );
  const [sideBarLoader, setSideBarLoader] = useState<boolean>(false);

  const { username, displayName, userPhoto, setUsername, setDisplayName, setUserPhoto, setCurrentGroupId } = useUser();
  const [company, setCompany] = useState<{ companyName: string; companyLogo?: string } | null>(null);

  const getUser = async () => {
    const userData = await getUserDisplayNameAction();
    if (userData) {
      setUsername(userData.username); // Keep username for API calls
      setDisplayName(userData.displayName); // Use displayName for UI
      setUserPhoto(userData.userPhoto || null); // Set user photo
    }
  };

  const fetchSideBarMenus = async () => {
    try {
      const response = await fetchSideBarMenuAction();

      const { data, status } = response;

      if (status === 200) {
        const list = Array.isArray(data) ? data : [];
        setSideBarItems(list);
        setSideBarLoader(true);
        const firstSelf = list.find((item) => item.parentID === 0);
        if (firstSelf) {
          setCurrentGroupId(firstSelf.testCategoryID.toString());
        }
      } else {
        toast.error("Something Went Wrong");
      }
    } catch (error) {
      toast.error("Something Went Wrong");
    }
  };

  useEffect(() => {
    setIsMounted(true);
    fetchSideBarMenus();
    getUser();
    (async () => {
      const companyData = await getCompanyForUser();
      if (companyData) {
        setCompany({ companyName: companyData.companyName, companyLogo: companyData.companyLogo });
      }
    })();
  }, []);

  // Define header metadata mappings for parent routes.
  const pathHeaderMappings: Record<
    string,
    { title: string; icon: JSX.Element }
  > = {
    "/dashboard/profile": {
      title: "Profile",
      icon: <UserCircle className="w-6 h-6 md:w-5 md:h-5" />,
    },
    "/dashboard/analytics": {
      title: "Analytics",
      icon: <ClipboardList className="w-6 h-6 md:w-5 md:h-5" />,
    },
    "/dashboard/starred": {
      title: "Starred",
      icon: <Bookmark className="w-6 h-6 md:w-5 md:h-5" />,
    },
    "/dashboard/references": {
      title: "Documents",
      icon: <FileText className="w-6 h-6 md:w-5 md:h-5" />,
    },
    "/dashboard/spotlight": {
      title: "Spotlight",
      icon: <LampDesk className="w-6 h-6 md:w-5 md:h-5" />,
    },
    "/dashboard": {
      title: "TestHub",
      icon: <NotebookPen className="w-6 h-6 md:w-5 md:h-5" />,
    },
  };

  // Sort keys by length descending and then find a matching header based on the current pathname.
  const currentPathMeta = Object.entries(pathHeaderMappings)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([path]) => pathname.startsWith(path))?.[1] || {
    title: "Dashboard",
    icon: <NotebookPen className="w-6 h-6 md:w-5 md:h-5" />,
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    const res = await logoutAction();
    if (res.status === 200) {
      try {
        sessionStorage.removeItem("admin:newTest:model");
        sessionStorage.removeItem("admin:newTest:inWizard");
        sessionStorage.removeItem("admin:newTest:suppressClear");
        sessionStorage.removeItem("admin:newTest:preselectedIds");
        sessionStorage.removeItem("admin:newTest:selectedQuestions");
        try { localStorage.removeItem("__evalus_last_activity"); } catch { }
      } catch { }
      router.push("/");
    } else {
      return toast.error("Something Went Wrong");
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-gray-100 to-indigo-100 text-gray-800 relative flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col transition-all duration-300 ease-in-out overflow-hidden bg-white border-r border-gray-300 shadow-md min:w-48 w-fit min-w-58 max-w-72">
        <div className="h-16 px-2 flex gap-1 items-center justify-center shadow-md border-b border-gray-300 relative">
          <div className="absolute top-3 left-7 flex items-end gap-1">
            <h1 className="text-3xl font-bold text-indigo-700 transition duration-300">
              E
              <span className="text-3xl font-bold text-gray-800 transition duration-300">
                valus
              </span>
            </h1>
          </div>
        </div>
        {sideBarLoader ? (
          <nav className="flex-1 py-5 px-4 space-y-2">
            <SideBarFileTree
              data={sideBarItems}
              rootLabel="TestHub"
              rootLink="/dashboard"
              regExp="^/dashboard(?:/\\d+)?$"
              rootIcon={<NotebookPen className="w-6 h-6 min-w-[24px]" />}
              initiallyExpanded={false}
              pathname={pathname}
            />
            <SidebarItem
              category={{
                name: "Analytics",
                href: "/dashboard/analytics",
                icon: ClipboardList,
              }}
            />
            <SidebarItem
              category={{
                name: "Starred",
                href: "/dashboard/starred",
                icon: Bookmark,
              }}
            />
            <SidebarItem
              category={{
                name: "Documents",
                href: "/dashboard/references",
                icon: FileText,
              }}
            />
            <SidebarItem
              category={{
                name: "Spotlight",
                href: "/dashboard/spotlight",
                icon: LampDesk,
              }}
            />
          </nav>
        ) : (
          <Loader />
        )}
      </aside>

      {/* Mobile Background Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black transition-opacity duration-300 ${mobileMenuOpen
          ? "opacity-50 pointer-events-auto"
          : "opacity-0 pointer-events-none"
          } md:hidden`}
        onClick={toggleMobileMenu}
      />

      {/* Mobile Sidebar Overlay */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
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
              icon={LampDesk}
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
              <h1 className="text-base md:text-2xl text-gray-700">
                {isMounted && currentPathMeta?.title}
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Company logo and name */}
            {company?.companyLogo && (
              <img
                src={company.companyLogo}
                alt={company.companyName || "Company Logo"}
                className="h-10 w-32 object-contain rounded bg-white mr-3"
                style={{ maxWidth: 128, maxHeight: 40 }}
              />
            )}
            {company?.companyName && (
              <span className="font-bold text-indigo-600 text-lg mr-3 px-2 py-1 rounded bg-indigo-50 border border-indigo-200 shadow-sm">{company.companyName}</span>
            )}
            <DropDown
              face={
                <div className="flex items-center space-x-2">
                  {typeof userPhoto === 'string' && userPhoto !== '' && userPhoto !== 'null' ? (
                    <img
                      src={userPhoto}
                      alt={displayName || username}
                      className="w-7 h-7 md:w-9 md:h-9 rounded-full object-cover border border-gray-300"
                      onError={e => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-7 h-7 md:w-9 md:h-9 bg-indigo-200 text-indigo-800 rounded-full flex items-center justify-center font-bold text-sm shadow-inner">
                      {(displayName || username).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <h1 className="text-xs md:text-base font-bold text-gray-600">
                    {displayName || username}
                  </h1>
                </div>
              }
            >
              <div className="bg-white shadow-md rounded-md flex flex-col text-nowrap">
                <div className="px-4 py-2 w-full flex items-center gap-2 border-b border-b-gray-200 cursor-pointer hover:bg-indigo-50 duration-300">
                  <Link
                    className="flex items-center gap-2"
                    href="/dashboard/profile"
                  >
                    <UserCircle className="w-4 h-4 md:w-5 md:h-5 text-indigo-500 cursor-pointer" />
                    <h1 className="font-bold text-gray-600 text-xs md:text-base">
                      Profile
                    </h1>
                  </Link>
                </div>
                <div
                  className="px-4 py-2 w-full flex items-center gap-2 border-b border-b-gray-200 cursor-pointer hover:bg-indigo-50 duration-300"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 md:w-5 md:h-5 text-red-500 cursor-pointer" />
                  <h1 className="font-bold text-gray-600 text-xs md:text-base">
                    Log Out
                  </h1>
                </div>
              </div>
            </DropDown>
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
  onClick?: () => void;
  category: {
    href: string;
    name: string;
    icon: React.ElementType;
    menu?: {
      href: string;
      name: string;
      icon?: React.ElementType;
      subMenu?: {
        href: string;
        name: string;
        icon?: React.ElementType;
      }[];
    }[];
  };
}

function SidebarItem({ onClick, category }: SidebarItemProps) {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const pathname = usePathname();
  return (
    <div className="flex flex-col">
      <div className="w-full flex items-center justify-between gap-2">
        <Link
          href={category.href}
          onClick={onClick}
          className={`w-full flex items-center space-x-3 p-2 font-semibold transition-all rounded-lg ${pathname === category.href ? "text-indigo-600" : "text-gray-600"
            } hover:bg-indigo-100 hover:text-indigo-600`}
        >
          <category.icon className="w-6 h-6 min-w-[24px]" />
          <span className="whitespace-nowrap transition-opacity duration-300">
            {category.name}
          </span>
        </Link>
        {category.menu && category.menu.length > 0 && (
          <div>
            {!isMenuOpen ? (
              <ChevronDown
                className="cursor-pointer"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              />
            ) : (
              <ChevronUp
                className="cursor-pointer"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              />
            )}
          </div>
        )}
      </div>
      {isMenuOpen && category.menu && category?.menu.length > 0 && (
        <div className="max-h-96 overflow-y-auto">
          {category.menu.map((item) => {
            return (
              <MenuWithSubmenu
                key={item.name}
                item={item}
                currentPath={pathname}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

interface MenuWithSubmenuProps {
  item: {
    href: string;
    name: string;
    icon?: React.ElementType;
    subMenu?: { href: string; name: string; icon?: React.ElementType }[];
  };
  currentPath: string;
}

function MenuWithSubmenu({ item, currentPath }: MenuWithSubmenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col mx-2">
      <div className="flex items-center justify-between">
        <a
          href={item.href}
          className={`w-full flex items-center space-x-2 px-2 py-3 rounded-lg ${currentPath === item.href ? "text-indigo-600" : "text-gray-900"
            } hover:bg-indigo-100 hover:text-indigo-600`}
        >
          {item.icon && <item.icon className="w-5 h-5" />}
          {item.name}
        </a>
        {item.subMenu && item.subMenu.length > 0 && (
          <button
            className="cursor-pointer"
            onClick={() => setIsOpen((o) => !o)}
          >
            {isOpen ? <ChevronUp /> : <ChevronDown />}
          </button>
        )}
      </div>

      {isOpen && item.subMenu && (
        <div className="ml-2">
          {item.subMenu.map((i) => (
            <a
              key={i.name}
              href={i.href}
              className={`flex items-center space-x-2 px-2 py-2 rounded-lg ${currentPath === i.href ? "text-indigo-600" : "text-gray-600"
                } hover:bg-indigo-100 hover:text-indigo-600`}
            >
              {i.icon && <i.icon className="w-5 h-5" />}
              {i.name}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarItemMobile({ icon: Icon, label, href, onClick }: any) {
  const pathname = usePathname();
  const { setGroupSelected, setSelectedGroupName, setCurrentGroupId } = useUser();
  const handleClick = (e: React.MouseEvent) => {
    if (label === "TestHub") {
      setGroupSelected(false); // ensures StudentDashboard initial load
      setSelectedGroupName("");
      setCurrentGroupId("");
    }
    onClick && onClick();
  };
  return (
    <Link
      href={href}
      onClick={handleClick}
      className={`flex items-center space-x-3 px-2 py-3 font-bold ${pathname === href ? "text-indigo-600" : "text-gray-600"
        } hover:bg-indigo-500/40 hover:text-indigo-600 transition-all rounded-lg`}
    >
      <Icon className="w-6 h-6 min-w-[24px]" />
      <span className="whitespace-nowrap">{label}</span>
    </Link>
  );
}

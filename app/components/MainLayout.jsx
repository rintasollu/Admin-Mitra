"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link"; 
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, LogOut, User, Settings, Loader2 } from "lucide-react";

// --- MENU DATA ---
const menuItemsData = [
  { href: "/", name: "Dashboard", imageSrc: "/images/dashboard.png" },
  { href: "/branches", name: "Branch Management", imageSrc: "/images/branch.png" }, 
  { href: "/partners", name: "Branch Admin Management", imageSrc: "/images/branchadmin.png" },
  { href: "/catalog", name: "Catalog Management", imageSrc: "/images/catalog.png" },
  { href: "/discounts", name: "Discount Management", imageSrc: "/images/discount.png" },
  { href: "/licenses", name: "Licenses", imageSrc: "/images/licenses.png" },
  { href: "/reports", name: "Reports", imageSrc: "/images/report.png" },
];

export default function MainLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLogoutPopupOpen, setIsLogoutPopupOpen] = useState(false);
  
  // State untuk cek status login
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const pathname = usePathname(); 
  const router = useRouter();

  // --- FUNGSI PROTEKSI HALAMAN ---
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
    } else {
      setIsCheckingAuth(false);
    }
  }, [router]);

  // --- FUNGSI LOGOUT ---
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (isCheckingAuth) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={40} className="animate-spin text-blue-600" />
          <p className="text-gray-500 font-medium">Checking access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      
      {/* --- SIDEBAR --- */}
      <aside className={`${isSidebarOpen ? "w-72" : "w-24"} bg-white border-r border-gray-200 flex flex-col fixed h-full z-30 transition-all duration-300 ease-in-out`}>
        
        {/* HEADER (Disini perubahan garis pembatas) */}
        <div 
          className={`h-24 flex items-center cursor-pointer border-b border-gray-200 hover:bg-gray-50 transition-colors ${isSidebarOpen ? "px-6 justify-between" : "justify-center px-0"}`}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="relative w-10 h-10 flex-shrink-0">
              <Image src="/images/LOGO HOREKA (1).png" alt="Logo" fill className="object-contain" priority />
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col justify-center whitespace-nowrap">
                <span className="font-bold text-xl text-gray-800 leading-none">Horeka POS+</span>
                <span className="text-sm text-gray-400 font-medium mt-1">Partner Admin</span>
              </div>
            )}
          </div>
          {isSidebarOpen && <ChevronLeft size={28} className="text-gray-400" />}
        </div>

        {/* MENU NAVIGASI */}
        <nav className="flex-1 px-4 space-y-2 mt-6 overflow-y-auto scrollbar-hide">
          {menuItemsData.map((item) => {
            const isActive = pathname === item.href; 
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center w-full p-4 text-base font-medium rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-blue-50 text-blue-600 shadow-sm"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                } ${isSidebarOpen ? "gap-4 justify-start" : "justify-center"}`}
              >
                <div className="relative w-7 h-7 flex-shrink-0">
                  <Image src={item.imageSrc} alt={item.name} fill sizes="28px" className="object-contain" />
                </div>
                {isSidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* FOOTER LOGOUT */}
        <div className="p-5 border-t border-gray-100 relative">
          {isLogoutPopupOpen && (
            <div className={`absolute bottom-full left-0 mb-3 bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden z-50 ${isSidebarOpen ? "w-[calc(100%-40px)] mx-5" : "w-56 left-20"}`}>
              <div className="py-2">
                <button className="w-full text-left px-5 py-3 text-base text-gray-700 hover:bg-gray-50 flex items-center gap-3"><User size={20} /> Profile</button>
                <button className="w-full text-left px-5 py-3 text-base text-gray-700 hover:bg-gray-50 flex items-center gap-3"><Settings size={20} /> Settings</button>
                <div className="border-t border-gray-100 my-1"></div>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-5 py-3 text-base text-red-600 hover:bg-red-50 font-medium flex items-center gap-3"
                >
                  <LogOut size={20} /> Logout
                </button>
              </div>
            </div>
          )}
          <div className={`flex items-center p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors group ${isSidebarOpen ? "gap-4 justify-start" : "justify-center"}`} onClick={() => setIsLogoutPopupOpen(!isLogoutPopupOpen)}>
            <img src="/images/logout.png" alt="Logout" className="w-8 h-8 object-contain flex-shrink-0" />
            {isSidebarOpen && <div className="flex-1 min-w-0"><p className="text-base font-bold text-gray-700 truncate">Logout</p></div>}
          </div>
        </div>
      </aside>

      {/* --- WRAPPER KONTEN UTAMA --- */}
      <main className={`flex-1 p-10 overflow-y-auto h-full transition-all duration-300 ease-in-out ${isSidebarOpen ? "ml-72" : "ml-24"}`}>
        <div className="w-full">
            {children} 
        </div>
      </main>
    </div>
  );
}
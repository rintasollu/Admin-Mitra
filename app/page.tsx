"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import MainLayout from "./components/MainLayout"; 
import { 
  Store, ShoppingBag, TicketPercent, 
  Smartphone, BarChart3, DollarSign, 
  ArrowRight, Calendar, Loader2, AlertCircle, UserCog, LucideIcon
} from "lucide-react";

// --- TIPE DATA (INTERFACES) ---
interface DashboardStats {
  totalSalesToday: number;
  totalTransactionsToday: number;
  totalBranches: number;
  totalAdmins: number;
  activeLicenses: number;
  totalProducts: number;
  activeDiscounts: number;
}

interface QuickActionItem {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  href: string;
  color: string;
  bg: string;
}

export default function Dashboard() {
  // --- STATE ---
  const [stats, setStats] = useState<DashboardStats>({
    totalSalesToday: 0,
    totalTransactionsToday: 0,
    totalBranches: 0,
    totalAdmins: 0,
    activeLicenses: 0,
    totalProducts: 0,
    activeDiscounts: 0
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [username, setUsername] = useState<string>("Partner");

  // Base URL API
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.15:3001/api";

  // --- 1. FETCH DATA DARI API ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        
        // Coba ambil nama user dari localStorage
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                const userObj = JSON.parse(userStr);
                if(userObj.name || userObj.username) {
                  setUsername(userObj.name || userObj.username);
                }
            } catch(e) {
              // Ignore json parse error
            }
        }
        
        if (!token) return;

        const headers = { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        };
        const today = new Date().toISOString().split('T')[0];

        // Request data secara Paralel
        const results = await Promise.allSettled([
          fetch(`${API_URL}/report/sales?tanggalMulai=${today}&tanggalSelesai=${today}`, { headers }), // 0: Sales
          fetch(`${API_URL}/branch`, { headers }),         // 1: Branch
          fetch(`${API_URL}/branch/admin`, { headers }),   // 2: Admin
          fetch(`${API_URL}/license`, { headers }),        // 3: Licenses
          fetch(`${API_URL}/product`, { headers }),        // 4: Products
          fetch(`${API_URL}/discount-rule`, { headers })   // 5: Discounts
        ]);

        // Helper untuk ekstrak JSON dengan aman di TypeScript
        const getData = async (result: PromiseSettledResult<Response>) => {
          if (result.status === 'fulfilled' && result.value.ok) {
            return await result.value.json();
          }
          return []; 
        };

        // Extract Data
        const salesData: any = await getData(results[0]);
        const branchData: any[] = await getData(results[1]);
        const adminData: any[] = await getData(results[2]);
        const licenseData: any[] = await getData(results[3]);
        const productData: any[] = await getData(results[4]);
        const discountData: any[] = await getData(results[5]);

        // Hitung Ringkasan Data
        const summarySales = salesData.summary || { total_sales: 0, transaction_count: 0 };
        
        const activeLic = Array.isArray(licenseData) 
          ? licenseData.filter((l: any) => l.license_status === 'Active').length 
          : 0;
          
        const activeDisc = Array.isArray(discountData) 
          ? discountData.filter((d: any) => new Date(d.end_date) >= new Date()).length 
          : 0;

        setStats({
          totalSalesToday: Number(summarySales.total_sales) || 0,
          totalTransactionsToday: Number(summarySales.transaction_count) || 0,
          totalBranches: Array.isArray(branchData) ? branchData.length : 0,
          totalAdmins: Array.isArray(adminData) ? adminData.length : 0,
          activeLicenses: activeLic,
          totalProducts: Array.isArray(productData) ? productData.length : 0,
          activeDiscounts: activeDisc
        });

      } catch (err) {
        console.error("Dashboard error:", err);
        setError("Failed to load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Helper Formatter Rupiah
  const formatRp = (val: number) => "Rp " + parseInt(val.toString() || "0").toLocaleString("id-ID");

  // --- DATA MENU NAVIGASI (Quick Actions) ---
  const quickActions: QuickActionItem[] = [
    { 
        title: "Branch Management", 
        subtitle: `${stats.totalBranches} Locations`, 
        icon: Store, 
        href: "/branches", 
        color: "text-blue-600", 
        bg: "bg-blue-50" 
    },
    { 
        title: "Branch Admin", 
        subtitle: `${stats.totalAdmins} Managers`, 
        icon: UserCog, 
        href: "/partners", 
        color: "text-indigo-600", 
        bg: "bg-indigo-50" 
    },
    { 
        title: "Catalog", 
        subtitle: `${stats.totalProducts} Products`, 
        icon: ShoppingBag, 
        href: "/catalog", 
        color: "text-orange-600", 
        bg: "bg-orange-50" 
    },
    { 
        title: "Discounts", 
        subtitle: `${stats.activeDiscounts} Active Promo`, 
        icon: TicketPercent, 
        href: "/discounts", 
        color: "text-pink-600", 
        bg: "bg-pink-50" 
    },
    { 
        title: "Licenses", 
        subtitle: `${stats.activeLicenses} Devices Online`, 
        icon: Smartphone, 
        href: "/licenses", 
        color: "text-purple-600", 
        bg: "bg-purple-50" 
    },
    { 
        title: "Reports", 
        subtitle: "Check Analytics", 
        icon: BarChart3, 
        href: "/reports", 
        color: "text-green-600", 
        bg: "bg-green-50" 
    },
  ];

  return (
    <MainLayout>
      <div className="animate-in fade-in duration-500 pb-10">
        
        {/* --- HEADER DASHBOARD --- */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="text-gray-500 mt-2 text-base">
              Welcome back, <span className="font-bold text-gray-800">{username}</span>! Here is today's report.
            </p>
          </div>
          {/* Tanggal Hari Ini */}
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm text-sm font-medium text-gray-600">
            <Calendar size={18} className="text-blue-600"/>
            {new Date().toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* --- CONTENT --- */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-gray-200">
            <Loader2 size={40} className="animate-spin text-blue-600 mb-3" />
            <p className="text-gray-500">Loading dashboard metrics...</p>
          </div>
        ) : (
          <>
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-200 flex items-center gap-2">
                <AlertCircle size={20} /> {error}
              </div>
            )}

            {/* --- SECTION 1: KEY METRICS (Stats Utama) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              
              {/* KARTU UTAMA: SALES HARI INI */}
              <div className="lg:col-span-2 bg-gradient-to-r from-blue-600 to-blue-800 p-8 rounded-2xl text-white shadow-xl shadow-blue-200 relative overflow-hidden group transition-transform hover:scale-[1.01]">
                {/* Dekorasi Background */}
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500"></div>
                
                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl">
                      <DollarSign size={32} className="text-white" />
                    </div>
                    <span className="bg-blue-500/50 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-bold tracking-wider">
                      TODAY'S REVENUE
                    </span>
                  </div>
                  <div>
                    <h3 className="text-5xl font-bold tracking-tight mb-2">{formatRp(stats.totalSalesToday)}</h3>
                    <p className="text-blue-100 text-lg">
                      Total transactions: <strong>{stats.totalTransactionsToday}</strong> orders completed today.
                    </p>
                  </div>
                </div>
              </div>

              {/* STATISTIK SEKUNDER (Kanan) */}
              <div className="flex flex-col gap-6">
                {/* Kartu Branches */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4 h-full hover:shadow-md transition-shadow">
                  <div className="p-4 bg-orange-50 text-orange-600 rounded-xl">
                    <Store size={32} />
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium text-sm">Total Branches</p>
                    <h3 className="text-3xl font-bold text-gray-900">{stats.totalBranches}</h3>
                  </div>
                </div>

                {/* Kartu Licenses */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4 h-full hover:shadow-md transition-shadow">
                  <div className="p-4 bg-purple-50 text-purple-600 rounded-xl">
                    <Smartphone size={32} />
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium text-sm">Active Devices</p>
                    <div className="flex items-center gap-2">
                      <h3 className="text-3xl font-bold text-gray-900">{stats.activeLicenses}</h3>
                      <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Online</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* --- SECTION 2: QUICK ACTIONS (Menu Grid) --- */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
                {quickActions.map((item, index) => (
                  <Link href={item.href} key={index} className="group block h-full">
                    <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-300 h-full flex flex-col justify-between relative overflow-hidden">
                      
                      {/* Hover Effect Gradient Line */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                      <div className="flex justify-between items-start mb-6">
                        <div className={`p-4 rounded-xl ${item.bg} ${item.color} group-hover:scale-110 transition-transform duration-300`}>
                          <item.icon size={32} />
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <ArrowRight size={20} />
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                        <p className="text-gray-500 font-medium mt-2">{item.subtitle}</p>
                      </div>

                    </div>
                  </Link>
                ))}
              </div>
            </div>

          </>
        )}
      </div>
    </MainLayout>
  );
}
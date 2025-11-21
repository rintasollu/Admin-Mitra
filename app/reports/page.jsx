"use client";

import React, { useState, useEffect } from "react";
import MainLayout from "../components/MainLayout"; 
import * as XLSX from 'xlsx'; // Import Library Excel
import { 
  Search, Calendar, Filter, Download, 
  TrendingUp, DollarSign, ShoppingBag, CreditCard, 
  Loader2, AlertCircle, TicketPercent 
} from "lucide-react";

export default function ReportsPage() {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState("sales"); // 'sales' | 'expenses' | 'items'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Data State
  const [reportData, setReportData] = useState(null); 
  const [branches, setBranches] = useState([]); 

  // Filter State
  const [selectedBranch, setSelectedBranch] = useState("");
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0], // Default hari ini
    end: new Date().toISOString().split('T')[0]
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.15:3001/api";

  // --- 1. FETCH BRANCHES (Untuk Filter) ---
  useEffect(() => {
    const fetchBranches = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/branch`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) setBranches(await res.json());
      } catch (err) { console.error("Failed to load branches"); }
    };
    fetchBranches();
  }, []);

  // --- 2. FETCH REPORTS (Core Logic) ---
  const fetchReportData = async () => {
    setIsLoading(true);
    setError("");
    setReportData(null);
    
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Bangun Query Params sesuai Dokumentasi
      const params = new URLSearchParams();
      if (selectedBranch) params.append("branchId", selectedBranch);
      if (dateRange.start) params.append("tanggalMulai", dateRange.start);
      if (dateRange.end) params.append("tanggalSelesai", dateRange.end);

      // Endpoint dinamis berdasarkan Tab Active
      const endpoint = `${API_URL}/report/${activeTab}?${params.toString()}`;

      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Failed to fetch report data");

      const data = await res.json();
      setReportData(data);

    } catch (err) {
      console.error(err);
      setError("Failed to load report. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch ulang saat Tab berubah
  useEffect(() => {
    fetchReportData();
  }, [activeTab]);

  const handleApplyFilter = (e) => {
    e.preventDefault();
    fetchReportData(); // Manual fetch saat klik filter
  };

  // --- 3. EXPORT TO EXCEL FUNCTION ---
  const handleExportExcel = () => {
    if (!reportData) return;

    let dataToExport = [];
    let fileName = `Report_${activeTab}_${dateRange.start}.xlsx`;

    // Logika formatting data berdasarkan Tab Aktif
    if (activeTab === 'sales') {
      if (reportData.data && Array.isArray(reportData.data)) {
        dataToExport = reportData.data.map(item => ({
          Date: new Date(item.created_at).toLocaleDateString("id-ID"),
          OrderID: item.order_number || item.id,
          Branch: item.branch_name || "-",
          Amount: parseInt(item.final_amount || 0),
          Status: "COMPLETED"
        }));
      }
    } else if (activeTab === 'expenses') {
      if (Array.isArray(reportData)) {
        dataToExport = reportData.map(item => ({
          Date: new Date(item.date).toLocaleDateString("id-ID"),
          Description: item.description,
          Category: item.category,
          Amount: parseInt(item.amount || 0)
        }));
      }
    } else if (activeTab === 'items') {
      if (Array.isArray(reportData)) {
        dataToExport = reportData.map((item, index) => ({
          Rank: index + 1,
          ProductName: item.product_name,
          QtySold: parseInt(item.total_quantity || 0),
          TotalRevenue: parseInt(item.total_revenue || 0)
        }));
      }
    }

    if (dataToExport.length === 0) {
      alert("No data available to export.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report Data");
    XLSX.writeFile(workbook, fileName);
  };

  // --- HELPERS ---
  const formatRp = (val) => "Rp " + parseInt(val || 0).toLocaleString("id-ID");

  return (
    <MainLayout>
      <div className="animate-in fade-in duration-500">
        
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 mt-2 text-base">Monitor sales performance, expenses, and top products.</p>
        </div>

        {/* FILTER BAR */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm mb-8">
          <form onSubmit={handleApplyFilter} className="flex flex-col md:flex-row gap-4 items-end">
            
            {/* Branch Selector */}
            <div className="w-full md:w-1/4">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Branch</label>
              <select 
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-300 outline-none bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-200 transition-all"
              >
                <option value="">All Branches (Combination)</option>
                {branches.map(b => (
                  <option key={b.branch_id || b.id} value={b.branch_id || b.id}>{b.branch_name}</option>
                ))}
              </select>
            </div>

            {/* Date Start */}
            <div className="w-full md:w-1/4">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start Date</label>
              <input 
                type="date" 
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                className="w-full p-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>

            {/* Date End */}
            <div className="w-full md:w-1/4">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">End Date</label>
              <input 
                type="date" 
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                className="w-full p-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>

            {/* ACTION BUTTONS GROUP (Responsive) */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              
              {/* Filter Button */}
              <button 
                type="submit"
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Filter size={20} /> Apply
              </button>

              {/* Export Excel Button */}
              <button 
                type="button"
                onClick={handleExportExcel}
                disabled={isLoading || !reportData}
                className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Download as Excel"
              >
                <Download size={20} /> Export
              </button>
              
            </div>

          </form>
        </div>

        {/* TABS */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['sales', 'expenses', 'items'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-xl font-bold text-sm capitalize transition-all whitespace-nowrap ${
                activeTab === tab 
                  ? "bg-gray-900 text-white shadow-md" 
                  : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              {tab} Report
            </button>
          ))}
        </div>

        {/* CONTENT AREA */}
        {isLoading ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-gray-200">
            <Loader2 size={40} className="animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-gray-500">Generating report...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 text-red-600 rounded-2xl border border-red-200 flex items-center gap-3">
            <AlertCircle size={24} /> {error}
          </div>
        ) : (
          <>
            {/* --- TAB 1: SALES REPORT --- */}
            {activeTab === 'sales' && reportData && (
              <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <SummaryCard 
                    title="Total Sales (Net)" 
                    value={formatRp(reportData.summary?.total_sales)} 
                    icon={DollarSign} color="text-green-600" bg="bg-green-50" 
                  />
                  <SummaryCard 
                    title="Transaction Count" 
                    value={reportData.summary?.transaction_count || 0} 
                    icon={ShoppingBag} color="text-blue-600" bg="bg-blue-50" 
                  />
                  <SummaryCard 
                    title="Total Discount" 
                    value={formatRp(reportData.summary?.total_discount)} 
                    icon={TicketPercent} color="text-orange-600" bg="bg-orange-50" 
                  />
                  <SummaryCard 
                    title="Total Tax Collected" 
                    value={formatRp(reportData.summary?.total_tax)} 
                    icon={CreditCard} color="text-purple-600" bg="bg-purple-50" 
                  />
                </div>

                {/* Transaction Table */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 font-bold text-gray-800">
                    Transaction History
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                        <tr>
                          <th className="p-4">Date</th>
                          <th className="p-4">Order ID</th>
                          <th className="p-4">Branch</th>
                          <th className="p-4 text-right">Amount</th>
                          <th className="p-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {reportData.data?.length > 0 ? reportData.data.map((trx, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="p-4 text-sm text-gray-600">{new Date(trx.created_at).toLocaleDateString("id-ID")}</td>
                            <td className="p-4 font-mono text-sm text-gray-900">{trx.order_number || trx.id}</td>
                            <td className="p-4 text-sm text-gray-600">{trx.branch_name || "-"}</td>
                            <td className="p-4 text-right font-bold text-gray-900">{formatRp(trx.final_amount)}</td>
                            <td className="p-4 text-center">
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">COMPLETED</span>
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan="5" className="p-8 text-center text-gray-500">No transactions found in this period.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* --- TAB 2: EXPENSES REPORT --- */}
            {activeTab === 'expenses' && (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                 <div className="px-6 py-4 border-b border-gray-100 font-bold text-gray-800 flex justify-between items-center">
                    <span>Expense Report</span>
                    <span className="text-sm text-red-600">
                      Total: {formatRp(Array.isArray(reportData) ? reportData.reduce((acc, curr) => acc + parseInt(curr.amount || 0), 0) : 0)}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                        <tr>
                          <th className="p-4">Date</th>
                          <th className="p-4">Description</th>
                          <th className="p-4">Category</th>
                          <th className="p-4 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {Array.isArray(reportData) && reportData.length > 0 ? reportData.map((exp, idx) => (
                          <tr key={idx}>
                             <td className="p-4 text-sm text-gray-600">{new Date(exp.date).toLocaleDateString()}</td>
                             <td className="p-4 text-gray-900 font-medium">{exp.description}</td>
                             <td className="p-4 text-sm text-gray-500">{exp.category}</td>
                             <td className="p-4 text-right font-bold text-red-600">-{formatRp(exp.amount)}</td>
                          </tr>
                        )) : (
                          <tr><td colSpan="4" className="p-8 text-center text-gray-500">No expense records found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
              </div>
            )}

            {/* --- TAB 3: ITEMS REPORT (Best Sellers) --- */}
            {activeTab === 'items' && (
               <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                  <div className="px-6 py-4 border-b border-gray-100 font-bold text-gray-800">
                    Top Selling Items
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                        <tr>
                          <th className="p-4">Rank</th>
                          <th className="p-4">Product Name</th>
                          <th className="p-4 text-right">Qty Sold</th>
                          <th className="p-4 text-right">Total Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {Array.isArray(reportData) && reportData.length > 0 ? reportData.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                             <td className="p-4">
                               <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                                 #{idx + 1}
                               </span>
                             </td>
                             <td className="p-4 text-gray-900 font-bold text-lg">{item.product_name}</td>
                             <td className="p-4 text-right text-gray-700">{item.total_quantity} pcs</td>
                             <td className="p-4 text-right font-bold text-blue-600">{formatRp(item.total_revenue)}</td>
                          </tr>
                        )) : (
                          <tr><td colSpan="4" className="p-8 text-center text-gray-500">No sales data available.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
               </div>
            )}

          </>
        )}
      </div>
    </MainLayout>
  );
}

// --- COMPONENT KECIL: Summary Card ---
function SummaryCard({ title, value, icon: Icon, color, bg }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-14 h-14 rounded-xl ${bg} flex items-center justify-center ${color}`}>
        <Icon size={28} />
      </div>
      <div>
        <p className="text-gray-500 font-medium text-sm mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{value}</h3>
      </div>
    </div>
  );
}
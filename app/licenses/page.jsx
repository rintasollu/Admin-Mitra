"use client";

import React, { useState, useEffect } from "react";
import MainLayout from "../components/MainLayout"; 
import { 
  Plus, RefreshCw, Key, Smartphone, 
  Building2, Loader2, X, AlertCircle 
} from "lucide-react";

export default function LicensesPage() {
  // --- STATE ---
  const [licenses, setLicenses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
  
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  
  const [generateQty, setGenerateQty] = useState(1);
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.15:3001/api";

  // --- FETCH DATA ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const [resLicenses, resBranches] = await Promise.all([
        fetch(`${API_URL}/license`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/branch`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (resLicenses.ok) setLicenses(await resLicenses.json());
      if (resBranches.ok) setBranches(await resBranches.json());
      
    } catch (err) {
      setError("Failed to load data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- HANDLERS ---
  const handleGenerate = async (e) => {
    e.preventDefault();
    setModalError("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/license/generate`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: parseInt(generateQty) })
      });
      if (!res.ok) throw new Error("Failed to generate.");
      fetchData();
      setIsGenerateModalOpen(false);
    } catch (err) {
      setModalError(err.message);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setModalError("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/license/assign-branch`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ activation_code: selectedLicense.activation_code, branch_id: selectedBranchId })
      });
      if (!res.ok) throw new Error("Failed to assign.");
      fetchData();
      setIsAssignModalOpen(false);
    } catch (err) {
      setModalError(err.message);
    }
  };

  const handleResetDevice = async (code) => {
    if (!confirm("Reset this device allocation?")) return;
    const token = localStorage.getItem("token");
    try {
      await fetch(`${API_URL}/license/reset-device`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ activation_code: code })
      });
      fetchData();
    } catch (err) {}
  };

  const getBranchName = (license) => {
    if (license.branch && license.branch.branch_name) return license.branch.branch_name;
    const f = branches.find(b => (b.branch_id || b.id) === license.branch_id);
    return f ? f.branch_name : null;
  };

  return (
    <MainLayout>
      <div className="animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Licenses</h1>
            <p className="text-gray-500 text-sm">Manage activation codes.</p>
          </div>
          <button 
            onClick={() => { setGenerateQty(1); setIsGenerateModalOpen(true); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-all active:scale-95"
          >
            <Plus size={18} /> Generate License
          </button>
        </div>

        {/* Stats Grid (Compact) */}
        <div className="grid grid-cols-3 gap-4 mb-6">
           <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
             <p className="text-[10px] text-gray-500 font-bold uppercase">Total</p>
             <h3 className="text-2xl font-bold text-gray-900">{licenses.length}</h3>
           </div>
           <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
             <p className="text-[10px] text-gray-500 font-bold uppercase">Active</p>
             <h3 className="text-2xl font-bold text-green-600">{licenses.filter(l => l.license_status === 'Active').length}</h3>
           </div>
           <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
             <p className="text-[10px] text-gray-500 font-bold uppercase">Available</p>
             <h3 className="text-2xl font-bold text-yellow-600">{licenses.filter(l => l.license_status !== 'Active').length}</h3>
           </div>
        </div>

        {/* TABLE (COMPACT / KECIL) */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-3 text-xs font-bold text-gray-600 uppercase">Code</th>
                <th className="p-3 text-xs font-bold text-gray-600 uppercase">Status</th>
                <th className="p-3 text-xs font-bold text-gray-600 uppercase">Branch</th>
                <th className="p-3 text-xs font-bold text-gray-600 uppercase">Device</th>
                <th className="p-3 text-xs font-bold text-gray-600 uppercase text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan="5" className="p-8 text-center text-sm text-gray-500"><Loader2 className="animate-spin inline mr-2" size={16}/> Loading...</td></tr>
              ) : licenses.map((lic, idx) => (
                <tr key={idx} className="hover:bg-blue-50 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Key size={14} className="text-purple-500"/>
                      <span className="font-mono font-bold text-sm text-gray-800">{lic.activation_code}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    {lic.license_status === "Active" ? (
                      <span className="text-green-600 bg-green-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Active</span>
                    ) : lic.license_status === "Assigned" ? (
                      <span className="text-blue-600 bg-blue-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Assigned</span>
                    ) : (
                      <span className="text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Pending</span>
                    )}
                  </td>
                  <td className="p-3 text-sm text-gray-700">
                    {getBranchName(lic) || <span className="italic text-gray-400 text-xs">Unassigned</span>}
                  </td>
                  <td className="p-3 text-sm text-gray-700">
                    <div className="flex items-center gap-1">
                      {lic.device_name ? <Smartphone size={14} className="text-gray-400"/> : null}
                      {lic.device_name || "-"}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    {lic.license_status === "Pending" && (
                      <button 
                        onClick={() => { setSelectedLicense(lic); setSelectedBranchId(""); setIsAssignModalOpen(true); }}
                        className="bg-blue-50 text-blue-600 text-[10px] px-3 py-1.5 rounded font-bold hover:bg-blue-100 transition-colors"
                      >
                        Assign
                      </button>
                    )}
                    {lic.license_status === "Active" && (
                      <button 
                        onClick={() => handleResetDevice(lic.activation_code)}
                        className="bg-orange-50 text-orange-600 text-[10px] px-3 py-1.5 rounded font-bold hover:bg-orange-100 flex items-center gap-1 mx-auto transition-colors"
                      >
                        <RefreshCw size={10}/> Reset
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- MODAL FORM (BESAR / STANDARD SIZE) --- */}
        
        {/* 1. Generate Modal */}
        {isGenerateModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
             <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                   <h3 className="text-xl font-bold text-gray-900">Generate Licenses</h3>
                   <button onClick={() => setIsGenerateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                     <X size={24}/>
                   </button>
                </div>
                <form onSubmit={handleGenerate} className="p-8 space-y-6">
                  {modalError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2"><AlertCircle size={16}/>{modalError}</div>}
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Quantity</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="50" 
                      value={generateQty} 
                      onChange={(e) => setGenerateQty(e.target.value)} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none text-base"
                    />
                    <p className="text-sm text-gray-500 mt-2">Maximum 50 keys per batch.</p>
                  </div>

                  <div className="flex gap-4 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setIsGenerateModalOpen(false)} 
                      className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50 text-base transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 text-base shadow-lg transition-transform active:scale-95"
                    >
                      Generate
                    </button>
                  </div>
                </form>
             </div>
           </div>
        )}

        {/* 2. Assign Modal */}
        {isAssignModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
             <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                   <h3 className="text-xl font-bold text-gray-900">Assign Branch</h3>
                   <button onClick={() => setIsAssignModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                     <X size={24}/>
                   </button>
                </div>
                <form onSubmit={handleAssign} className="p-8 space-y-6">
                  {modalError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2"><AlertCircle size={16}/>{modalError}</div>}
                  
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <p className="text-sm text-blue-600 font-medium mb-1">Selected License Code:</p>
                    <p className="text-lg font-mono font-bold text-blue-800 tracking-wide">
                      {selectedLicense?.activation_code}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Select Branch</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-3.5 text-gray-400" size={20}/>
                      <select 
                        value={selectedBranchId} 
                        onChange={(e) => setSelectedBranchId(e.target.value)} 
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none text-base bg-white appearance-none"
                      >
                        <option value="">-- Choose a Branch --</option>
                        {branches.map(b => (
                          <option key={b.id || b.branch_id} value={b.id || b.branch_id}>
                            {b.branch_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setIsAssignModalOpen(false)} 
                      className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50 text-base transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 text-base shadow-lg transition-transform active:scale-95"
                    >
                      Save Assignment
                    </button>
                  </div>
                </form>
             </div>
           </div>
        )}

      </div>
    </MainLayout>
  );
}
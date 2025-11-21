"use client";

import React, { useState, useEffect } from "react";
import MainLayout from "../components/MainLayout"; 
import { Plus, MapPin, Trash2, Edit, Search, X, Save, Phone, Loader2, AlertCircle } from "lucide-react";

export default function BranchesPage() {
  // --- STATE ---
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({ branch_name: "", address: "", phone_number: "" });
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.15:3001/api";

  // --- API FETCHING ---
  const fetchBranches = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token"); if (!token) return;
      const res = await fetch(`${API_URL}/branch`, { headers: { "Authorization": `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to fetch branches");
      setBranches(await res.json());
    } catch (err) { setError("Failed to load data."); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchBranches(); }, []);

  const handleSave = async (e) => {
    e.preventDefault(); setModalError("");
    const token = localStorage.getItem("token");
    try {
      let url = isEditing ? `${API_URL}/branch/${currentId}` : `${API_URL}/branch`;
      let method = isEditing ? "PUT" : "POST";
      const res = await fetch(url, { method: method, headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save.");
      await fetchBranches(); setIsModalOpen(false);
    } catch (err) { setModalError(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this branch?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/branch/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to delete.");
      fetchBranches();
    } catch (err) { alert(err.message); }
  };

  const openAddModal = () => { setFormData({ branch_name: "", address: "", phone_number: "" }); setModalError(""); setIsEditing(false); setIsModalOpen(true); };
  const openEditModal = (branch) => { setFormData({ branch_name: branch.branch_name, address: branch.address, phone_number: branch.phone_number }); setCurrentId(branch.branch_id || branch.id); setModalError(""); setIsEditing(true); setIsModalOpen(true); };

  return (
    <MainLayout>
      <div className="animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div><h1 className="text-2xl font-bold text-gray-900">Branch Management</h1><p className="text-gray-500 text-sm">Manage outlets location.</p></div>
          <button onClick={openAddModal} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-md text-sm transition-all"><Plus size={18} /> Add Branch</button>
        </div>

        {/* Search Compact */}
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm mb-6 flex items-center gap-2">
          <Search size={20} className="text-gray-400" />
          <input type="text" placeholder="Search branch..." className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400"/>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}

        {/* TABLE COMPACT (Padding Kecil) */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-3 text-xs font-bold text-gray-600 uppercase">Branch Name</th>
                <th className="p-3 text-xs font-bold text-gray-600 uppercase">Address</th>
                <th className="p-3 text-xs font-bold text-gray-600 uppercase">Phone</th>
                <th className="p-3 text-xs font-bold text-gray-600 uppercase text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? <tr><td colSpan="4" className="p-8 text-center text-sm text-gray-500">Loading...</td></tr> : branches.map((branch, index) => (
                <tr key={index} className="hover:bg-blue-50 transition-colors">
                  <td className="p-3"><div className="font-bold text-sm text-gray-900">{branch.branch_name}</div><div className="text-xs text-gray-400">ID: {branch.branch_id || branch.id}</div></td>
                  <td className="p-3"><div className="flex items-center gap-2 text-sm text-gray-600"><MapPin size={14} className="text-red-500 flex-shrink-0" /><span className="truncate max-w-xs">{branch.address}</span></div></td>
                  <td className="p-3"><div className="flex items-center gap-2 text-sm text-gray-600"><Phone size={14} className="text-green-500 flex-shrink-0" />{branch.phone_number || "-"}</div></td>
                  <td className="p-3 text-center"><div className="flex justify-center gap-2"><button onClick={() => openEditModal(branch)} className="p-1.5 bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100"><Edit size={16}/></button><button onClick={() => handleDelete(branch.branch_id || branch.id)} className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100"><Trash2 size={16}/></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MODAL FORM (BESAR / STANDARD SEPERTI GAMBAR) */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">{isEditing ? "Edit Branch" : "Add New Branch"}</h3>
                <button onClick={() => setIsModalOpen(false)}><X size={24} className="text-gray-400 hover:text-gray-600" /></button>
              </div>
              <form onSubmit={handleSave} className="p-8 space-y-5">
                {modalError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{modalError}</div>}
                
                {/* Input Field Besar */}
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">Branch Name</label>
                   <input type="text" required value={formData.branch_name} onChange={(e) => setFormData({...formData, branch_name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-200 outline-none text-base" placeholder="e.g. Main Outlet - Jakarta"/>
                </div>
                
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">Address</label>
                   <div className="relative">
                     <MapPin className="absolute left-4 top-3.5 text-gray-400" size={20} />
                     <input type="text" required value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-200 outline-none text-base" placeholder="e.g. Jl. Sudirman No. 10"/>
                   </div>
                </div>

                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                   <div className="relative">
                     <Phone className="absolute left-4 top-3.5 text-gray-400" size={20} />
                     <input type="text" required value={formData.phone_number} onChange={(e) => setFormData({...formData, phone_number: e.target.value})} className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-200 outline-none text-base" placeholder="e.g. 08123456789"/>
                   </div>
                </div>

                <div className="flex gap-4 pt-4">
                   <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50">Cancel</button>
                   <button type="submit" className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200">Save Branch</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
"use client";

import React, { useState, useEffect } from "react";
import MainLayout from "../components/MainLayout"; 
import { 
  Plus, Search, Trash2, Edit, X, Save, 
  User, Building2, Lock, Loader2, AlertCircle 
} from "lucide-react";

export default function PartnersPage() {
  // --- STATE (LOGIKA TIDAK DIUBAH) ---
  const [admins, setAdmins] = useState([]); 
  const [branches, setBranches] = useState([]); 
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  // Form Data
  const [formData, setFormData] = useState({ 
    full_name: "", 
    username: "", 
    password: "", 
    branch_id: "" 
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.15:3001/api";

  // --- FETCH DATA ---
  const fetchData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const [resAdmins, resBranches] = await Promise.all([
        fetch(`${API_URL}/branch/admin`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/branch`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (!resAdmins.ok || !resBranches.ok) {
        throw new Error("Failed to fetch data");
      }

      const dataAdmins = await resAdmins.json();
      const dataBranches = await resBranches.json();

      setAdmins(dataAdmins);
      setBranches(dataBranches);

    } catch (err) {
      console.error(err);
      setError("Failed to load data. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- HANDLE SAVE ---
  const handleSave = async (e) => {
    e.preventDefault();
    setModalError("");

    if (!formData.branch_id) {
      setModalError("Please select a branch.");
      return;
    }

    const token = localStorage.getItem("token");

    try {
      let url = `${API_URL}/branch/admin`;
      let method = "POST";

      if (isEditing) {
        url = `${API_URL}/branch/admin/${currentId}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method: method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save admin.");
      }

      fetchData(); 
      setIsModalOpen(false);
    } catch (err) {
      setModalError(err.message);
    }
  };

  // --- HANDLE DELETE ---
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this admin account?")) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/branch/admin/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete admin.");
      }

      setAdmins(admins.filter((admin) => admin.id !== id && admin.user_id !== id));

    } catch (err) {
      alert(err.message);
    }
  };

  // --- UI HELPERS ---
  const openAddModal = () => {
    setFormData({ full_name: "", username: "", password: "", branch_id: "" });
    setModalError("");
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (admin) => {
    setFormData({ 
      full_name: admin.full_name, 
      username: admin.username, 
      password: "", 
      branch_id: admin.branch_id 
    });
    setCurrentId(admin.id || admin.user_id);
    setModalError("");
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const getBranchName = (branchId) => {
    const branch = branches.find(b => (b.branch_id || b.id) === branchId);
    return branch ? branch.branch_name : "Unknown Branch";
  };

  return (
    <MainLayout>
      <div className="animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Branch Admin Management</h1>
            <p className="text-gray-500 text-sm">Manage accounts for your branch managers.</p>
          </div>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-md text-sm transition-all active:scale-95"
          >
            <Plus size={18} /> Create Admin Account
          </button>
        </div>

        {/* Search & Error */}
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm mb-6 flex items-center gap-3">
          <Search size={20} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Search admin name or username..." 
            className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400"
          />
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg border border-red-200 flex items-center gap-2 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* TABLE (COMPACT / KECIL) */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="p-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Admin Details</th>
                  <th className="p-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Assigned Branch</th>
                  <th className="p-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan="3" className="p-8 text-center text-gray-500 text-sm">
                      <Loader2 className="animate-spin inline mr-2" size={16} /> Loading data...
                    </td>
                  </tr>
                ) : admins.length > 0 ? (
                  admins.map((admin, index) => (
                    <tr key={admin.id || admin.user_id || index} className="hover:bg-blue-50 transition-colors group">
                      
                      {/* Admin Details */}
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold uppercase text-xs">
                            {admin.full_name ? admin.full_name.charAt(0) : "U"}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-gray-900">{admin.full_name}</div>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                              <User size={12} /> @{admin.username}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Branch Name */}
                      <td className="p-3">
                        <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                          <Building2 size={16} className="text-gray-400" />
                          {admin.branch_name || getBranchName(admin.branch_id)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => openEditModal(admin)} 
                            className="p-1.5 bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100 transition-colors" 
                            title="Edit Account"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(admin.id || admin.user_id)} 
                            className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors" 
                            title="Delete Account"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="p-8 text-center text-gray-500 text-sm">
                      No admin accounts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL FORM (TETAP BESAR / LEGA SEPERTI REQUEST) */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100">
              
              <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">{isEditing ? "Edit Admin Account" : "Create Admin Account"}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1"><X size={24} /></button>
              </div>
              
              <form onSubmit={handleSave} className="p-8 space-y-6">
                
                {/* Error Modal */}
                {modalError && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-start gap-2">
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                    <div>{modalError}</div>
                  </div>
                )}

                {/* Full Name (Input Besar) */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.full_name} 
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})} 
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-base" 
                    placeholder="e.g. Manager Cabang A"
                  />
                </div>

                {/* Username (Input Besar) */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Username</label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 text-gray-400" size={20} />
                    <input 
                      type="text" 
                      required 
                      value={formData.username} 
                      onChange={(e) => setFormData({...formData, username: e.target.value})} 
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-base" 
                      placeholder="e.g. manajer_a"
                    />
                  </div>
                </div>

                {/* Password (Input Besar) */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {isEditing ? "New Password (Optional)" : "Password"}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
                    <input 
                      type="password" 
                      required={!isEditing} 
                      value={formData.password} 
                      onChange={(e) => setFormData({...formData, password: e.target.value})} 
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-base" 
                      placeholder={isEditing ? "Leave blank to keep current password" : "Enter strong password"}
                    />
                  </div>
                </div>

                {/* Branch Dropdown (Input Besar) */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Assign to Branch</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-3.5 text-gray-400" size={20} />
                    <select 
                      required
                      value={formData.branch_id} 
                      onChange={(e) => setFormData({...formData, branch_id: e.target.value})} 
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-base appearance-none bg-white"
                    >
                      <option value="" disabled>-- Select a Branch --</option>
                      {branches.map((branch) => (
                        <option key={branch.branch_id || branch.id} value={branch.branch_id || branch.id}>
                          {branch.branch_name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-4 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>

                {/* Buttons Besar */}
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50 text-base transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 text-base shadow-lg shadow-blue-200 transition-transform active:scale-95 flex items-center justify-center gap-2"><Save size={20} /> Save Admin</button>
                </div>

              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
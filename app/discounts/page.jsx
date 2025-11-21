"use client";

import React, { useState, useEffect } from "react";
import MainLayout from "../components/MainLayout"; 
import { 
  Plus, Search, Trash2, Edit, X, Save, 
  TicketPercent, Calendar, AlertCircle, Loader2, CheckSquare, Tag, Box
} from "lucide-react";

export default function DiscountsPage() {
  // --- STATE ---
  const [discounts, setDiscounts] = useState([]);
  const [products, setProducts] = useState([]); 
  const [categories, setCategories] = useState([]); // STATE BARU: Untuk menyimpan data kategori
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.15:3001/api";

  // Form Data Default
  const initialForm = {
    discount_name: "",
    discount_code: "",
    discount_type: "PERCENTAGE",
    value: "",
    applies_to: "ENTIRE_TRANSACTION", 
    min_transaction_amount: 0,
    max_discount_amount: 0,
    start_date: "",
    end_date: "",
    product_ids: [],
    category_ids: [] // FIELD BARU: Untuk menampung ID kategori yang dipilih
  };

  const [formData, setFormData] = useState(initialForm);

  // --- 1. FETCH DATA (Diskon, Produk, & Kategori) ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch Discounts, Products, dan Categories secara paralel
      const [resDiscounts, resProducts, resCategories] = await Promise.all([
        fetch(`${API_URL}/discount-rule`, { headers }),
        fetch(`${API_URL}/product`, { headers }),
        fetch(`${API_URL}/category/all`, { headers }) // Endpoint kategori
      ]);

      if (resDiscounts.ok) setDiscounts(await resDiscounts.json());
      if (resProducts.ok) setProducts(await resProducts.json());
      if (resCategories.ok) setCategories(await resCategories.json());

    } catch (err) {
      console.error(err);
      setError("Failed to load data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- 2. HANDLE SAVE ---
  const handleSave = async (e) => {
    e.preventDefault();
    setModalError("");
    const token = localStorage.getItem("token");

    // Persiapkan payload
    const payload = {
      ...formData,
      value: Number(formData.value),
      min_transaction_amount: Number(formData.min_transaction_amount),
      max_discount_amount: Number(formData.max_discount_amount),
      start_date: new Date(formData.start_date).toISOString(),
      end_date: new Date(formData.end_date).toISOString(),
    };

    // LOGIKA PEMBERSIHAN DATA SEBELUM KIRIM
    // Jika user memilih Specific Products, kosongkan category_ids agar tidak ambigu
    if (formData.applies_to === "SPECIFIC_PRODUCTS") {
        payload.category_ids = [];
    } 
    // Jika user memilih Specific Categories, kosongkan product_ids
    else if (formData.applies_to === "SPECIFIC_CATEGORIES") {
        payload.product_ids = [];
    }
    // Jika Entire Transaction, kosongkan keduanya
    else {
        payload.product_ids = [];
        payload.category_ids = [];
    }

    try {
      let url = `${API_URL}/discount-rule`;
      let method = "POST";

      if (isEditing) {
        // Logika edit (jika backend support)
        // url = `${API_URL}/discount-rule/${currentId}`;
        // method = "PUT";
        alert("Edit feature depends on backend availability."); 
        return; 
      }

      const res = await fetch(url, {
        method: method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) throw new Error("Failed: Discount Code already exists.");
        throw new Error(data.message || "Failed to save discount.");
      }

      fetchData();
      setIsModalOpen(false);
    } catch (err) {
      setModalError(err.message);
    }
  };

  // --- 3. HANDLE DELETE ---
  const handleDelete = async (id) => {
    if (!confirm("Delete this discount rule?")) return;
    const token = localStorage.getItem("token");
    try {
      await fetch(`${API_URL}/discount-rule/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch (err) {
      alert("Delete failed.");
    }
  };

  // --- HELPERS ---
  
  // Toggle Produk
  const toggleProductSelection = (productId) => {
    const currentIds = formData.product_ids;
    if (currentIds.includes(productId)) {
      setFormData({ ...formData, product_ids: currentIds.filter(id => id !== productId) });
    } else {
      setFormData({ ...formData, product_ids: [...currentIds, productId] });
    }
  };

  // Toggle Kategori (BARU)
  const toggleCategorySelection = (categoryId) => {
    const currentIds = formData.category_ids;
    if (currentIds.includes(categoryId)) {
      setFormData({ ...formData, category_ids: currentIds.filter(id => id !== categoryId) });
    } else {
      setFormData({ ...formData, category_ids: [...currentIds, categoryId] });
    }
  };

  const openAddModal = () => {
    setFormData(initialForm);
    setModalError("");
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const formatRp = (val) => "Rp " + parseInt(val || 0).toLocaleString("id-ID");
  
  const formatDate = (isoString) => {
    if(!isoString) return "-";
    return new Date(isoString).toLocaleDateString("id-ID", {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  return (
    <MainLayout>
      <div className="animate-in fade-in duration-500">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Discount Management</h1>
            <p className="text-gray-500 mt-2 text-base">Manage general promo codes and discount rules.</p>
          </div>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
          >
            <Plus size={24} /> Create Discount
          </button>
        </div>

        {/* TABLE LIST */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-6 text-base font-bold text-gray-600 uppercase">Discount Details</th>
                <th className="p-6 text-base font-bold text-gray-600 uppercase">Value</th>
                <th className="p-6 text-base font-bold text-gray-600 uppercase">Scope</th>
                <th className="p-6 text-base font-bold text-gray-600 uppercase">Status</th>
                <th className="p-6 text-base font-bold text-gray-600 uppercase text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan="5" className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-600"/></td></tr>
              ) : discounts.length > 0 ? discounts.map((rule, idx) => {
                const now = new Date();
                const start = new Date(rule.start_date);
                const end = new Date(rule.end_date);
                const isActive = now >= start && now <= end;

                // Menentukan Label Scope
                let scopeLabel = "Entire Order";
                if (rule.applies_to === "SPECIFIC_PRODUCTS") scopeLabel = "Specific Products";
                if (rule.applies_to === "SPECIFIC_CATEGORIES") scopeLabel = "Specific Categories";

                return (
                  <tr key={rule.id || idx} className="hover:bg-blue-50 transition-colors">
                    <td className="p-6">
                      <div className="font-bold text-lg text-gray-900">{rule.discount_name}</div>
                      <div className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded mt-1 font-mono tracking-wider">
                        {rule.discount_code}
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="text-lg font-bold text-blue-600">
                        {rule.discount_type === "PERCENTAGE" ? `${rule.value}%` : formatRp(rule.value)}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Min. Trx: {formatRp(rule.min_transaction_amount)}
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                        {scopeLabel}
                      </span>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Calendar size={12}/> {formatDate(rule.end_date)}
                      </div>
                    </td>
                    <td className="p-6">
                      {isActive ? (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">Active</span>
                      ) : (
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">Expired</span>
                      )}
                    </td>
                    <td className="p-6 text-center">
                      <button onClick={() => handleDelete(rule.id)} className="p-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 size={20} /></button>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan="5" className="p-10 text-center text-gray-500">No discounts found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MODAL FORM */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              
              <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
                <h3 className="text-2xl font-bold text-gray-900">Create New Discount</h3>
                <button onClick={() => setIsModalOpen(false)}><X size={28} className="text-gray-400 hover:text-gray-600" /></button>
              </div>

              <form onSubmit={handleSave} className="p-8 space-y-6">
                {modalError && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                    <AlertCircle size={16} /> {modalError}
                  </div>
                )}

                {/* 1. BASIC INFO */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Promo Name</label>
                    <input 
                      type="text" required 
                      value={formData.discount_name}
                      onChange={(e) => setFormData({...formData, discount_name: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none"
                      placeholder="e.g. Promo Gajian"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Promo Code</label>
                    <input 
                      type="text" required 
                      value={formData.discount_code}
                      onChange={(e) => setFormData({...formData, discount_code: e.target.value.toUpperCase()})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none uppercase font-mono"
                      placeholder="e.g. GAJIANL2"
                    />
                  </div>
                </div>

                {/* 2. VALUE & TYPE */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Discount Type</label>
                    <select 
                      value={formData.discount_type}
                      onChange={(e) => setFormData({...formData, discount_type: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none bg-white"
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Fixed Amount (Rp)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Value</label>
                    <input 
                      type="number" required 
                      value={formData.value}
                      onChange={(e) => setFormData({...formData, value: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none"
                      placeholder="e.g. 15 or 20000"
                    />
                  </div>
                </div>

                {/* 3. DATES */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Start Date</label>
                    <input 
                      type="datetime-local" required 
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">End Date</label>
                    <input 
                      type="datetime-local" required 
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none"
                    />
                  </div>
                </div>

                {/* 4. LIMITS */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Min. Transaction (Rp)</label>
                    <input 
                      type="number" 
                      value={formData.min_transaction_amount}
                      onChange={(e) => setFormData({...formData, min_transaction_amount: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Max Discount Cap (Rp)</label>
                    <input 
                      type="number" 
                      value={formData.max_discount_amount}
                      onChange={(e) => setFormData({...formData, max_discount_amount: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none"
                      placeholder="Optional (0 for unlimited)"
                    />
                  </div>
                </div>

                {/* 5. APPLICABILITY (Logic Inti) */}
                <div className="border-t border-gray-100 pt-4">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Applies To</label>
                  <select 
                    value={formData.applies_to}
                    onChange={(e) => setFormData({...formData, applies_to: e.target.value, product_ids: [], category_ids: []})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none bg-white mb-4"
                  >
                    <option value="ENTIRE_TRANSACTION">Entire Transaction</option>
                    <option value="SPECIFIC_PRODUCTS">Specific Products Only</option>
                    {/* Pilihan Baru */}
                    <option value="SPECIFIC_CATEGORIES">Specific Categories Only</option>
                  </select>

                  {/* A. Pilihan Produk */}
                  {formData.applies_to === "SPECIFIC_PRODUCTS" && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 h-48 overflow-y-auto">
                      <p className="text-xs font-bold text-gray-500 mb-2 uppercase flex items-center gap-2">
                        <Box size={14}/> Select Products
                      </p>
                      <div className="space-y-2">
                        {products.length > 0 ? products.map(prod => (
                          <label key={prod.id || prod.product_id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition-colors">
                            <div 
                              onClick={() => toggleProductSelection(prod.id || prod.product_id)}
                              className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                formData.product_ids.includes(prod.id || prod.product_id) 
                                  ? "bg-blue-600 border-blue-600 text-white" 
                                  : "bg-white border-gray-300"
                              }`}
                            >
                              {formData.product_ids.includes(prod.id || prod.product_id) && <CheckSquare size={14} />}
                            </div>
                            <span className="text-sm text-gray-700 font-medium">{prod.product_name}</span>
                          </label>
                        )) : (
                          <p className="text-sm text-gray-400 italic">No products available.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* B. Pilihan Kategori (BARU) */}
                  {formData.applies_to === "SPECIFIC_CATEGORIES" && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 h-48 overflow-y-auto">
                      <p className="text-xs font-bold text-gray-500 mb-2 uppercase flex items-center gap-2">
                        <Tag size={14}/> Select Categories
                      </p>
                      <div className="space-y-2">
                        {categories.length > 0 ? categories.map(cat => (
                          <label key={cat.id || cat.category_id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition-colors">
                            <div 
                              onClick={() => toggleCategorySelection(cat.id || cat.category_id)}
                              className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                formData.category_ids.includes(cat.id || cat.category_id) 
                                  ? "bg-blue-600 border-blue-600 text-white" 
                                  : "bg-white border-gray-300"
                              }`}
                            >
                              {formData.category_ids.includes(cat.id || cat.category_id) && <CheckSquare size={14} />}
                            </div>
                            <span className="text-sm text-gray-700 font-medium">{cat.category_name}</span>
                          </label>
                        )) : (
                          <p className="text-sm text-gray-400 italic">No categories available.</p>
                        )}
                      </div>
                    </div>
                  )}

                </div>

                {/* BUTTONS */}
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-gray-300 rounded-xl font-bold text-gray-700">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">Create Discount</button>
                </div>

              </form>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}
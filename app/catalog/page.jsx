"use client";

import React, { useState, useEffect } from "react";
import MainLayout from "../components/MainLayout"; 
import { 
  Plus, Search, Trash2, Edit, X, Save, 
  Tag, ImageIcon, Loader2, AlertCircle 
} from "lucide-react";

export default function CatalogPage() {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState("categories");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [modalError, setModalError] = useState("");
  
  // Form Data
  const [catForm, setCatForm] = useState({ category_name: "" });
  const [prodForm, setProdForm] = useState({ 
    product_name: "", 
    base_price: "", 
    category_id: "", 
    product_image: null 
  });
  const [imagePreview, setImagePreview] = useState(null);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.15:3001/api";

  // --- FETCH DATA ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const [resCat, resProd] = await Promise.all([
        fetch(`${API_URL}/category/all`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/product`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (resCat.ok) setCategories(await resCat.json());
      if (resProd.ok) setProducts(await resProd.json());

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

  // --- HANDLERS ---
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setModalError("");
    const token = localStorage.getItem("token");
    try {
      let url = isEditing ? `${API_URL}/category/${currentId}` : `${API_URL}/category`;
      let method = isEditing ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method: method,
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(catForm)
      });

      if (!res.ok) throw new Error("Failed to save category.");
      
      await fetchData();
      setIsModalOpen(false);
    } catch (err) {
      setModalError(err.message);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setModalError("");
    const token = localStorage.getItem("token");
    try {
      const formData = new FormData();
      formData.append("product_name", prodForm.product_name);
      formData.append("base_price", prodForm.base_price);
      formData.append("category_id", prodForm.category_id);
      
      if (prodForm.product_image instanceof File) {
        formData.append("product_image", prodForm.product_image);
      }

      let url = isEditing ? `${API_URL}/product/${currentId}` : `${API_URL}/product`;
      let method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to save product.");
      
      await fetchData();
      setIsModalOpen(false);
    } catch (err) {
      setModalError(err.message);
    }
  };

  const handleDelete = async (id, type) => {
    if (!confirm("Delete this item?")) return;
    const token = localStorage.getItem("token");
    const endpoint = type === 'category' ? 'category' : 'product';
    
    try {
      await fetch(`${API_URL}/${endpoint}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch (err) {
      alert("Delete failed.");
    }
  };

  // --- UI HELPERS ---
  const openAddModal = () => {
    setModalError("");
    setIsEditing(false);
    if (activeTab === 'categories') {
      setCatForm({ category_name: "" });
    } else {
      setProdForm({ product_name: "", base_price: "", category_id: "", product_image: null });
      setImagePreview(null);
    }
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setModalError("");
    setIsEditing(true);
    setCurrentId(item.id || item.category_id || item.product_id);

    if (activeTab === 'categories') {
      setCatForm({ category_name: item.category_name });
    } else {
      setProdForm({
        product_name: item.product_name,
        base_price: item.base_price,
        category_id: item.category_id,
        product_image: item.product_image
      });
      setImagePreview(item.product_image || null);
    }
    setIsModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProdForm({ ...prodForm, product_image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const getCategoryName = (catId) => {
    const cat = categories.find(c => (c.id || c.category_id) === catId);
    return cat ? cat.category_name : "-";
  };

  return (
    <MainLayout>
      <div className="animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
             <h1 className="text-2xl font-bold text-gray-900">Catalog Management</h1>
             <p className="text-gray-500 text-sm">Manage products & categories.</p>
           </div>
           <div className="flex gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
             <button 
               onClick={() => setActiveTab("categories")} 
               className={`px-4 py-1.5 rounded-md font-bold text-xs transition-all ${activeTab === "categories" ? "bg-blue-600 text-white shadow" : "text-gray-500 hover:bg-gray-50"}`}
             >
               Categories
             </button>
             <button 
               onClick={() => setActiveTab("products")} 
               className={`px-4 py-1.5 rounded-md font-bold text-xs transition-all ${activeTab === "products" ? "bg-blue-600 text-white shadow" : "text-gray-500 hover:bg-gray-50"}`}
             >
               Products
             </button>
           </div>
        </div>

        {/* Search & Add */}
        <div className="flex gap-2 mb-6">
          <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm flex items-center gap-2 flex-1">
            <Search size={18} className="text-gray-400" />
            <input 
              type="text" 
              placeholder={`Search ${activeTab}...`}
              className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400"
            />
          </div>
          <button 
            onClick={openAddModal} 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-all active:scale-95"
          >
            <Plus size={18} /> Add New
          </button>
        </div>

        {/* --- CONTENT AREA (COMPACT VIEW) --- */}
        
        {/* 1. CATEGORIES TABLE (COMPACT) */}
        {activeTab === "categories" && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="p-3 text-xs font-bold text-gray-600 uppercase">Category Name</th>
                  <th className="p-3 text-xs font-bold text-gray-600 uppercase text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan="2" className="p-8 text-center text-sm text-gray-500"><Loader2 className="animate-spin inline mr-2" size={16}/> Loading...</td></tr>
                ) : categories.map((cat) => (
                  <tr key={cat.id || cat.category_id} className="hover:bg-blue-50 transition-colors">
                    <td className="p-3 text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Tag size={14} className="text-orange-500"/> 
                      {cat.category_name}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => openEditModal(cat)} className="p-1.5 bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100"><Edit size={14}/></button>
                        <button onClick={() => handleDelete(cat.id || cat.category_id, 'category')} className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. PRODUCTS GRID (COMPACT) */}
        {activeTab === "products" && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {isLoading ? (
               <div className="col-span-full text-center py-10 text-gray-500 text-sm"><Loader2 className="animate-spin inline mr-2"/> Loading products...</div>
            ) : products.map((prod) => (
              <div key={prod.id || prod.product_id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
                {/* Image Area (Compact Height) */}
                <div className="h-28 bg-gray-100 relative overflow-hidden group">
                  {prod.product_image ? (
                    <img src={prod.product_image} alt={prod.product_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <ImageIcon size={24} />
                    </div>
                  )}
                  <div className="absolute top-1 right-1 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-bold text-gray-600 shadow-sm">
                    {getCategoryName(prod.category_id)}
                  </div>
                </div>
                
                {/* Content Area (Compact Padding) */}
                <div className="p-2 flex flex-col flex-1">
                  <h3 className="font-bold text-xs text-gray-900 line-clamp-2 mb-1 leading-tight">{prod.product_name}</h3>
                  <p className="text-blue-600 font-bold text-sm mb-2">
                    Rp {parseInt(prod.base_price).toLocaleString("id-ID")}
                  </p>
                  
                  {/* Actions */}
                  <div className="flex gap-1 mt-auto pt-2 border-t border-gray-50">
                     <button onClick={() => openEditModal(prod)} className="flex-1 bg-yellow-50 text-yellow-700 text-[10px] font-bold py-1 rounded hover:bg-yellow-100 transition-colors">Edit</button>
                     <button onClick={() => handleDelete(prod.id || prod.product_id, 'product')} className="flex-1 bg-red-50 text-red-700 text-[10px] font-bold py-1 rounded hover:bg-red-100 transition-colors">Del</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- MODAL FORM (BESAR / LARGE STYLE) --- */}
        {isModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
             {/* Container Modal lebih lebar (max-w-lg) */}
             <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100">
                
                <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                   <h3 className="text-xl font-bold text-gray-900">
                     {isEditing ? "Edit Data" : "Add New Data"}
                   </h3>
                   <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                     <X size={24} />
                   </button>
                </div>

                <form onSubmit={activeTab === 'categories' ? handleSaveCategory : handleSaveProduct} className="p-8 space-y-6">
                  
                  {modalError && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                      <AlertCircle size={16} /> {modalError}
                    </div>
                  )}

                  {activeTab === 'categories' ? (
                    /* Form Kategori (Besar) */
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Category Name</label>
                      <input 
                        type="text" 
                        required 
                        value={catForm.category_name} 
                        onChange={(e) => setCatForm({category_name: e.target.value})} 
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-base transition-all"
                        placeholder="e.g. Beverages"
                      />
                    </div>
                  ) : (
                    /* Form Produk (Besar) */
                    <>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Product Name</label>
                        <input 
                          type="text" 
                          required 
                          value={prodForm.product_name} 
                          onChange={(e) => setProdForm({...prodForm, product_name: e.target.value})} 
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-base transition-all"
                          placeholder="e.g. Iced Americano"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Base Price (Rp)</label>
                          <input 
                            type="number" 
                            required 
                            value={prodForm.base_price} 
                            onChange={(e) => setProdForm({...prodForm, base_price: e.target.value})} 
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-base transition-all"
                            placeholder="e.g. 25000"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                          <select 
                            required 
                            value={prodForm.category_id} 
                            onChange={(e) => setProdForm({...prodForm, category_id: e.target.value})} 
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-base bg-white transition-all"
                          >
                            <option value="">Select Category</option>
                            {categories.map(c => (
                              <option key={c.id || c.category_id} value={c.id || c.category_id}>
                                {c.category_name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Product Image</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors relative">
                           <input 
                             type="file" 
                             accept="image/*" 
                             onChange={handleFileChange} 
                             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                           />
                           {imagePreview ? (
                             <img src={imagePreview} alt="Preview" className="h-24 object-contain rounded-lg shadow-sm" />
                           ) : (
                             <div className="py-4">
                               <ImageIcon size={32} className="text-gray-400 mx-auto mb-2" />
                               <p className="text-sm text-gray-500">Click to upload image</p>
                             </div>
                           )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Buttons (Besar) */}
                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)} 
                      className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50 text-base transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 text-base shadow-lg shadow-blue-200 transition-transform active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Save size={20} /> Save Data
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
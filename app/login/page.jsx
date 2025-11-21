"use client";

import React, { useState } from "react";
import { User, Lock, Loader2 } from "lucide-react";

export default function LoginPage() {
  // --- STATE ---
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // --- FUNGSI LOGIN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("http://192.168.1.15:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        // Ganti router.push dengan window.location untuk lingkungan non-Next.js
        window.location.href = "/"; 
      } else {
        setError(data.message || "Login gagal. Periksa data Anda.");
      }
    } catch (err) {
      setError("Gagal terhubung ke server.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-sans">
      
      {/* CARD WRAPPER - Membatasi lebar agar terlihat seperti kartu di tengah */}
      <div className="w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* --- BAGIAN KIRI: FORM LOGIN (White Area) --- */}
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-white relative">
          
          {/* Logo Header */}
          <div className="flex items-center gap-3 mb-10">
            {/* Logo Image menggantikan next/image */}
            <div className="relative w-10 h-10">
               <img 
                 src="/images/LOGO HOREKA (1).png" 
                 alt="Horeka Logo" 
                 className="w-full h-full object-contain"
                 onError={(e) => {e.target.style.display='none'; e.target.parentNode.innerHTML='H';}} // Fallback jika gambar tidak ada
               />
            </div>
            <span className="text-xl font-bold text-blue-800 tracking-wide">Horeka POS+</span>
          </div>

          <div className="mb-8">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Start Your Horeka</h1>
            <p className="text-gray-500 font-medium">Enter your account:</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* Username Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <User size={20} />
              </div>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-xl border-transparent focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-700 placeholder-gray-400 font-medium"
                placeholder="Username"
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={20} />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-xl border-transparent focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-700 placeholder-gray-400 font-medium"
                placeholder="Password"
              />
            </div>

            {/* Login Button */}
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-[#1a3b8f] hover:bg-[#153075] text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-transform active:scale-[0.98] mt-4 uppercase tracking-wider text-sm"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 size={20} className="animate-spin" /> Processing...
                </div>
              ) : (
                "LOGIN"
              )}
            </button>

          </form>
        </div>

        {/* --- BAGIAN KANAN: GAMBAR (Blue Overlay Area) --- */}
        <div className="w-full md:w-1/2 relative bg-blue-700 hidden md:flex flex-col items-center justify-center text-center p-12 overflow-hidden">
            
            {/* Background Image menggantikan next/image */}
            <div className="absolute inset-0 z-0">
              <img 
                src="/images/kopibg.png" 
                alt="Coffee Background"
                className="w-full h-full object-cover"
                onError={(e) => {e.target.style.display='none';}} // Fallback
              />
            </div>
            
            {/* Blue Overlay */}
            <div className="absolute inset-0 bg-blue-800/80 mix-blend-multiply z-10" />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-800/60 to-blue-800/60 z-10" />

            {/* Content Text */}
            <div className="relative z-20 max-w-md text-white">
               <h2 className="text-5xl font-bold mb-6 leading-tight drop-shadow-lg">
                 Welcome to <br/> Horeka POS+
               </h2>
               <div className="w-24 h-1 bg-white/30 mx-auto mb-6 rounded-full"></div>
               <p className="text-lg text-blue-100 font-light leading-relaxed drop-shadow-md">
                 POS app to simplify your business operations
               </p>
            </div>
        </div>

      </div>
    </div>
  );
}
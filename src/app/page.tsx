"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link"; // Header buttons ke liye

// Saare 5 Modules (Tabs) yahan import ho gaye
import PantryTab from "../components/tabs/PantryTab";
import RecipesTab from "../components/tabs/RecipesTab";
import ProfileTab from "../components/tabs/ProfileTab";
import ExploreTab from "../components/tabs/HomeTab";
import ShopTab from "../components/tabs/ShopTab";

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Default tab "explore" (Home) hai
  const [activeTab, setActiveTab] = useState("explore"); 
  const router = useRouter();

  // 🚀 Auth Logic: Ab bina login ke bhi Home page dikhega
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      } else {
        setUser(null); // User nahi hai, par redirect MAT karo
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  // 🚀 Tab Security: Private tabs par click karne par login ke liye bhejna
  const handleTabClick = (tab: string) => {
    const privateTabs = ["pantry", "shop", "profile"];
    if (!user && privateTabs.includes(tab)) {
      alert("Chef, you need to log in to access this feature! 🔒👨‍🍳");
      router.push("/login");
      return;
    }
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#07070a] cursor-wait">
         <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full mb-4"></div>
         <p className="text-orange-400 font-bold animate-pulse">Loading Zestly...</p>
      </div>
    );
  }

  // Passing user prop to tabs so they know if someone is logged in
  const renderTabContent = () => {
    switch (activeTab) {
      case "pantry": return <PantryTab />;
      case "recipes": return <RecipesTab user={user} />;
      case "explore": return <ExploreTab user={user} />;
      case "shop": return <ShopTab />;
      case "profile": return <ProfileTab user={user} />;
      default: return <ExploreTab user={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#07070a] text-white font-sans selection:bg-orange-500/30 flex flex-col cursor-default">
      <div className="fixed top-[-10%] right-[-5%] w-[20rem] h-[20rem] bg-orange-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* --- HEADER --- */}
      <header className="sticky top-0 z-50 bg-[#07070a]/80 backdrop-blur-xl border-b border-white/[0.05] px-5 py-4 flex justify-between items-center">
        <div className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500 tracking-tighter cursor-pointer" onClick={() => handleTabClick("explore")}>
          Zestly<span className="text-white text-sm ml-1 opacity-50">Pro</span>
        </div>
        
        <div className="flex items-center gap-3">
          {user ? (
            // User Logged In Hai -> XP Badge Dikhao
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.3)] cursor-pointer hover:scale-105 transition-transform" onClick={() => handleTabClick("profile")}>
              ⭐ 120 XP
            </div>
          ) : (
            // User Guest Hai -> Login/Signup Buttons Dikhao
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer active:scale-95">
                Log In
              </Link>
              <Link href="/signup" className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-full cursor-pointer transition-colors shadow-[0_0_15px_rgba(249,115,22,0.3)] active:scale-95">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 px-5 py-6 pb-28 overflow-y-auto">
        {renderTabContent()}
      </main>

      {/* --- BOTTOM NAVBAR --- */}
      <nav className="fixed bottom-0 left-0 w-full bg-[#0b0b0e]/90 backdrop-blur-2xl border-t border-white/[0.05] pb-safe z-50">
        <div className="flex justify-around items-center h-20 px-2">
          
          <button onClick={() => handleTabClick("explore")} className={`cursor-pointer flex flex-col items-center gap-1 w-16 transition-all duration-300 ${activeTab === "explore" ? "text-orange-500 scale-110 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" : "text-slate-500 hover:text-slate-300"}`}>
            <svg className="w-6 h-6" fill={activeTab === "explore" ? "currentColor" : "none"} stroke="currentColor" strokeWidth={activeTab === "explore" ? "0" : "1.5"} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V9.5z" />
            </svg>
            <span className="text-[10px] font-bold">Home</span>
          </button>

          <button onClick={() => handleTabClick("recipes")} className={`cursor-pointer flex flex-col items-center gap-1 w-16 transition-all duration-300 ${activeTab === "recipes" ? "text-orange-500 scale-110 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" : "text-slate-500 hover:text-slate-300"}`}>
            <svg className="w-6 h-6" fill={activeTab === "recipes" ? "currentColor" : "none"} stroke="currentColor" strokeWidth={activeTab === "recipes" ? "0" : "1.5"} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a4 4 0 0 0-3.82 2.94A4.004 4.004 0 0 0 4 10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4 0-1.8-1.2-3.34-2.85-3.83A4.004 4.004 0 0 0 12 3zM6 16v3a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3" />
            </svg>
            <span className="text-[10px] font-bold">Recipes</span>
          </button>

          <button onClick={() => handleTabClick("pantry")} className={`cursor-pointer flex flex-col items-center gap-1 w-16 transition-all duration-300 ${activeTab === "pantry" ? "text-orange-500 scale-110 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" : "text-slate-500 hover:text-slate-300"}`}>
            <svg className="w-6 h-6" fill={activeTab === "pantry" ? "currentColor" : "none"} stroke="currentColor" strokeWidth={activeTab === "pantry" ? "0" : "1.5"} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16v2H4zm2 4h12v11H6z" /></svg>
            <span className="text-[10px] font-bold">Pantry</span>
          </button>

          <button onClick={() => handleTabClick("shop")} className={`cursor-pointer flex flex-col items-center gap-1 w-16 transition-all duration-300 ${activeTab === "shop" ? "text-orange-500 scale-110 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" : "text-slate-500 hover:text-slate-300"}`}>
            <svg className="w-6 h-6" fill={activeTab === "shop" ? "currentColor" : "none"} stroke="currentColor" strokeWidth={activeTab === "shop" ? "0" : "1.5"} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            <span className="text-[10px] font-bold">Shop</span>
          </button>

          <button onClick={() => handleTabClick("profile")} className={`cursor-pointer flex flex-col items-center gap-1 w-16 transition-all duration-300 ${activeTab === "profile" ? "text-orange-500 scale-110 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" : "text-slate-500 hover:text-slate-300"}`}>
            <svg className="w-6 h-6" fill={activeTab === "profile" ? "currentColor" : "none"} stroke="currentColor" strokeWidth={activeTab === "profile" ? "0" : "1.5"} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span className="text-[10px] font-bold">Profile</span>
          </button>

        </div>
      </nav>
    </div>
  );
}
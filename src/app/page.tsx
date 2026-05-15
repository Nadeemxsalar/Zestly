"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";

// Saare Tabs import
import PantryTab from "../components/tabs/PantryTab";
import RecipesTab from "../components/tabs/RecipesTab";
import ProfileTab from "../components/tabs/ProfileTab";
import ExploreTab from "../components/tabs/HomeTab";
import ShopTab from "../components/tabs/ShopTab";

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("explore"); 
  const router = useRouter();

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      } else {
        setUser(null); 
      }
      setLoading(false);
    };
    checkUser();
  }, []);

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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#07070a] transition-colors duration-300">
         <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full mb-4"></div>
         <p className="text-orange-500 font-bold animate-pulse">Loading Zestly...</p>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "pantry": 
        // @ts-ignore
        return <PantryTab user={user} />;
      case "recipes": 
        // @ts-ignore
        return <RecipesTab user={user} />;
      case "explore": 
        // @ts-ignore
        return <ExploreTab user={user} />;
      case "shop": 
        return <ShopTab />;
      case "profile": 
        // @ts-ignore
        return <ProfileTab user={user} />;
      default: 
        // @ts-ignore
        return <ExploreTab user={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07070a] text-slate-900 dark:text-white font-sans selection:bg-orange-500/30 flex flex-col cursor-default transition-colors duration-300">
      
      <div className="fixed top-[-10%] right-[-5%] w-80 h-80 bg-orange-600/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

      {/* --- HEADER --- */}
      <header className="sticky top-0 z-50 bg-white/85 dark:bg-[#07070a]/85 backdrop-blur-xl border-b border-black/5 dark:border-white/5 px-5 py-3 flex justify-between items-center transition-colors duration-300 shadow-sm dark:shadow-none">
        
        <div className="text-2xl font-black bg-clip-text text-transparent bg-linear-to-r from-orange-500 to-red-500 tracking-tighter cursor-pointer" onClick={() => handleTabClick("explore")}>
          Zestly<span className="text-slate-400 dark:text-white text-sm ml-1 opacity-50">Pro</span>
        </div>
        
        <div className="flex items-center gap-3.5">
          {user ? (
            <div className="bg-linear-to-r from-yellow-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-[0_0_10px_#eab3084d] cursor-pointer hover:scale-105 transition-transform" onClick={() => handleTabClick("profile")}>
              ⭐ 120 XP
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer active:scale-95 outline-none [-webkit-tap-highlight-color:transparent]">
                Log In
              </Link>
              <Link href="/signup" className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-full cursor-pointer transition-colors shadow-[0_4px_15px_#f973164d] active:scale-95 outline-none [-webkit-tap-highlight-color:transparent]">
                Sign Up
              </Link>
            </div>
          )}

          {mounted && (
            /* 🚀 PRO FEATURE: Animated Dark/Light Mode Toggle */
            <button 
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="relative w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 rounded-full cursor-pointer active:scale-90 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none outline-none [-webkit-tap-highlight-color:transparent] overflow-hidden group transition-all duration-300"
              title="Toggle Theme"
            >
              {/* 🌞 SUN ICON: Dikhega jab mode Dark ho (Light pe jaane ke liye). Ghoomta rahega. */}
              <div 
                className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-in-out transform ${
                  theme === "dark" ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-50"
                }`}
              >
                <svg className="w-5 h-5 text-yellow-400 animate-[spin_8s_linear_infinite]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>

              {/* 🌙 MOON ICON: Dikhega jab mode Light ho (Dark pe jaane ke liye). Pulse karta rahega. */}
              <div 
                className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-in-out transform ${
                  theme === "light" ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"
                }`}
              >
                <svg className="w-5 h-5 text-indigo-500 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </div>
            </button>
          )}
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 pb-[76px] overflow-y-auto relative z-10">
        {renderTabContent()}
      </main>

      {/* --- BOTTOM NAVBAR --- */}
      <nav className="fixed bottom-0 left-0 w-full bg-white/95 dark:bg-[#0b0b0e]/95 backdrop-blur-2xl border-t border-slate-200 dark:border-white/5 z-50 transition-colors duration-300 shadow-[0_-10px_30px_#00000008] dark:shadow-none pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-center h-[60px] px-2">
          
          <button onClick={() => handleTabClick("explore")} className={`cursor-pointer flex flex-col items-center justify-center w-16 transition-all duration-300 outline-none [-webkit-tap-highlight-color:transparent] ${activeTab === "explore" ? "text-orange-500 scale-110 drop-shadow-[0_4px_10px_#f9731666] dark:drop-shadow-[0_4px_10px_#f9731680]" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"}`}>
            <svg className="w-6 h-6 mb-0.5" fill={activeTab === "explore" ? "currentColor" : "none"} stroke="currentColor" strokeWidth={activeTab === "explore" ? "0" : "1.5"} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V9.5z" />
            </svg>
            <span className="text-[9px] font-bold">Home</span>
          </button>

          <button onClick={() => handleTabClick("recipes")} className={`cursor-pointer flex flex-col items-center justify-center w-16 transition-all duration-300 outline-none [-webkit-tap-highlight-color:transparent] ${activeTab === "recipes" ? "text-orange-500 scale-110 drop-shadow-[0_4px_10px_#f9731666] dark:drop-shadow-[0_4px_10px_#f9731680]" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"}`}>
            <svg className="w-6 h-6 mb-0.5" fill={activeTab === "recipes" ? "currentColor" : "none"} stroke="currentColor" strokeWidth={activeTab === "recipes" ? "0" : "1.5"} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a4 4 0 0 0-3.82 2.94A4.004 4.004 0 0 0 4 10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4 0-1.8-1.2-3.34-2.85-3.83A4.004 4.004 0 0 0 12 3zM6 16v3a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3" />
            </svg>
            <span className="text-[9px] font-bold">Recipes</span>
          </button>

          <button onClick={() => handleTabClick("pantry")} className={`cursor-pointer flex flex-col items-center justify-center w-16 transition-all duration-300 outline-none [-webkit-tap-highlight-color:transparent] ${activeTab === "pantry" ? "text-orange-500 scale-110 drop-shadow-[0_4px_10px_#f9731666] dark:drop-shadow-[0_4px_10px_#f9731680]" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"}`}>
            <svg className="w-6 h-6 mb-0.5" fill={activeTab === "pantry" ? "currentColor" : "none"} stroke="currentColor" strokeWidth={activeTab === "pantry" ? "0" : "1.5"} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16v2H4zm2 4h12v11H6z" /></svg>
            <span className="text-[9px] font-bold">Pantry</span>
          </button>

          <button onClick={() => handleTabClick("shop")} className={`cursor-pointer flex flex-col items-center justify-center w-16 transition-all duration-300 outline-none [-webkit-tap-highlight-color:transparent] ${activeTab === "shop" ? "text-orange-500 scale-110 drop-shadow-[0_4px_10px_#f9731666] dark:drop-shadow-[0_4px_10px_#f9731680]" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"}`}>
            <svg className="w-6 h-6 mb-0.5" fill={activeTab === "shop" ? "currentColor" : "none"} stroke="currentColor" strokeWidth={activeTab === "shop" ? "0" : "1.5"} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            <span className="text-[9px] font-bold">Shop</span>
          </button>

          <button onClick={() => handleTabClick("profile")} className={`cursor-pointer flex flex-col items-center justify-center w-16 transition-all duration-300 outline-none [-webkit-tap-highlight-color:transparent] ${activeTab === "profile" ? "text-orange-500 scale-110 drop-shadow-[0_4px_10px_#f9731666] dark:drop-shadow-[0_4px_10px_#f9731680]" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"}`}>
            <svg className="w-6 h-6 mb-0.5" fill={activeTab === "profile" ? "currentColor" : "none"} stroke="currentColor" strokeWidth={activeTab === "profile" ? "0" : "1.5"} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span className="text-[9px] font-bold">Profile</span>
          </button>

        </div>
      </nav>
    </div>
  );
}
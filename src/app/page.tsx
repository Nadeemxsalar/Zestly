"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

// Saare 5 Modules (Tabs) yahan import ho gaye
import PantryTab from "../components/tabs/PantryTab";
import RecipesTab from "../components/tabs/RecipesTab";
import ProfileTab from "../components/tabs/ProfileTab";
import ExploreTab from "../components/tabs/ExploreTab";
import ShopTab from "../components/tabs/ShopTab";

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pantry"); 
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
      }
      setLoading(false);
    };
    checkUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07070a]">
         <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Ab yahan paancho tabs connect ho gaye hain!
  const renderTabContent = () => {
    switch (activeTab) {
      case "pantry": return <PantryTab />;
      case "recipes": return <RecipesTab />;
      case "explore": return <ExploreTab />;
      case "shop": return <ShopTab />;
      case "profile": return <ProfileTab user={user} />;
      default: return <PantryTab />;
    }
  };

  return (
    <div className="min-h-screen bg-[#07070a] text-white font-sans selection:bg-orange-500/30 flex flex-col">
      <div className="fixed top-[-10%] right-[-5%] w-[20rem] h-[20rem] bg-orange-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <header className="sticky top-0 z-50 bg-[#07070a]/80 backdrop-blur-xl border-b border-white/[0.05] px-5 py-4 flex justify-between items-center">
        <div className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500 tracking-tighter">
          Zestly<span className="text-white text-sm ml-1 opacity-50">Pro</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.3)]">
            ⭐ 120 XP
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 py-6 pb-28 overflow-y-auto">
        {renderTabContent()}
      </main>

      <nav className="fixed bottom-0 left-0 w-full bg-[#0b0b0e]/90 backdrop-blur-2xl border-t border-white/[0.05] pb-safe z-50">
        <div className="flex justify-around items-center h-20 px-2">
          
          <button onClick={() => setActiveTab("pantry")} className={`flex flex-col items-center gap-1 w-16 transition-all duration-300 ${activeTab === "pantry" ? "text-orange-500 scale-110" : "text-slate-500"}`}>
            <svg className="w-6 h-6" fill={activeTab === "pantry" ? "currentColor" : "none"} stroke="currentColor" strokeWidth={activeTab === "pantry" ? "0" : "1.5"} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16v2H4zm2 4h12v11H6z" /></svg>
            <span className="text-[10px] font-bold">Pantry</span>
          </button>

          <button onClick={() => setActiveTab("recipes")} className={`flex flex-col items-center gap-1 w-16 transition-all duration-300 ${activeTab === "recipes" ? "text-orange-500 scale-110" : "text-slate-500"}`}>
            <svg className="w-6 h-6" fill={activeTab === "recipes" ? "currentColor" : "none"} stroke="currentColor" strokeWidth={activeTab === "recipes" ? "0" : "1.5"} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3L4 9v12h16V9l-8-6zm0 11.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
            <span className="text-[10px] font-bold">Recipes</span>
          </button>

          <button onClick={() => setActiveTab("explore")} className={`flex flex-col items-center gap-1 w-16 transition-all duration-300 ${activeTab === "explore" ? "text-orange-500 scale-110" : "text-slate-500"}`}>
            <svg className="w-6 h-6" fill={activeTab === "explore" ? "currentColor" : "none"} stroke="currentColor" strokeWidth={activeTab === "explore" ? "0" : "1.5"} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
            <span className="text-[10px] font-bold">Explore</span>
          </button>

          <button onClick={() => setActiveTab("shop")} className={`flex flex-col items-center gap-1 w-16 transition-all duration-300 ${activeTab === "shop" ? "text-orange-500 scale-110" : "text-slate-500"}`}>
            <svg className="w-6 h-6" fill={activeTab === "shop" ? "currentColor" : "none"} stroke="currentColor" strokeWidth={activeTab === "shop" ? "0" : "1.5"} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            <span className="text-[10px] font-bold">Shop</span>
          </button>

          <button onClick={() => setActiveTab("profile")} className={`flex flex-col items-center gap-1 w-16 transition-all duration-300 ${activeTab === "profile" ? "text-orange-500 scale-110" : "text-slate-500"}`}>
            <svg className="w-6 h-6" fill={activeTab === "profile" ? "currentColor" : "none"} stroke="currentColor" strokeWidth={activeTab === "profile" ? "0" : "1.5"} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span className="text-[10px] font-bold">Profile</span>
          </button>

        </div>
      </nav>
    </div>
  );
}
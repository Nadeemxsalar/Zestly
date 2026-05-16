"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { createPortal } from "react-dom";
import OneSignal from 'react-onesignal';

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

  // --- NOTIFICATION STATES ---
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // 🚀 NAYA CODE: Page load hote hi browser ki memory se purana tab uthao
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const savedTab = localStorage.getItem("zestly_active_tab");
      if (savedTab) {
        setActiveTab(savedTab);
      }
    }
  }, []);

  // 🚀 FIXED & SUPER SAFE: One and only one setup function
  useEffect(() => {
    let isMounted = true;

    const setupApp = async () => {
      // 1. Auth check
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && isMounted) {
        setUser(session.user);
        fetchNotifications(session.user.id);
      } else if (isMounted) {
        setUser(null); 
      }
      
      if (isMounted) {
        setLoading(false); // UI load ho jayega, black screen hamesha ke liye khatam
      }

      // 2. Safe OneSignal Setup (Ad-blocker proof)
      try {
        if (typeof window !== "undefined") {
          await OneSignal.init({
            appId: "31135af9-3003-4c69-bc1e-faacbfa8c672",
            allowLocalhostAsSecureOrigin: true,
          });
          
          // @ts-ignore
          OneSignal.Slidedown.promptPush();

          if (session) {
            await OneSignal.login(session.user.id);
          } else {
            await OneSignal.logout();
          }
        }
      } catch (e) {
        console.log("OneSignal blocked by browser (Brave/Ad-Blocker). App will continue normally.", e);
      }
    };

    setupApp();

    return () => { isMounted = false; };
  }, []);

  // 🚀 Real-time Listener for Bell Icon Updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('realtime-notifs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, 
        () => fetchNotifications(user.id)
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchNotifications = async (userId: string) => {
    const { data: notifs } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(30);
    if (!notifs || notifs.length === 0) { setNotifications([]); return; }
    
    const actorIds = [...new Set(notifs.map(n => n.actor_id))];
    const { data: actors } = await supabase.from('profiles').select('id, full_name, username').in('id', actorIds);
    const recipeIds = [...new Set(notifs.filter(n => n.recipe_id).map(n => n.recipe_id))];
    const { data: recipes } = await supabase.from('recipes').select('id, name').in('id', recipeIds);
    
    setNotifications(notifs.map(n => ({
      ...n,
      actorName: actors?.find(a => a.id === n.actor_id)?.full_name || 'Someone',
      recipeName: recipes?.find(r => r.id === n.recipe_id)?.name || 'a recipe'
    })));
  };

  // 🚀 UPGRADED: Ab tab change hone par browser ki memory mein bhi save hoga
  const handleTabClick = (tab: string) => {
    const privateTabs = ["pantry", "shop", "profile"];
    if (!user && privateTabs.includes(tab)) {
      alert("Chef, you need to log in to access this feature! 🔒👨‍🍳");
      router.push("/login");
      return;
    }
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      localStorage.setItem("zestly_active_tab", tab);
    }
  };

  const openNotifications = async () => {
    setIsNotifOpen(true);
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length > 0) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
    }
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
      case "pantry": return <PantryTab user={user} />; // @ts-ignore
      case "recipes": return <RecipesTab user={user} />; // @ts-ignore
      case "explore": return <ExploreTab user={user} />; // @ts-ignore
      case "shop": return <ShopTab />;
      case "profile": return <ProfileTab user={user} />; // @ts-ignore
      default: return <ExploreTab user={user} />; // @ts-ignore
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07070a] text-slate-900 dark:text-white font-sans selection:bg-orange-500/30 flex flex-col cursor-default transition-colors duration-300">
      
      <div className="fixed top-[-10%] right-[-5%] w-80 h-80 bg-orange-600/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

      {/* --- HEADER --- */}
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-[#07070a]/85 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 px-5 py-3 flex justify-between items-center transition-colors duration-300 shadow-sm dark:shadow-none">
        
        <div className="text-2xl font-black bg-clip-text text-transparent bg-linear-to-r from-orange-500 to-red-500 tracking-tighter cursor-pointer" onClick={() => handleTabClick("explore")}>
          Zestly<span className="text-slate-400 dark:text-white text-sm ml-1 opacity-50">Pro</span>
        </div>
        
        <div className="flex items-center gap-3.5">
          {user ? (
            <div className="flex items-center gap-4">
              
              {/* 🔔 Notification Bell */}
              <button onClick={openNotifications} className="relative cursor-pointer text-slate-600 dark:text-slate-300 hover:text-orange-500 transition-colors outline-none [-webkit-tap-highlight-color:transparent]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-[#07070a] rounded-full animate-pulse"></span>
                )}
              </button>

              <div className="bg-linear-to-r from-yellow-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-[0_0_10px_#eab3084d] cursor-pointer hover:scale-105 transition-transform" onClick={() => handleTabClick("profile")}>
                ⭐ 120 XP
              </div>
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
            <button 
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="relative w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 rounded-full cursor-pointer active:scale-90 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none outline-none [-webkit-tap-highlight-color:transparent] overflow-hidden group transition-all duration-300"
              title="Toggle Theme"
            >
              <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-in-out transform ${theme === "dark" ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-50"}`}>
                <svg className="w-5 h-5 text-yellow-400 animate-[spin_8s_linear_infinite]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-in-out transform ${theme === "light" ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"}`}>
                <svg className="w-5 h-5 text-indigo-500 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              </div>
            </button>
          )}
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 pb-[76px] overflow-y-auto relative z-10 px-0 sm:px-8 lg:px-16 xl:px-32">
        {renderTabContent()}
      </main>

      {/* --- BOTTOM NAVBAR --- */}
      <nav className="fixed bottom-0 left-0 w-full bg-white/95 dark:bg-[#0b0b0e]/95 backdrop-blur-2xl border-t border-slate-200 dark:border-white/5 z-40 transition-colors duration-300 shadow-[0_-10px_30px_#00000008] dark:shadow-none pb-[env(safe-area-inset-bottom)]">
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

      {/* 🚀 NOTIFICATION MODAL PANEL */}
      {mounted && isNotifOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex justify-end bg-black/60 dark:bg-black/80 backdrop-blur-sm sm:items-center sm:justify-center transition-all animate-in fade-in">
          <div className="bg-white dark:bg-[#1c1c1e] w-full sm:w-[450px] h-[85vh] sm:h-[600px] mt-auto sm:mt-0 rounded-t-[2.5rem] sm:rounded-[2rem] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-right-8 duration-300 border border-slate-200 dark:border-white/10">
            <div className="shrink-0 flex justify-between items-center px-6 py-5 border-b border-slate-100 dark:border-white/10">
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Notifications</h3>
              <button onClick={() => setIsNotifOpen(false)} className="cursor-pointer text-slate-500 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 w-9 h-9 rounded-full flex items-center justify-center transition-colors outline-none [-webkit-tap-highlight-color:transparent]">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {notifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50 px-6">
                  <span className="text-6xl mb-4">🔔</span>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No notifications yet</h4>
                  <p className="text-sm font-medium text-slate-500">When someone likes your recipe or follows you, it will show up here.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {notifications.map((notif) => (
                    <div key={notif.id} className={`flex items-center gap-4 p-4 rounded-2xl transition-colors ${!notif.is_read ? 'bg-orange-50 dark:bg-orange-500/10' : 'hover:bg-slate-50 dark:hover:bg-white/5'}`}>
                      <div className="w-12 h-12 rounded-full bg-linear-to-tr from-orange-500 to-red-500 shrink-0 flex items-center justify-center text-white text-lg font-bold">
                        {notif.actorName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-800 dark:text-slate-200 leading-snug">
                          <span className="font-extrabold text-slate-900 dark:text-white mr-1">{notif.actorName}</span>
                          {notif.type === 'follow' ? 'started following you.' : `liked your recipe "${notif.recipeName}".`}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                          {new Date(notif.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="shrink-0 pl-2">
                        {notif.type === 'follow' ? <span className="text-2xl">👤</span> : <span className="text-2xl text-red-500">❤️</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

export default function ProfileTab({ user }: { user: any }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  // --- USER DATA STATES ---
  const [profile, setProfile] = useState<any>(null);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // --- UI STATES ---
  const [activeTab, setActiveTab] = useState<"posts" | "saved">("posts");
  const [isMenuOpen, setIsMenuOpen] = useState(false); // NEW: First Level Menu
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // Second Level Full Settings
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: "" });

  // --- EDIT PROFILE STATES ---
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // --- SETTINGS STATES ---
  const [notifications, setNotifications] = useState(true);
  const [mealPlanAlerts, setMealPlanAlerts] = useState(false);
  const [isMetric, setIsMetric] = useState(true); 
  const [theme, setTheme] = useState<"orange" | "green" | "blue">("orange");
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [aiMessage, setAiMessage] = useState(`Hi ${user?.user_metadata?.full_name?.split(" ")[0] || "Chef"}! What are we cooking today?`);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const showToast = (msg: string) => {
    setToast({ isOpen: true, message: msg });
    setTimeout(() => setToast({ isOpen: false, message: "" }), 3000);
  };

  useEffect(() => {
    setMounted(true);
    if (user) fetchProfileData();
  }, [user]);

  const fetchProfileData = async () => {
    setIsLoading(true);
    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (profileData) {
      setProfile(profileData);
      setEditName(profileData.full_name || "");
      setEditUsername(profileData.username || "");
      setEditBio(profileData.bio || "");
    }

    const { data: recipes } = await supabase.from("recipes").select("*").eq("author_id", user.id).order("created_at", { ascending: false });
    if (recipes) {
      setMyPosts(recipes);
      setStats(prev => ({ ...prev, posts: recipes.length }));
    }

    const { count: followersCount } = await supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", user.id);
    const { count: followingCount } = await supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", user.id);
    
    setStats(prev => ({ ...prev, followers: followersCount || 0, following: followingCount || 0 }));
    setIsLoading(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const cleanUsername = editUsername.toLowerCase().trim().replace(/\s+/g, '_');

    const { data: existing } = await supabase.from("profiles").select("id").eq("username", cleanUsername).neq("id", user.id).single();
    if (existing) {
      showToast("Username is already taken! ❌");
      setIsSaving(false);
      return;
    }

    const { error } = await supabase.from("profiles").update({
      full_name: editName,
      username: cleanUsername,
      bio: editBio
    }).eq("id", user.id);

    if (!error) {
      setProfile({ ...profile, full_name: editName, username: cleanUsername, bio: editBio });
      showToast("Profile Updated! ✅");
      setIsEditOpen(false);
    } else {
      showToast("Failed to update profile.");
    }
    setIsSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput("");
    setAiMessage(userMsg);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setAiMessage(`I've noted "${userMsg}". Check the Global Feed for some magical ideas! ✨`);
    }, 1500);
  };

  const handleExportData = () => {
    setIsExporting(true);
    setExportSuccess(false);
    setTimeout(() => {
      setIsExporting(false);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    }, 2000);
  };

  const themeColors = {
    orange: { from: "from-orange-400", to: "to-red-500", text: "text-orange-500", bg: "bg-orange-500", glow: "shadow-[0_0_40px_#f9731666]", border: "border-orange-500" },
    green: { from: "from-green-400", to: "to-emerald-500", text: "text-green-500", bg: "bg-green-500", glow: "shadow-[0_0_40px_#22c55e66]", border: "border-green-500" },
    blue: { from: "from-blue-400", to: "to-indigo-500", text: "text-blue-500", bg: "bg-blue-500", glow: "shadow-[0_0_40px_#3b82f666]", border: "border-blue-500" }
  };
  const activeTheme = themeColors[theme];
  const initial = profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "C";

  if (isLoading) return <div className="flex items-center justify-center h-screen"><div className={`w-12 h-12 border-4 ${activeTheme.border} border-t-transparent rounded-full animate-spin`}></div></div>;

  return (
    <div className="animate-in fade-in duration-700 pb-24 w-full max-w-2xl mx-auto bg-slate-50 dark:bg-[#07070a] min-h-screen relative overflow-x-hidden selection:bg-orange-500/20">
      
      {/* Background Ambient Glow */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-[400px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] ${activeTheme.from}/10 via-transparent to-transparent pointer-events-none -z-10`}></div>

      {/* --- 1. PREMIUM HEADER --- */}
      <div className="flex justify-between items-center px-6 py-4 sticky top-0 bg-slate-50/80 dark:bg-[#07070a]/80 backdrop-blur-xl z-40">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          {profile?.username || "chef_zestly"} 
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
        </h2>
        {/* Modern Staggered Hamburger Icon */}
        <button onClick={() => setIsMenuOpen(true)} className="p-2 -mr-2 cursor-pointer text-slate-900 dark:text-white outline-none active:scale-90 transition-transform [-webkit-tap-highlight-color:transparent] group flex flex-col gap-1.5 items-end">
          <div className="w-7 h-[3px] bg-current rounded-full transition-all"></div>
          <div className="w-5 h-[3px] bg-current rounded-full group-hover:w-7 transition-all"></div>
          <div className="w-7 h-[3px] bg-current rounded-full transition-all"></div>
        </button>
      </div>

      {/* --- 2. MODERN PROFILE INFO --- */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative">
          
          {/* Glowing Avatar */}
          <div className="relative shrink-0 group">
            <div className={`absolute inset-0 bg-linear-to-tr ${activeTheme.from} ${activeTheme.to} rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500`}></div>
            <div className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-linear-to-tr ${activeTheme.from} ${activeTheme.to} p-[3px] shadow-2xl`}>
              <div className="w-full h-full bg-white dark:bg-[#121216] rounded-full flex items-center justify-center text-4xl sm:text-5xl font-black text-slate-900 dark:text-white border-4 border-white dark:border-[#07070a] uppercase transition-colors">
                {initial}
              </div>
            </div>
            <div className="absolute bottom-1 right-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border-2 border-white dark:border-[#07070a] shadow-lg">PRO</div>
          </div>
          
          {/* Bio & Details */}
          <div className="flex-1 w-full text-center sm:text-left mt-2 sm:mt-4">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{profile?.full_name || "Head Chef"}</h1>
            <p className={`${activeTheme.text} text-xs font-bold mb-3 uppercase tracking-wider`}>Culinary Artist</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium whitespace-pre-wrap leading-relaxed max-w-md mx-auto sm:mx-0">
              {profile?.bio || "Passionate Chef at Zestly 🍳\nTurning raw ingredients into pure magic!"}
            </p>
          </div>
        </div>

        {/* Floating Glass Stats Card */}
        <div className="flex justify-between items-center bg-white/60 dark:bg-white/[0.03] backdrop-blur-md border border-slate-200/50 dark:border-white/10 rounded-[1.5rem] py-4 px-6 mt-6 shadow-sm dark:shadow-none">
          <div className="flex flex-col items-center flex-1">
            <span className="text-xl font-black text-slate-900 dark:text-white">{stats.posts}</span>
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest mt-0.5">Posts</span>
          </div>
          <div className="w-px h-8 bg-slate-200 dark:bg-white/10"></div>
          <div className="flex flex-col items-center flex-1">
            <span className="text-xl font-black text-slate-900 dark:text-white">{stats.followers}</span>
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest mt-0.5">Followers</span>
          </div>
          <div className="w-px h-8 bg-slate-200 dark:bg-white/10"></div>
          <div className="flex flex-col items-center flex-1">
            <span className="text-xl font-black text-slate-900 dark:text-white">{stats.following}</span>
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest mt-0.5">Following</span>
          </div>
        </div>

        {/* Premium Action Buttons */}
        <div className="flex gap-3 mt-5">
          <button onClick={() => setIsEditOpen(true)} className={`flex-1 bg-linear-to-tr ${activeTheme.from} ${activeTheme.to} text-white font-extrabold py-3.5 rounded-2xl text-sm transition-all active:scale-95 outline-none [-webkit-tap-highlight-color:transparent] shadow-md hover:shadow-lg`}>
            Edit Profile
          </button>
          <button onClick={() => showToast("Profile Link Copied! 🔗")} className="flex-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-900 dark:text-white font-extrabold py-3.5 rounded-2xl text-sm transition-all active:scale-95 outline-none [-webkit-tap-highlight-color:transparent] shadow-sm dark:shadow-none">
            Share Profile
          </button>
        </div>
      </div>

      {/* --- 3. PILL-STYLE SEGMENTED TABS --- */}
      <div className="px-6 mt-4 mb-2">
        <div className="flex bg-slate-200/50 dark:bg-[#1c1c1e] p-1.5 rounded-2xl gap-1">
          <button onClick={() => setActiveTab("posts")} className={`flex-1 py-2.5 flex justify-center items-center gap-2 rounded-xl transition-all duration-300 outline-none [-webkit-tap-highlight-color:transparent] font-bold text-sm ${activeTab === "posts" ? "bg-white dark:bg-[#2c2c2e] text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zm0 11h7v7h-7v-7zM3 14h7v7H3v-7z"/></svg> Recipes
          </button>
          <button onClick={() => setActiveTab("saved")} className={`flex-1 py-2.5 flex justify-center items-center gap-2 rounded-xl transition-all duration-300 outline-none [-webkit-tap-highlight-color:transparent] font-bold text-sm ${activeTab === "saved" ? "bg-white dark:bg-[#2c2c2e] text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg> Saved
          </button>
        </div>
      </div>

      {/* --- 4. ATTRACTIVE POSTS GRID --- */}
      {activeTab === "posts" && (
        <div className="px-5 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {myPosts.length === 0 ? (
              <div className="col-span-full text-center py-24 bg-white dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 rounded-[2rem] mt-2">
                <div className={`w-16 h-16 mx-auto rounded-full bg-linear-to-tr ${activeTheme.from} ${activeTheme.to} opacity-20 mb-4`}></div>
                <p className="font-bold text-slate-900 dark:text-white text-lg">No Masterpieces Yet</p>
                <p className="text-slate-500 text-sm mt-1">Your created recipes will appear here.</p>
              </div>
            ) : (
              myPosts.map(post => (
                <div key={post.id} className="aspect-square relative cursor-pointer group bg-slate-100 dark:bg-[#121216] rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-lg transition-all outline-none [-webkit-tap-highlight-color:transparent]">
                  {post.image_url ? (
                    <img src={post.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className={`w-full h-full bg-linear-to-br ${post.gradient || activeTheme.from} flex items-center justify-center group-hover:scale-110 transition-transform duration-700`}>
                      <span className="text-4xl sm:text-6xl drop-shadow-lg">{post.emoji || '🍲'}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 text-white font-black transition-all duration-300">
                    <span className="flex items-center gap-1.5 text-lg"><svg className="w-6 h-6 fill-white" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg> {post.likes_count || 0}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "saved" && (
        <div className="px-5 sm:px-6">
          <div className="text-center py-24 bg-white dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 rounded-[2rem] mt-2">
            <span className="text-4xl block mb-4 opacity-50">🔒</span>
            <p className="font-bold text-slate-900 dark:text-white text-lg">Private Vault</p>
            <p className="text-slate-500 text-sm mt-1">Only you can see what you've saved.</p>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* 🚀 LEVEL 1: SLEEK SIDE MENU (DRAWER) */}
      {/* ========================================= */}
      {mounted && isMenuOpen && createPortal(
        <div className="fixed inset-0 z-[99998] flex justify-end bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-all" onClick={() => setIsMenuOpen(false)}>
          {/* Prevent clicks inside the menu from closing it */}
          <div className="w-[80%] sm:w-[380px] h-full bg-white dark:bg-[#121216] shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col border-l border-slate-200 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
            
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 dark:border-white/5">
              <h3 className="font-black text-slate-900 dark:text-white text-xl">Menu</h3>
              <button onClick={() => setIsMenuOpen(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 rounded-full text-slate-900 dark:text-white transition-colors outline-none [-webkit-tap-highlight-color:transparent]">✕</button>
            </div>

            <div className="flex-1 flex flex-col py-3 overflow-y-auto">
              
              {/* Settings Trigger */}
              <button onClick={() => { setIsMenuOpen(false); setIsSettingsOpen(true); }} className="flex items-center gap-5 px-6 py-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left outline-none [-webkit-tap-highlight-color:transparent] group">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#1c1c1e] flex items-center justify-center text-xl shadow-sm group-hover:scale-105 transition-transform">⚙️</div>
                <div>
                  <span className="block font-bold text-slate-900 dark:text-white text-base">Settings & Privacy</span>
                  <span className="block text-xs text-slate-500 font-medium mt-0.5">Theme, units, alerts & AI</span>
                </div>
              </button>
              
              <button onClick={() => { setIsMenuOpen(false); showToast("QR Code generated! 🔲"); }} className="flex items-center gap-5 px-6 py-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left outline-none [-webkit-tap-highlight-color:transparent] group">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#1c1c1e] flex items-center justify-center text-xl shadow-sm group-hover:scale-105 transition-transform">🔲</div>
                <div>
                  <span className="block font-bold text-slate-900 dark:text-white text-base">My QR Code</span>
                  <span className="block text-xs text-slate-500 font-medium mt-0.5">Share your profile instantly</span>
                </div>
              </button>

              <button onClick={() => { setIsMenuOpen(false); handleExportData(); }} className="flex items-center gap-5 px-6 py-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left outline-none [-webkit-tap-highlight-color:transparent] group">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#1c1c1e] flex items-center justify-center text-xl shadow-sm group-hover:scale-105 transition-transform">☁️</div>
                <div>
                  <span className="block font-bold text-slate-900 dark:text-white text-base">Cloud Backup</span>
                  <span className="block text-xs text-slate-500 font-medium mt-0.5">Export all your recipes</span>
                </div>
              </button>

            </div>
            
            <div className="p-6 border-t border-slate-100 dark:border-white/5">
              <button onClick={handleLogout} className="w-full font-black text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-500/10 py-4 rounded-2xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-all outline-none [-webkit-tap-highlight-color:transparent] active:scale-95">
                Log Out
              </button>
            </div>
            
          </div>
        </div>, document.body
      )}

      {/* ========================================= */}
      {/* 🚀 LEVEL 2: FULL-SCREEN SETTINGS MODAL */}
      {/* ========================================= */}
      {mounted && isSettingsOpen && createPortal(
        <div className="fixed inset-0 z-[99999] bg-slate-50 dark:bg-[#07070a] flex flex-col animate-in slide-in-from-right duration-300">
          
          <div className="shrink-0 flex items-center px-4 py-4 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#07070a]/80 backdrop-blur-xl sticky top-0 z-10 gap-4">
            <button onClick={() => { setIsSettingsOpen(false); setIsMenuOpen(true); }} className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-slate-900 dark:text-white outline-none [-webkit-tap-highlight-color:transparent] transition-colors cursor-pointer">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            </button>
            <h3 className="font-black text-slate-900 dark:text-white text-2xl tracking-tight">Settings & Privacy</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            
            {/* App Preferences */}
            <div className="bg-white dark:bg-[#121216] rounded-[2rem] p-6 shadow-[0_8px_30px_#0000000a] dark:shadow-none border border-slate-100 dark:border-white/5">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Visual & App Preferences</h4>
              
              <div className="flex justify-between items-center mb-6">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-base block mb-1">Theme Color</span>
                  <span className="text-xs text-slate-500 font-medium">Personalize your UI</span>
                </div>
                <div className="flex gap-2.5 bg-slate-50 dark:bg-[#1c1c1e] p-1.5 rounded-full border border-slate-100 dark:border-white/5">
                  <button onClick={() => setTheme("orange")} className={`w-8 h-8 rounded-full bg-orange-500 border-2 ${theme === 'orange' ? 'border-slate-900 dark:border-white shadow-md scale-110' : 'border-transparent'} transition-all`}></button>
                  <button onClick={() => setTheme("green")} className={`w-8 h-8 rounded-full bg-green-500 border-2 ${theme === 'green' ? 'border-slate-900 dark:border-white shadow-md scale-110' : 'border-transparent'} transition-all`}></button>
                  <button onClick={() => setTheme("blue")} className={`w-8 h-8 rounded-full bg-blue-500 border-2 ${theme === 'blue' ? 'border-slate-900 dark:border-white shadow-md scale-110' : 'border-transparent'} transition-all`}></button>
                </div>
              </div>

              <div className="h-px w-full bg-slate-100 dark:bg-white/5 mb-6"></div>

              <div className="flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-base block mb-1">Measurement Units</span>
                  <span className="text-xs text-slate-500 font-medium">Switch between Metric & Imperial</span>
                </div>
                <button onClick={() => setIsMetric(!isMetric)} className="bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-900 dark:text-white transition-colors cursor-pointer active:scale-95 outline-none [-webkit-tap-highlight-color:transparent]">
                  {isMetric ? "Metric (Kg/L)" : "Imperial (Lbs/Oz)"}
                </button>
              </div>
            </div>

            {/* Alerts & Notifications */}
            <div className="bg-white dark:bg-[#121216] rounded-[2rem] p-6 shadow-[0_8px_30px_#0000000a] dark:shadow-none border border-slate-100 dark:border-white/5">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Alerts & Notifications</h4>
              
              <div className="flex justify-between items-center mb-6">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-base block mb-1">Push Notifications</span>
                  <span className="text-xs text-slate-500 font-medium">Get likes, follows & comments alerts</span>
                </div>
                <div onClick={() => setNotifications(!notifications)} className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors duration-300 ${notifications ? activeTheme.bg : 'bg-slate-200 dark:bg-white/10'}`}>
                  <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${notifications ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
              </div>

              <div className="h-px w-full bg-slate-100 dark:bg-white/5 mb-6"></div>

              <div className="flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-base block mb-1">Meal Plan Reminders</span>
                  <span className="text-xs text-slate-500 font-medium">Daily cooking schedule prompts</span>
                </div>
                <div onClick={() => setMealPlanAlerts(!mealPlanAlerts)} className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors duration-300 ${mealPlanAlerts ? activeTheme.bg : 'bg-slate-200 dark:bg-white/10'}`}>
                  <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${mealPlanAlerts ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
              </div>
            </div>

            {/* AI Chef Assistant */}
            <div className="bg-white dark:bg-[#121216] rounded-[2rem] p-6 shadow-[0_8px_30px_#0000000a] dark:shadow-none border border-slate-100 dark:border-white/5 relative overflow-hidden group">
              <div className={`absolute top-0 right-0 w-32 h-32 bg-linear-to-br ${activeTheme.from} ${activeTheme.to} opacity-10 rounded-bl-[100px] pointer-events-none transition-all group-hover:scale-110`}></div>
              
              <div className="flex gap-3 items-center mb-5 relative z-10">
                <div className={`w-10 h-10 rounded-[1rem] bg-linear-to-tr ${activeTheme.from} ${activeTheme.to} flex items-center justify-center text-xl shadow-lg`}>🤖</div>
                <h4 className="font-black text-slate-900 dark:text-white text-lg">AI Chef Assistant</h4>
              </div>
              
              <div className="bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 p-4 rounded-2xl mb-4 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-inner relative z-10">
                {isTyping ? "Thinking of recipes..." : aiMessage}
              </div>
              
              <div className="flex gap-2.5 relative z-10">
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendChat()} placeholder="e.g., Substitute for eggs?" className="flex-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-3.5 rounded-2xl text-sm outline-none text-slate-900 dark:text-white focus:border-orange-500 transition-colors" disabled={isTyping} />
                <button onClick={handleSendChat} disabled={isTyping || !chatInput.trim()} className={`bg-linear-to-tr ${activeTheme.from} ${activeTheme.to} text-white px-5 rounded-2xl font-black transition-transform active:scale-95 disabled:opacity-50 shadow-md flex items-center justify-center outline-none [-webkit-tap-highlight-color:transparent]`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" /></svg>
                </button>
              </div>
            </div>
            
          </div>
        </div>, document.body
      )}

      {/* ========================================= */}
      {/* 🚀 MODAL: SLEEK EDIT PROFILE */}
      {/* ========================================= */}
      {mounted && isEditOpen && createPortal(
        <div className="fixed inset-0 z-[99999] bg-black/60 dark:bg-black/80 backdrop-blur-sm flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#121216] w-full sm:w-[500px] rounded-t-[2.5rem] sm:rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-4 border border-slate-100 dark:border-white/10">
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 dark:border-white/5">
              <button onClick={() => setIsEditOpen(false)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white font-extrabold outline-none [-webkit-tap-highlight-color:transparent] transition-colors">Cancel</button>
              <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight">Edit Profile</h3>
              <button onClick={handleSaveProfile} disabled={isSaving} className={`${activeTheme.text} font-black outline-none [-webkit-tap-highlight-color:transparent] disabled:opacity-50 transition-colors`}>Done</button>
            </div>
            
            <div className="p-6 sm:p-8 flex flex-col items-center">
               <div className="relative group cursor-pointer mb-6">
                 <div className={`absolute inset-0 bg-linear-to-tr ${activeTheme.from} ${activeTheme.to} rounded-full blur-md opacity-40 group-hover:opacity-70 transition-opacity`}></div>
                 <div className={`relative w-24 h-24 rounded-full bg-linear-to-tr ${activeTheme.from} ${activeTheme.to} p-1`}>
                   <div className="w-full h-full bg-white dark:bg-black rounded-full flex items-center justify-center text-4xl font-black text-slate-900 dark:text-white uppercase">
                     {initial}
                   </div>
                 </div>
               </div>

               <form className="w-full space-y-5" onSubmit={handleSaveProfile}>
                 <div className="flex flex-col gap-2">
                   <label className="text-xs text-slate-500 font-extrabold uppercase tracking-widest pl-1">Name</label>
                   <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 outline-none text-slate-900 dark:text-white font-bold focus:border-slate-400 dark:focus:border-white/30 transition-colors" placeholder="Your full name" />
                 </div>
                 <div className="flex flex-col gap-2">
                   <label className="text-xs text-slate-500 font-extrabold uppercase tracking-widest pl-1">Username</label>
                   <div className="relative">
                     <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">@</span>
                     <input type="text" value={editUsername} onChange={e => setEditUsername(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-10 pr-5 py-4 outline-none text-slate-900 dark:text-white font-bold lowercase focus:border-slate-400 dark:focus:border-white/30 transition-colors" placeholder="username" />
                   </div>
                 </div>
                 <div className="flex flex-col gap-2 pb-6">
                   <label className="text-xs text-slate-500 font-extrabold uppercase tracking-widest pl-1">Bio</label>
                   <textarea rows={3} value={editBio} onChange={e => setEditBio(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 outline-none text-slate-900 dark:text-white font-medium resize-none focus:border-slate-400 dark:focus:border-white/30 transition-colors" placeholder="Write something about yourself..." />
                 </div>
               </form>
            </div>
          </div>
        </div>, document.body
      )}

      {/* Toast Notification */}
      {mounted && toast.isOpen && createPortal(
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[99999] pointer-events-none">
          <div className="bg-slate-900 dark:bg-[#1c1c1e] text-white px-6 py-3.5 rounded-full shadow-lg text-sm font-bold border border-slate-700 dark:border-white/10">{toast.message}</div>
        </div>, document.body
      )}

    </div>
  );
}
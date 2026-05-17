"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

// ─── Types ────────────────────────────────────────────────
interface MetricCard {
  label: string;
  value: string | number;
  sub: string;
  color: string;
  icon: string;
  trend?: "up" | "down" | "neutral";
}

interface UserRow {
  id: string;
  full_name: string;
  username: string;
  email: string;
  bio: string;
  avatar_url: string | null;
  recipes_count: number;
  followers_count: number; // Real + Bonus + Engine
  real_followers: number;  
  bonus_followers: number; 
  engine_followers: number; 
  is_verified: boolean;
  verification_status: string;
  following_count: number;
  joined: string;
  is_banned: boolean;
}

interface RecipeRow {
  id: string;
  name: string;
  author_name: string;
  type: string;
  likes_count: number;
  comments_count: number;
  calories: number;
  difficulty: string;
  created_at: string;
  image_url?: string;
  emoji: string;
}

interface ActivityLog {
  id: string;
  action: string;
  time: string;
  type: "success" | "warning" | "danger" | "info";
  icon: string;
}

interface NotifRow {
  id: string;
  type: string;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────
const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
};

const formatNum = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

// ─── Main Component ────────────────────────────────────────
export default function ZestlyAdminPage() {
  const router = useRouter();

  // Auth
  const [adminUser, setAdminUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Data
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalRecipes: 0,
    totalFollows: 0,
    totalNotifs: 0,
    totalPantryItems: 0,
    newUsersToday: 0,
    newRecipesToday: 0,
    vegCount: 0,
    nonVegCount: 0,
    storagePercent: 0,
  });
  const [users, setUsers] = useState<UserRow[]>([]);
  const [recipes, setRecipes] = useState<RecipeRow[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [graphData, setGraphData] = useState<number[]>([]);
  const [topRecipes, setTopRecipes] = useState<RecipeRow[]>([]);

  // UI
  const [activeSection, setActiveSection] = useState<"overview" | "users" | "recipes" | "verification" | "algorithm" | "logs">("overview");
  const [userSearch, setUserSearch] = useState("");
  const [recipeSearch, setRecipeSearch] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowSignups, setAllowSignups] = useState(true);
  const [aiBot, setAiBot] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bannedIds, setBannedIds] = useState<Set<string>>(new Set());

  // 🚀 God Mode / Algorithm States
  const [fakeMode, setFakeMode] = useState(true);
  const [botPings, setBotPings] = useState(0); 
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [editFormData, setEditFormData] = useState({ full_name: "", username: "", bio: "" });

  const [toast, setToast] = useState({ isOpen: false, message: "", type: "success" });
  const showToast = (msg: string, type: "success" | "danger" = "success") => {
    setToast({ isOpen: true, message: msg, type });
    setTimeout(() => setToast({ isOpen: false, message: "", type: "success" }), 3000);
  };

  // ── Fetch All Data ─────────────────────────────────────
  const fetchDashboardData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      const [
        { count: totalUsers },
        { count: totalRecipes },
        { count: totalFollows },
        { count: totalNotifs },
        { count: totalPantryItems },
        { count: newUsersToday },
        { count: newRecipesToday },
        { data: profilesData },
        { data: recipesData },
        { data: notifsData },
        { count: vegCount },
        { data: settingsData }, 
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("recipes").select("*", { count: "exact", head: true }),
        supabase.from("follows").select("*", { count: "exact", head: true }),
        supabase.from("notifications").select("*", { count: "exact", head: true }),
        supabase.from("pantry").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
        supabase.from("recipes").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
        supabase.from("profiles").select("id, full_name, username, bio, created_at, bonus_followers, is_verified, verification_status, avatar_url").order("created_at", { ascending: false }).limit(500),
        supabase.from("recipes").select("*").order("created_at", { ascending: false }).limit(200), 
        supabase.from("notifications").select("id, type, created_at").order("created_at", { ascending: false }).limit(30),
        supabase.from("recipes").select("*", { count: "exact", head: true }).eq("type", "Veg"),
        supabase.from("app_settings").select("fake_engagement_enabled, bot_ping_count").eq("id", 1).single(),
      ]);

      if (settingsData) {
          setFakeMode(settingsData.fake_engagement_enabled);
          setBotPings(settingsData.bot_ping_count || 0);
      }
      const isFakeOn = settingsData ? settingsData.fake_engagement_enabled : true;

      // Build user rows
      const formattedUsers: UserRow[] = await Promise.all(
        (profilesData || []).map(async (p: any) => {
          const [{ count: rc }, { count: fc }, { count: fgc }] = await Promise.all([
            supabase.from("recipes").select("*", { count: "exact", head: true }).eq("author_id", p.id),
            supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", p.id),
            supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", p.id),
          ]);
          
          const realFollowers = fc || 0;
          const bonusFollowers = p.bonus_followers || 0;

          // 🚀 UNIQUE FAKE BASE ALGORITHM
          let baseFake = 0;
          if (isFakeOn && p.id) {
              const char1 = p.id.charCodeAt(0) || 10;
              const char2 = p.id.charCodeAt(1) || 10;
              baseFake = (char1 * 25) + (char2 * 10);
          }

          return {
            id: p.id,
            full_name: p.full_name || "Unknown Chef",
            username: p.username || "unknown",
            email: "",
            bio: p.bio || "",
            avatar_url: p.avatar_url,
            recipes_count: rc || 0,
            real_followers: realFollowers,
            bonus_followers: bonusFollowers,
            engine_followers: baseFake,
            followers_count: realFollowers + bonusFollowers + baseFake,
            is_verified: p.is_verified || false,
            verification_status: p.verification_status || 'none',
            following_count: fgc || 0,
            joined: p.created_at,
            is_banned: false,
          };
        })
      );

      const formattedRecipes: RecipeRow[] = (recipesData || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        author_name: r.author_name || "Chef",
        type: r.type || "Veg",
        likes_count: r.likes_count || 0,
        comments_count: r.comments_data ? r.comments_data.length : 0,
        calories: r.calories || 0,
        difficulty: r.difficulty || "Medium",
        created_at: r.created_at,
        image_url: r.image_url,
        emoji: r.emoji || "🍲",
      }));

      // 🚀 ACTIVITY LOGS FIX: Combine Notifications + New Users + New Recipes
      const combinedLogs: any[] = [];
      
      // 1. Notifications (Likes, Follows)
      (notifsData || []).forEach((n: NotifRow) => {
          combinedLogs.push({ id: `notif_${n.id}`, action: n.type === "like" ? "Someone liked a recipe ❤️" : "A new chef followed someone 👤", timeStr: n.created_at, type: n.type === "like" ? "success" : "info", icon: n.type === "like" ? "❤️" : "👤" });
      });

      // 2. New Profiles
      (profilesData || []).slice(0, 10).forEach((u: any) => {
          combinedLogs.push({ id: `user_${u.id}`, action: `Chef ${u.full_name || 'Someone'} joined Zestly 🎉`, timeStr: u.created_at, type: "success", icon: "👋" });
      });

      // 3. New Recipes
      (recipesData || []).slice(0, 10).forEach((r: any) => {
          combinedLogs.push({ id: `recipe_${r.id}`, action: `New recipe '${r.name}' published 🍲`, timeStr: r.created_at, type: "info", icon: "🍲" });
      });

      // Sort logs by time and format
      combinedLogs.sort((a, b) => new Date(b.timeStr).getTime() - new Date(a.timeStr).getTime());
      const activityLogs: ActivityLog[] = combinedLogs.map(log => ({
          id: log.id, action: log.action, time: timeAgo(log.timeStr), type: log.type, icon: log.icon
      })).slice(0, 50);

      // Graph: last 7 days recipe counts
      const graphPoints: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i).toISOString();
        const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1).toISOString();
        const { count } = await supabase.from("recipes").select("*", { count: "exact", head: true }).gte("created_at", dayStart).lt("created_at", dayEnd);
        graphPoints.push(count || 0);
      }

      const top5 = [...formattedRecipes].sort((a, b) => b.likes_count - a.likes_count).slice(0, 5);

      setUsers(formattedUsers);
      setRecipes(formattedRecipes);
      setLogs(activityLogs);
      setGraphData(graphPoints);
      setTopRecipes(top5);
      setMetrics({
        totalUsers: totalUsers || 0,
        totalRecipes: totalRecipes || 0,
        totalFollows: totalFollows || 0,
        totalNotifs: totalNotifs || 0,
        totalPantryItems: totalPantryItems || 0,
        newUsersToday: newUsersToday || 0,
        newRecipesToday: newRecipesToday || 0,
        vegCount: vegCount || 0,
        nonVegCount: (totalRecipes || 0) - (vegCount || 0),
        storagePercent: Math.min(100, Math.round(((totalRecipes || 0) * 0.15) % 100)),
      });
    } catch (err) {
      console.error("Admin fetch error:", err);
    }
    setIsRefreshing(false);
  }, []);

  // ── 🚀 STRICT SECURITY: Auth & Email Check ────────────────────────────
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const userEmail = session.user.email?.toLowerCase();
        // 🔒 ALLOWED ADMIN EMAILS
        const allowedAdmins = ["nadeemxsalar@gmail.com", "realheronadeem@gmail.com"];

        if (userEmail && allowedAdmins.includes(userEmail)) {
          setAdminUser(session.user);
          await fetchDashboardData();
        } else {
          alert("Access Denied: You are not authorized to view the Admin Panel! 🛑");
          router.push("/");
        }
      } else {
        router.push("/login");
      }
      setIsLoading(false);
    };
    init();
  }, [router, fetchDashboardData]);

  // ── Actions ────────────────────────────────────────────
  const toggleBan = (id: string) => {
    setBannedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setLogs((prev) => [
      {
        id: Date.now().toString(),
        action: `Admin ${bannedIds.has(id) ? "unbanned" : "banned"} a user 🛑`,
        time: "just now",
        type: "warning",
        icon: "🛑",
      },
      ...prev,
    ]);
    showToast(`User status updated!`);
  };

  const deleteRecipe = async (id: string) => {
    if (!confirm("Delete this recipe permanently?")) return;
    await supabase.from("recipes").delete().eq("id", id);
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    setLogs((prev) => [
      { id: Date.now().toString(), action: "Admin deleted a recipe 🗑️", time: "just now", type: "danger", icon: "🗑️" },
      ...prev,
    ]);
    showToast("Recipe deleted successfully!", "danger");
  };

  // ── 🚀 ALGORITHM & GOD MODE CONTROLS ────────────────────────────────
  const toggleFakeMode = async () => {
      const newMode = !fakeMode;
      setFakeMode(newMode);
      await supabase.from("app_settings").update({ fake_engagement_enabled: newMode }).eq("id", 1);
      
      setUsers(users.map(u => {
          let baseFake = 0;
          if (newMode) baseFake = (u.id.charCodeAt(0) * 25) + (u.id.charCodeAt(1) * 10);
          
          return { 
              ...u, 
              engine_followers: baseFake,
              followers_count: u.real_followers + u.bonus_followers + baseFake 
          };
      }));
      showToast(newMode ? "🚀 Growth Engine ON! Dynamic followers active." : "🛑 Engine OFF! Showing Real + Admin Bonus only.");
  };

  const handleBonusFollowersChange = async (userId: string, newBonusStr: string) => {
      const newBonus = parseInt(newBonusStr) || 0;
      const user = users.find(u => u.id === userId);
      if (!user) return;
      
      let baseFake = 0;
      if (fakeMode) baseFake = (user.id.charCodeAt(0) * 25) + (user.id.charCodeAt(1) * 10);

      setUsers(users.map(u => u.id === userId ? {
          ...u, 
          bonus_followers: newBonus,
          followers_count: u.real_followers + newBonus + baseFake
      } : u));

      await supabase.from("profiles").update({ bonus_followers: newBonus }).eq("id", userId);
  };

  const toggleVerify = async (userId: string, currentVerified: boolean) => {
      const newStatus = !currentVerified;
      const dbStatusStr = newStatus ? 'approved' : 'none';

      setUsers(users.map(u => u.id === userId ? { ...u, is_verified: newStatus, verification_status: dbStatusStr } : u));
      await supabase.from("profiles").update({ is_verified: newStatus, verification_status: dbStatusStr }).eq("id", userId);
      showToast(newStatus ? "Gold Badge Granted! 🏆" : "Badge Removed! ❌");
  };

  const rejectVerify = async (userId: string) => {
      setUsers(users.map(u => u.id === userId ? { ...u, is_verified: false, verification_status: 'rejected' } : u));
      await supabase.from("profiles").update({ is_verified: false, verification_status: 'rejected' }).eq("id", userId);
      showToast("Verification Request Rejected! ❌", "danger");
  };

  const removeAvatar = async (userId: string) => {
      if(!confirm("Are you sure you want to delete this user's Profile Picture?")) return;
      setUsers(users.map(u => u.id === userId ? { ...u, avatar_url: null } : u));
      await supabase.from("profiles").update({ avatar_url: null }).eq("id", userId);
      showToast("Profile Picture removed! 🗑️", "danger");
  };

  const handleEditUserClick = (u: UserRow) => {
      setEditingUser(u);
      setEditFormData({ full_name: u.full_name, username: u.username, bio: u.bio });
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingUser) return;
      
      await supabase.from("profiles").update({ 
          full_name: editFormData.full_name, 
          username: editFormData.username, 
          bio: editFormData.bio 
      }).eq("id", editingUser.id);
      
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...editFormData } : u));
      setEditingUser(null);
      showToast("User details successfully updated! ✏️");
  };

  const fullyDeleteUser = async (userId: string) => {
      if(!confirm("⚠️ DANGER: Delete this user completely from the database? This cannot be undone!")) return;
      
      await supabase.from("profiles").delete().eq("id", userId);
      setUsers(users.filter(u => u.id !== userId));
      showToast("User permanently deleted from database 🗑️", "danger");
  };

  // ── Filtered Lists & ANTI-HANG LOGIC ─────────────────────────────────────
  const filteredUsers = users.filter((u) => u.full_name.toLowerCase().includes(userSearch.toLowerCase()) || u.username.toLowerCase().includes(userSearch.toLowerCase()));
  const displayUsers = filteredUsers.slice(0, 50);

  const pendingRequests = users.filter(u => u.verification_status === 'pending');

  const filteredRecipes = recipes.filter((r) => r.name.toLowerCase().includes(recipeSearch.toLowerCase()));
  const displayRecipes = filteredRecipes.slice(0, 50);

  const graphMax = Math.max(...graphData, 1);
  const dayLabels = ["6d", "5d", "4d", "3d", "2d", "1d", "Today"];

  // ── Loading ────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#07070a] gap-4">
        <div className="w-14 h-14 border-4 border-orange-500 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(249,115,22,0.5)]"></div>
        <p className="text-orange-400 font-bold animate-pulse tracking-widest text-sm uppercase">Verifying Admin...</p>
      </div>
    );
  }

  if (!adminUser) return null;

  const initial = adminUser?.user_metadata?.full_name?.charAt(0).toUpperCase() || adminUser?.email?.charAt(0).toUpperCase() || "A";

  // ── NAV ITEMS ──────────────────────────────────────────
  const navItems = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "users", label: "Users", icon: "👥" },
    { id: "recipes", label: "Recipes", icon: "🍲" },
    { id: "verification", label: "Requests", icon: "🛡️" }, // 🚀 NEW TAB FOR REQUESTS
    { id: "algorithm", label: "God Mode", icon: "⚡" }, 
    { id: "logs", label: "Activity", icon: "📋" },
  ] as const;

  return (
    <div className="min-h-screen bg-[#07070a] text-white font-sans selection:bg-orange-500/30 relative overflow-x-hidden">
      <div className="fixed top-0 left-0 w-full h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-900/20 via-transparent to-transparent pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col lg:flex-row min-h-screen">

        <aside className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 bg-[#0b0b0f]/80 backdrop-blur-xl border-r border-white/5 min-h-screen sticky top-0 h-screen overflow-y-auto">
          <div className="px-6 py-7 border-b border-white/5">
            <button onClick={() => router.push("/")} className="flex items-center gap-3 group outline-none [-webkit-tap-highlight-color:transparent]">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-lg font-black shadow-[0_0_15px_rgba(249,115,22,0.4)]">Z</div>
              <div className="text-left">
                <p className="text-white font-black text-lg leading-tight group-hover:text-orange-400 transition-colors">Zestly</p>
                <p className="text-orange-500 text-[10px] font-bold uppercase tracking-widest">Admin Panel</p>
              </div>
            </button>
          </div>

          <nav className="flex-1 py-6 px-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as any)}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all outline-none [-webkit-tap-highlight-color:transparent] ${
                  activeSection === item.id ? "bg-orange-500/15 text-orange-400 border border-orange-500/25 shadow-[0_0_20px_rgba(249,115,22,0.1)]" : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
                {item.id === "users" && <span className="ml-auto bg-orange-500/20 text-orange-400 text-[10px] px-2 py-0.5 rounded-full font-black">{metrics.totalUsers}</span>}
                {item.id === "recipes" && <span className="ml-auto bg-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded-full font-black">{metrics.totalRecipes}</span>}
                {item.id === "verification" && pendingRequests.length > 0 && <span className="ml-auto bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black shadow-[0_0_10px_#3b82f6]">{pendingRequests.length} Req</span>}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-white/5">
            <div className="bg-white/[0.03] border border-orange-500/20 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center font-black text-sm shadow-inner shrink-0">{initial}</div>
              <div className="min-w-0 text-left">
                <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">Super Admin</p>
                <p className="text-white font-black text-sm truncate">{adminUser?.user_metadata?.full_name || "Head Chef"}</p>
                <p className="text-slate-500 text-[10px] truncate">{adminUser?.email}</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0 flex flex-col">
          <header className="sticky top-0 z-30 bg-[#07070a]/80 backdrop-blur-xl border-b border-white/5 px-4 sm:px-6 py-4 flex justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push("/")} className="lg:hidden w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition-colors outline-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              </button>
              <div>
                <h1 className="text-white font-black text-lg leading-tight">
                  {navItems.find((n) => n.id === activeSection)?.icon} {navItems.find((n) => n.id === activeSection)?.label}
                </h1>
                <p className="text-slate-500 text-[11px] font-medium hidden sm:block">Live data from Supabase</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-white/[0.03] border border-orange-500/20 px-3 py-2 rounded-xl text-xs font-bold text-orange-400">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.8)]" /> Live
              </div>
              <button onClick={fetchDashboardData} disabled={isRefreshing} className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition-colors outline-none disabled:opacity-50">
                <svg className={`w-4 h-4 text-white ${isRefreshing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0115-2M20 15a9 9 0 01-15 2" /></svg>
              </button>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center font-black text-sm shadow-[0_0_10px_rgba(249,115,22,0.4)]">{initial}</div>
            </div>
          </header>

          <div className="lg:hidden flex gap-1 px-4 py-3 border-b border-white/5 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => setActiveSection(item.id as any)} className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all outline-none [-webkit-tap-highlight-color:transparent] ${activeSection === item.id ? "bg-orange-500/15 text-orange-400 border border-orange-500/25" : "text-slate-500 bg-white/[0.03]"}`}>
                {item.icon} {item.label}
              </button>
            ))}
          </div>

          <div className="flex-1 p-4 sm:p-6 xl:p-8 space-y-6 pb-20">

            {/* ════════════════════════════════════
                OVERVIEW SECTION
            ════════════════════════════════════ */}
            {activeSection === "overview" && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
                  {[
                    { label: "Total Chefs", value: formatNum(metrics.totalUsers), sub: `+${metrics.newUsersToday} today`, icon: "👥", color: "orange" },
                    { label: "Recipes", value: formatNum(metrics.totalRecipes), sub: `+${metrics.newRecipesToday} today`, icon: "🍲", color: "red" },
                    { label: "Connections", value: formatNum(metrics.totalFollows), sub: "Total follows", icon: "🔗", color: "yellow" },
                    { label: "Pantry Items", value: formatNum(metrics.totalPantryItems), sub: "Across all users", icon: "🫙", color: "emerald" },
                    { label: "Notifications", value: formatNum(metrics.totalNotifs), sub: "All time", icon: "🔔", color: "blue" },
                    { label: "Bot Pings", value: formatNum(botPings), sub: "Supabase Keep-Alive", icon: "🤖", color: "purple" },
                  ].map((m, i) => (
                    <div key={i} className={`bg-white/[0.02] border border-${m.color}-500/20 rounded-3xl p-4 sm:p-5 relative overflow-hidden group hover:border-${m.color}-500/40 transition-all`}>
                      <div className={`absolute -right-3 -top-3 w-20 h-20 bg-${m.color}-500/10 rounded-full blur-xl group-hover:bg-${m.color}-500/20 transition-all pointer-events-none`} />
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">{m.label}</p>
                      <p className="text-3xl sm:text-4xl font-black text-white">{m.value}</p>
                      <p className="text-green-400 text-[11px] font-bold mt-2 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>{m.sub}</p>
                      <div className="absolute top-4 right-4 text-2xl opacity-60">{m.icon}</div>
                    </div>
                  ))}
                </div>
                {/* Chart & Breakdowns */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-[2rem] p-5 sm:p-7">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-7">
                      <div>
                        <h3 className="text-white font-black text-lg">Recipe Uploads</h3>
                        <p className="text-slate-500 text-xs font-medium mt-0.5">Last 7 days activity</p>
                      </div>
                      <span className="self-start sm:self-auto bg-orange-500/15 text-orange-400 text-xs font-bold px-3 py-1.5 rounded-full border border-orange-500/25 flex items-center gap-2 w-fit">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping"></span> Real-time
                      </span>
                    </div>
                    <div className="flex items-end gap-2 sm:gap-3 h-40 w-full">
                      {graphData.map((val, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                          <span className="text-[9px] text-slate-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">{val}</span>
                          <div className="w-full bg-gradient-to-t from-orange-600/90 to-yellow-400/80 rounded-t-lg hover:from-orange-500 hover:to-yellow-300 transition-all duration-300 cursor-pointer relative overflow-hidden min-h-[4px]" style={{ height: `${Math.max(4, (val / graphMax) * 100)}%` }}>
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-slate-600 text-[10px] font-bold uppercase mt-3">
                      {dayLabels.map((d, i) => (<span key={i} className={i === 6 ? "text-orange-500" : ""}>{d}</span>))}
                    </div>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-5 sm:p-7 flex flex-col">
                    <h3 className="text-white font-black text-lg mb-6">App Controls</h3>
                    <div className="space-y-5 flex-1">
                      {[{ label: "Maintenance Mode", sub: "Lock app", value: maintenanceMode, set: setMaintenanceMode, activeColor: "bg-red-500" }, { label: "Allow Signups", sub: "Open for chefs", value: allowSignups, set: setAllowSignups, activeColor: "bg-green-500" }, { label: "AI Recipe Bot", sub: "AI suggestions", value: aiBot, set: setAiBot, activeColor: "bg-orange-500" }].map((ctrl, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <div><p className="text-white font-bold text-sm">{ctrl.label}</p><p className="text-slate-500 text-[11px] mt-0.5">{ctrl.sub}</p></div>
                          <button onClick={() => ctrl.set(!ctrl.value)} className={`w-13 h-7 rounded-full p-1 transition-colors duration-300 outline-none shrink-0 ml-4 ${ctrl.value ? ctrl.activeColor : "bg-white/10"}`} style={{ width: 52 }}>
                            <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${ctrl.value ? "translate-x-6" : "translate-x-0"}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 pt-5 border-t border-white/5">
                      <div className="flex justify-between items-center mb-2"><p className="text-slate-400 text-xs font-bold">Storage Used</p><span className="text-emerald-400 text-xs font-black">{metrics.storagePercent}%</span></div>
                      <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden border border-white/5"><div className="bg-gradient-to-r from-emerald-500 to-green-400 h-full rounded-full transition-all duration-700" style={{ width: `${metrics.storagePercent}%` }} /></div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ════════════════════════════════════
                USERS SECTION
            ════════════════════════════════════ */}
            {activeSection === "users" && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <div className="relative flex-1 w-full">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input type="text" placeholder="Search chefs..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-white text-sm outline-none focus:border-orange-500/40 placeholder:text-slate-500 transition-colors" />
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 px-4 py-3 rounded-2xl text-xs font-bold text-slate-400 whitespace-nowrap shrink-0">
                    {filteredUsers.length} / {metrics.totalUsers} chefs
                  </div>
                </div>
                {filteredUsers.length > 50 && (<p className="text-xs text-orange-400 font-bold px-2">Showing top 50 matches. Refine your search to find more.</p>)}

                <div className="hidden md:block bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="border-b border-white/5">
                        <tr className="text-slate-500 text-[10px] uppercase tracking-widest">
                          <th className="px-6 py-4 font-bold">Chef</th>
                          <th className="px-4 py-4 font-bold text-center">Verified</th>
                          <th className="px-4 py-4 font-bold text-center">Followers</th>
                          <th className="px-4 py-4 font-bold">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.03]">
                        {displayUsers.length === 0 ? (
                          <tr><td colSpan={6} className="text-center py-16 text-slate-500 text-sm">No chefs found</td></tr>
                        ) : (
                          displayUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-sm font-black shrink-0 overflow-hidden">
                                    {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : u.full_name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-white font-bold text-sm leading-tight flex items-center gap-1">{u.full_name} {u.is_verified && <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>}</p>
                                    <p className="text-slate-500 text-[11px]">@{u.username}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${u.is_verified ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}>
                                  {u.is_verified ? "Gold Tick" : "Normal"}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-center"><span className="text-orange-400 font-bold text-sm">{formatNum(u.followers_count)}</span></td>
                              <td className="px-4 py-4"><span className="text-slate-500 text-xs font-medium">{timeAgo(u.joined)}</span></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="md:hidden space-y-3">
                  {displayUsers.length === 0 ? (
                    <div className="text-center py-16 text-slate-500 bg-white/[0.02] rounded-3xl border border-white/5 text-sm">No chefs found</div>
                  ) : (
                    displayUsers.map((u) => (
                      <div key={u.id} className="bg-white/[0.02] border border-white/5 rounded-3xl p-4 hover:border-orange-500/20 transition-all">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-lg font-black shrink-0 overflow-hidden">
                            {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : u.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-white font-black text-base truncate flex items-center gap-1">{u.full_name}{u.is_verified && <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>}</p>
                                <p className="text-slate-500 text-xs">@{u.username}</p>
                              </div>
                            </div>
                            <div className="flex gap-4 mt-3">
                              {[{ label: "Recipes", val: u.recipes_count }, { label: "Followers", val: formatNum(u.followers_count) }, { label: "Following", val: u.following_count }].map((s, i) => (
                                <div key={i} className="text-center">
                                  <p className="text-white font-black text-sm">{s.val}</p>
                                  <p className="text-slate-500 text-[10px] font-bold">{s.label}</p>
                                </div>
                              ))}
                            </div>
                            <p className="text-slate-600 text-[11px] mt-2">Joined {timeAgo(u.joined)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ════════════════════════════════════
                RECIPES SECTION
            ════════════════════════════════════ */}
            {activeSection === "recipes" && (
              <div className="space-y-5">
                 {/* Omitted Recipe search code to save space, but it stays exactly same in actual implementation */}
                 <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <div className="relative flex-1 w-full">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input type="text" placeholder="Search recipes..." value={recipeSearch} onChange={(e) => setRecipeSearch(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-white text-sm outline-none focus:border-orange-500/40 placeholder:text-slate-500 transition-colors" />
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 px-4 py-3 rounded-2xl text-xs font-bold text-slate-400 whitespace-nowrap shrink-0">
                    {filteredRecipes.length} recipes
                  </div>
                </div>

                {filteredRecipes.length > 50 && (<p className="text-xs text-orange-400 font-bold px-2">Showing top 50 matches.</p>)}

                <div className="hidden lg:block bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="border-b border-white/5">
                        <tr className="text-slate-500 text-[10px] uppercase tracking-widest">
                          <th className="px-6 py-4 font-bold">Recipe</th>
                          <th className="px-4 py-4 font-bold">Author</th>
                          <th className="px-4 py-4 font-bold text-center">❤️</th>
                          <th className="px-4 py-4 font-bold text-center">💬</th>
                          <th className="px-4 py-4 font-bold text-center">Type</th>
                          <th className="px-4 py-4 font-bold text-center">Difficulty</th>
                          <th className="px-4 py-4 font-bold">Added</th>
                          <th className="px-4 py-4 font-bold text-right">Delete</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.03]">
                        {displayRecipes.length === 0 ? (
                          <tr><td colSpan={8} className="text-center py-16 text-slate-500 text-sm">No recipes found</td></tr>
                        ) : (
                          displayRecipes.map((r) => (
                            <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-6 py-3.5">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 bg-white/5 flex items-center justify-center">
                                    {r.image_url ? <img src={r.image_url} className="w-full h-full object-cover" /> : <span className="text-lg">{r.emoji}</span>}
                                  </div>
                                  <p className="text-white font-bold text-sm">{r.name}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3.5"><p className="text-slate-400 text-sm">{r.author_name}</p></td>
                              <td className="px-4 py-3.5 text-center"><span className="text-red-400 font-black text-sm">{r.likes_count}</span></td>
                              <td className="px-4 py-3.5 text-center"><span className="text-blue-400 font-bold text-sm">{r.comments_count}</span></td>
                              <td className="px-4 py-3.5 text-center">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${r.type === "Veg" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>{r.type}</span>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${r.difficulty === "Easy" ? "text-green-400" : r.difficulty === "Hard" ? "text-red-400" : "text-yellow-400"}`}>{r.difficulty}</span>
                              </td>
                              <td className="px-4 py-3.5"><span className="text-slate-500 text-xs">{timeAgo(r.created_at)}</span></td>
                              <td className="px-4 py-3.5 text-right">
                                <button onClick={() => deleteRecipe(r.id)} className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all outline-none">Delete</button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════
                🛡️ NEW: VERIFICATION REQUESTS
            ════════════════════════════════════ */}
            {activeSection === "verification" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-[2rem] p-6 relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="absolute right-0 top-0 w-64 h-64 bg-cyan-500/20 blur-[80px] pointer-events-none"></div>
                        <div>
                            <h2 className="text-2xl font-black text-white flex items-center gap-2">Verification Queue 🛡️</h2>
                            <p className="text-blue-200 text-sm mt-1 max-w-md">Review users who have applied for the Master Chef Gold Badge.</p>
                        </div>
                    </div>

                    {pendingRequests.length === 0 ? (
                        <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-10 text-center">
                            <span className="text-4xl block mb-4 opacity-50">✅</span>
                            <p className="text-white font-black text-xl">All caught up!</p>
                            <p className="text-slate-500 text-sm mt-1">No pending verification requests.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pendingRequests.map(req => (
                                <div key={req.id} className="bg-white/[0.02] border border-white/5 p-5 rounded-[2rem] flex flex-col items-center text-center hover:border-blue-500/30 transition-all">
                                    <div className="w-20 h-20 rounded-full overflow-hidden bg-white/10 mb-4 border-2 border-blue-500/30">
                                        {req.avatar_url ? <img src={req.avatar_url} className="w-full h-full object-cover"/> : <span className="flex items-center justify-center w-full h-full text-white font-black text-2xl">{req.full_name.charAt(0)}</span>}
                                    </div>
                                    <h4 className="text-white font-bold text-lg leading-tight">{req.full_name}</h4>
                                    <p className="text-slate-500 text-xs mb-3">@{req.username}</p>
                                    <p className="text-blue-400 text-xs font-bold bg-blue-500/10 px-3 py-1 rounded-lg mb-5 border border-blue-500/20">Applied for Badge</p>
                                    
                                    <div className="flex gap-3 w-full">
                                        <button onClick={() => toggleVerify(req.id, false)} className="flex-1 py-2.5 rounded-xl bg-green-500 text-white font-black text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-md">Approve</button>
                                        <button onClick={() => rejectVerify(req.id)} className="flex-1 py-2.5 rounded-xl bg-white/5 text-red-400 font-bold text-sm hover:bg-red-500/10 transition-all border border-red-500/20">Reject</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ════════════════════════════════════
                🚀 ALGORITHM & GOD MODE
            ════════════════════════════════════ */}
            {activeSection === "algorithm" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* 1. Global Fake Engagement Switch */}
                <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-[2rem] p-6 relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-purple-500/20 blur-[80px] pointer-events-none"></div>
                    <div>
                        <h2 className="text-2xl font-black text-white flex items-center gap-2">Growth Algorithm Engine 🚀</h2>
                        <p className="text-indigo-200 text-sm mt-1 max-w-md">Turn this ON to artificially boost likes, views, and followers across the app dynamically.</p>
                    </div>
                    <button onClick={toggleFakeMode} className={`relative w-20 h-10 rounded-full p-1.5 transition-all duration-300 outline-none shrink-0 border shadow-inner ${fakeMode ? "bg-green-500 border-green-400 shadow-[0_0_20px_#4ade8040]" : "bg-white/10 border-white/5"}`}>
                        <div className={`w-7 h-7 bg-white rounded-full shadow-md transition-transform duration-300 flex items-center justify-center text-[10px] font-black ${fakeMode ? "translate-x-10 text-green-500" : "translate-x-0 text-slate-500"}`}>
                            {fakeMode ? "ON" : "OFF"}
                        </div>
                    </button>
                </div>

                {/* 3. God Mode User Manipulation */}
                <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-5 sm:p-7">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-end mb-6">
                        <div>
                            <h3 className="text-white font-black text-xl flex items-center gap-2">User God Mode ⚡</h3>
                            <p className="text-slate-500 text-xs mt-1">Edit profile, set custom followers, grant badge directly, or delete DP.</p>
                        </div>
                        <input type="text" placeholder="Search user to hack..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="w-full sm:w-64 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-indigo-500/50" />
                    </div>

                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:hidden">
                        {displayUsers.length === 0 ? (
                            <p className="text-center text-slate-500 py-10">No users found.</p>
                        ) : (
                            displayUsers.map((u) => (
                                <div key={u.id} className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between hover:border-indigo-500/30 transition-all">
                                    
                                    <div className="flex items-center gap-3 w-full xl:w-1/4">
                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 flex items-center justify-center font-black text-xl border border-white/10">
                                                {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover"/> : u.full_name.charAt(0)}
                                            </div>
                                            {u.is_verified && <div className="absolute -bottom-1 -right-1 bg-white rounded-full"><svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></div>}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-white font-bold truncate flex items-center gap-1">{u.full_name}</p>
                                            <p className="text-slate-400 text-xs truncate">@{u.username}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
                                        
                                        {/* EXACT Follower Control */}
                                        <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-xl p-2 shrink-0">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase w-12 text-center text-wrap">Admin Bonus</span>
                                            <input 
                                                type="number" 
                                                value={u.bonus_followers} 
                                                onChange={(e) => handleBonusFollowersChange(u.id, e.target.value)}
                                                className="w-20 bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-center font-black text-sm text-green-400 outline-none focus:border-green-500"
                                            />
                                            <div className="text-[10px] text-slate-500 flex flex-col text-right pr-2 min-w-[70px]">
                                                <span className="text-orange-400 font-bold" title="Total Followers (Real + Bonus + Engine)">Total: {formatNum(u.followers_count)}</span>
                                                <span title="Real Organic Followers">Real: {u.real_followers}</span>
                                            </div>
                                        </div>

                                        {/* Power Action Buttons */}
                                        <button onClick={() => toggleVerify(u.id, u.is_verified)} className={`px-3 py-2 text-[11px] font-bold rounded-xl transition-all ${u.is_verified ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500 hover:text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                                            {u.is_verified ? "Revoke Badge" : "Give Badge"}
                                        </button>
                                        <button onClick={() => handleEditUserClick(u)} className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold rounded-xl transition-all">Edit</button>
                                        <button onClick={() => removeAvatar(u.id)} disabled={!u.avatar_url} className="px-3 py-2 bg-yellow-500/10 text-yellow-500 disabled:opacity-30 hover:bg-yellow-500 hover:text-black text-[11px] font-bold rounded-xl transition-all">Del DP</button>
                                        <button onClick={() => fullyDeleteUser(u.id)} className="px-3 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white text-[11px] font-bold rounded-xl transition-all">Ban</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

              </div>
            )}

            {/* ════════════════════════════════════
                ACTIVITY / LOGS SECTION
            ════════════════════════════════════ */}
            {activeSection === "logs" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-white font-black text-xl">Activity Logs</h2>
                    <p className="text-slate-500 text-xs mt-0.5">Live events from your Zestly database</p>
                  </div>
                  <button
                    onClick={() => setLogs([])}
                    className="text-xs font-bold px-4 py-2 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all border border-white/5 outline-none [-webkit-tap-highlight-color:transparent]"
                  >
                    Clear
                  </button>
                </div>

                <div className="bg-[#0b0b0e] border border-white/5 rounded-[2rem] overflow-hidden font-mono">
                  {/* Terminal header */}
                  <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/5 bg-white/[0.01]">
                    <div className="w-3 h-3 rounded-full bg-red-500/60"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/60"></div>
                    <span className="text-slate-600 text-xs font-bold ml-2">zestly_engine.log</span>
                    <span className="ml-auto text-orange-500 text-xs font-bold animate-pulse">● LIVE</span>
                  </div>
                  <div className="p-5 max-h-[520px] overflow-y-auto space-y-3 [&::-webkit-scrollbar]:hidden">
                    {logs.length === 0 ? (
                      <div className="text-center py-20 text-slate-600">
                        <p className="text-2xl mb-2">📭</p>
                        <p className="text-sm">No activity yet. Events from Supabase will appear here.</p>
                      </div>
                    ) : (
                      logs.map((log) => (
                        <div key={log.id} className="flex items-start gap-3 bg-black/40 rounded-2xl p-3.5 border border-white/[0.04]">
                          <span className="text-lg shrink-0">{log.icon}</span>
                          <div className="flex-1 min-w-0">
                            <span
                              className={`text-sm font-medium leading-relaxed ${
                                log.type === "danger"
                                  ? "text-red-400"
                                  : log.type === "warning"
                                  ? "text-yellow-400"
                                  : log.type === "success"
                                  ? "text-green-400"
                                  : "text-orange-400"
                              }`}
                            >
                              {log.action}
                            </span>
                          </div>
                          <span className="text-slate-600 text-xs font-bold shrink-0">{log.time}</span>
                        </div>
                      ))
                    )}
                    <div className="flex items-center gap-2 text-slate-600 text-xs pt-2">
                      <span className="text-orange-500 animate-pulse font-black">_</span>
                      Zestly Engine V2.0 • {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* 🚀 EDIT USER MODAL (GOD MODE) */}
      {editingUser && createPortal(
          <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
              <div className="bg-[#121216] w-full max-w-md rounded-[2rem] p-6 sm:p-8 shadow-2xl border border-white/10 relative">
                  <button onClick={() => setEditingUser(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white">✕</button>
                  <h3 className="text-2xl font-black text-white mb-6">Edit User ⚡</h3>
                  
                  <form onSubmit={handleEditUserSubmit} className="space-y-4">
                      <div>
                          <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Full Name</label>
                          <input type="text" value={editFormData.full_name} onChange={e => setEditFormData({...editFormData, full_name: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none text-white mt-1" required />
                      </div>
                      <div>
                          <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Username</label>
                          <input type="text" value={editFormData.username} onChange={e => setEditFormData({...editFormData, username: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none text-white mt-1" required />
                      </div>
                      <div>
                          <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Bio</label>
                          <textarea value={editFormData.bio} onChange={e => setEditFormData({...editFormData, bio: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none text-white mt-1 resize-none" rows={3} />
                      </div>
                      
                      <button type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black py-4 rounded-xl mt-4 hover:scale-[1.02] active:scale-95 transition-all shadow-lg">
                          Save Changes
                      </button>
                  </form>
              </div>
          </div>, document.body
      )}

      {/* TOASTS */}
      {toast.isOpen && createPortal(
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100000] pointer-events-none animate-in slide-in-from-top-4">
          <div className={`px-6 py-3.5 rounded-full shadow-2xl text-sm font-bold border whitespace-nowrap ${toast.type === "danger" ? "bg-red-500 text-white border-red-400" : "bg-slate-900 dark:bg-[#1c1c1e] text-white border-slate-700 dark:border-white/10"}`}>
            {toast.message}
          </div>
        </div>, document.body
      )}
    </div>
  );
}
"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

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
  recipes_count: number;
  followers_count: number;
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
  const [activeSection, setActiveSection] = useState<"overview" | "users" | "recipes" | "logs">("overview");
  const [userSearch, setUserSearch] = useState("");
  const [recipeSearch, setRecipeSearch] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowSignups, setAllowSignups] = useState(true);
  const [aiBot, setAiBot] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bannedIds, setBannedIds] = useState<Set<string>>(new Set());

  // ── Fetch All Data ─────────────────────────────────────
  const fetchDashboardData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      // Parallel fetches
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
        { count: vegCount }, // 🔥 FIX: Extracting 'count' instead of 'data'
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("recipes").select("*", { count: "exact", head: true }),
        supabase.from("follows").select("*", { count: "exact", head: true }),
        supabase.from("notifications").select("*", { count: "exact", head: true }),
        supabase.from("pantry").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
        supabase.from("recipes").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
        supabase.from("profiles").select("id, full_name, username, bio, created_at").order("created_at", { ascending: false }).limit(50),
        supabase.from("recipes").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("notifications").select("id, type, created_at").order("created_at", { ascending: false }).limit(30),
        supabase.from("recipes").select("*", { count: "exact", head: true }).eq("type", "Veg"),
      ]);

      // Build user rows with recipe + follow counts
      const formattedUsers: UserRow[] = await Promise.all(
        (profilesData || []).map(async (p: any) => {
          const [{ count: rc }, { count: fc }, { count: fgc }] = await Promise.all([
            supabase.from("recipes").select("*", { count: "exact", head: true }).eq("author_id", p.id),
            supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", p.id),
            supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", p.id),
          ]);
          return {
            id: p.id,
            full_name: p.full_name || "Unknown Chef",
            username: p.username || "unknown",
            email: "",
            bio: p.bio || "",
            recipes_count: rc || 0,
            followers_count: fc || 0,
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

      // Activity logs from notifications
      const activityLogs: ActivityLog[] = (notifsData || []).map((n: NotifRow) => ({
        id: n.id,
        action:
          n.type === "like"
            ? "Someone liked a recipe ❤️"
            : n.type === "follow"
            ? "A new chef followed someone 👤"
            : `New activity: ${n.type}`,
        time: timeAgo(n.created_at),
        type: n.type === "like" ? "success" : n.type === "follow" ? "info" : "warning",
        icon: n.type === "like" ? "❤️" : n.type === "follow" ? "👤" : "🔔",
      }));

      // Graph: last 7 days recipe counts
      const graphPoints: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i).toISOString();
        const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1).toISOString();
        const { count } = await supabase
          .from("recipes")
          .select("*", { count: "exact", head: true })
          .gte("created_at", dayStart)
          .lt("created_at", dayEnd);
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
        vegCount: vegCount || 0, // 🔥 FIX: Properly mapped to the extracted count variable
        nonVegCount: (totalRecipes || 0) - (vegCount || 0), // 🔥 FIX: No TS errors here anymore
        storagePercent: Math.min(100, Math.round(((totalRecipes || 0) * 0.15) % 100)),
      });
    } catch (err) {
      console.error("Admin fetch error:", err);
    }
    setIsRefreshing(false);
  }, []);

  // ── Auth Check ─────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setAdminUser(session.user);
        await fetchDashboardData();
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
  };

  const deleteRecipe = async (id: string) => {
    if (!confirm("Delete this recipe permanently?")) return;
    await supabase.from("recipes").delete().eq("id", id);
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    setLogs((prev) => [
      { id: Date.now().toString(), action: "Admin deleted a recipe 🗑️", time: "just now", type: "danger", icon: "🗑️" },
      ...prev,
    ]);
  };

  // ── Filtered Lists ─────────────────────────────────────
  const filteredUsers = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearch.toLowerCase())
  );
  const filteredRecipes = recipes.filter((r) =>
    r.name.toLowerCase().includes(recipeSearch.toLowerCase())
  );

  const graphMax = Math.max(...graphData, 1);
  const dayLabels = ["6d", "5d", "4d", "3d", "2d", "1d", "Today"];

  // ── Loading ────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#07070a] gap-4">
        <div className="w-14 h-14 border-4 border-orange-500 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(249,115,22,0.5)]"></div>
        <p className="text-orange-400 font-bold animate-pulse tracking-widest text-sm uppercase">
          Loading Admin...
        </p>
      </div>
    );
  }

  const initial =
    adminUser?.user_metadata?.full_name?.charAt(0).toUpperCase() ||
    adminUser?.email?.charAt(0).toUpperCase() ||
    "A";

  // ── NAV ITEMS ──────────────────────────────────────────
  const navItems = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "users", label: "Users", icon: "👥" },
    { id: "recipes", label: "Recipes", icon: "🍲" },
    { id: "logs", label: "Activity", icon: "📋" },
  ] as const;

  // ─────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#07070a] text-white font-sans selection:bg-orange-500/30 relative overflow-x-hidden">
      {/* Ambient glow */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-900/20 via-transparent to-transparent pointer-events-none z-0" />

      {/* ── LAYOUT WRAPPER ── */}
      <div className="relative z-10 flex flex-col lg:flex-row min-h-screen">

        {/* ══════════════════════════════════════
            SIDEBAR (desktop only)
        ══════════════════════════════════════ */}
        <aside className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 bg-[#0b0b0f]/80 backdrop-blur-xl border-r border-white/5 min-h-screen sticky top-0 h-screen overflow-y-auto">
          {/* Logo */}
          <div className="px-6 py-7 border-b border-white/5">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-3 group outline-none [-webkit-tap-highlight-color:transparent]"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-lg font-black shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                Z
              </div>
              <div className="text-left">
                <p className="text-white font-black text-lg leading-tight group-hover:text-orange-400 transition-colors">
                  Zestly
                </p>
                <p className="text-orange-500 text-[10px] font-bold uppercase tracking-widest">
                  Admin Panel
                </p>
              </div>
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 py-6 px-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all outline-none [-webkit-tap-highlight-color:transparent] ${
                  activeSection === item.id
                    ? "bg-orange-500/15 text-orange-400 border border-orange-500/25 shadow-[0_0_20px_rgba(249,115,22,0.1)]"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
                {item.id === "users" && (
                  <span className="ml-auto bg-orange-500/20 text-orange-400 text-[10px] px-2 py-0.5 rounded-full font-black">
                    {metrics.totalUsers}
                  </span>
                )}
                {item.id === "recipes" && (
                  <span className="ml-auto bg-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded-full font-black">
                    {metrics.totalRecipes}
                  </span>
                )}
                {item.id === "logs" && logs.length > 0 && (
                  <span className="ml-auto w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                )}
              </button>
            ))}
          </nav>

          {/* Admin badge */}
          <div className="p-4 border-t border-white/5">
            <div className="bg-white/[0.03] border border-orange-500/20 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center font-black text-sm shadow-inner shrink-0">
                {initial}
              </div>
              <div className="min-w-0 text-left">
                <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">
                  Super Admin
                </p>
                <p className="text-white font-black text-sm truncate">
                  {adminUser?.user_metadata?.full_name || "Head Chef"}
                </p>
                <p className="text-slate-500 text-[10px] truncate">
                  {adminUser?.email}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* ══════════════════════════════════════
            MAIN AREA
        ══════════════════════════════════════ */}
        <main className="flex-1 min-w-0 flex flex-col">

          {/* ── TOP BAR ── */}
          <header className="sticky top-0 z-30 bg-[#07070a]/80 backdrop-blur-xl border-b border-white/5 px-4 sm:px-6 py-4 flex justify-between items-center gap-4">
            {/* Mobile logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/")}
                className="lg:hidden w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition-colors outline-none"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-white font-black text-lg leading-tight">
                  {navItems.find((n) => n.id === activeSection)?.icon}{" "}
                  {navItems.find((n) => n.id === activeSection)?.label}
                </h1>
                <p className="text-slate-500 text-[11px] font-medium hidden sm:block">
                  Live data from Supabase
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Live dot */}
              <div className="hidden sm:flex items-center gap-2 bg-white/[0.03] border border-orange-500/20 px-3 py-2 rounded-xl text-xs font-bold text-orange-400">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                Live
              </div>
              {/* Refresh */}
              <button
                onClick={fetchDashboardData}
                disabled={isRefreshing}
                className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition-colors outline-none disabled:opacity-50"
              >
                <svg
                  className={`w-4 h-4 text-white ${isRefreshing ? "animate-spin" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0115-2M20 15a9 9 0 01-15 2" />
                </svg>
              </button>
              {/* Avatar */}
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center font-black text-sm shadow-[0_0_10px_rgba(249,115,22,0.4)]">
                {initial}
              </div>
            </div>
          </header>

          {/* ── MOBILE NAV TABS ── */}
          <div className="lg:hidden flex gap-1 px-4 py-3 border-b border-white/5 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all outline-none [-webkit-tap-highlight-color:transparent] ${
                  activeSection === item.id
                    ? "bg-orange-500/15 text-orange-400 border border-orange-500/25"
                    : "text-slate-500 bg-white/[0.03]"
                }`}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </div>

          {/* ── PAGE CONTENT ── */}
          <div className="flex-1 p-4 sm:p-6 xl:p-8 space-y-6 pb-20">

            {/* ════════════════════════════════════
                OVERVIEW SECTION
            ════════════════════════════════════ */}
            {activeSection === "overview" && (
              <>
                {/* Metric Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
                  {[
                    { label: "Total Chefs", value: formatNum(metrics.totalUsers), sub: `+${metrics.newUsersToday} today`, icon: "👥", color: "orange" },
                    { label: "Recipes", value: formatNum(metrics.totalRecipes), sub: `+${metrics.newRecipesToday} today`, icon: "🍲", color: "red" },
                    { label: "Connections", value: formatNum(metrics.totalFollows), sub: "Total follows", icon: "🔗", color: "yellow" },
                    { label: "Pantry Items", value: formatNum(metrics.totalPantryItems), sub: "Across all users", icon: "🫙", color: "emerald" },
                    { label: "Notifications", value: formatNum(metrics.totalNotifs), sub: "All time", icon: "🔔", color: "blue" },
                  ].map((m, i) => (
                    <div
                      key={i}
                      className={`bg-white/[0.02] border border-${m.color}-500/20 rounded-3xl p-4 sm:p-5 relative overflow-hidden group hover:border-${m.color}-500/40 transition-all`}
                    >
                      <div className={`absolute -right-3 -top-3 w-20 h-20 bg-${m.color}-500/10 rounded-full blur-xl group-hover:bg-${m.color}-500/20 transition-all pointer-events-none`} />
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">{m.label}</p>
                      <p className="text-3xl sm:text-4xl font-black text-white">{m.value}</p>
                      <p className="text-green-400 text-[11px] font-bold mt-2 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                        {m.sub}
                      </p>
                      <div className="absolute top-4 right-4 text-2xl opacity-60">{m.icon}</div>
                    </div>
                  ))}
                </div>

                {/* Graph + Controls */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                  {/* Graph */}
                  <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-[2rem] p-5 sm:p-7">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-7">
                      <div>
                        <h3 className="text-white font-black text-lg">Recipe Uploads</h3>
                        <p className="text-slate-500 text-xs font-medium mt-0.5">Last 7 days activity</p>
                      </div>
                      <span className="self-start sm:self-auto bg-orange-500/15 text-orange-400 text-xs font-bold px-3 py-1.5 rounded-full border border-orange-500/25 flex items-center gap-2 w-fit">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping"></span>
                        Real-time
                      </span>
                    </div>

                    {/* Bar chart */}
                    <div className="flex items-end gap-2 sm:gap-3 h-40 w-full">
                      {graphData.map((val, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                          <span className="text-[9px] text-slate-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                            {val}
                          </span>
                          <div
                            className="w-full bg-gradient-to-t from-orange-600/90 to-yellow-400/80 rounded-t-lg hover:from-orange-500 hover:to-yellow-300 transition-all duration-300 cursor-pointer relative overflow-hidden min-h-[4px]"
                            style={{ height: `${Math.max(4, (val / graphMax) * 100)}%` }}
                          >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-slate-600 text-[10px] font-bold uppercase mt-3">
                      {dayLabels.map((d, i) => (
                        <span key={i} className={i === 6 ? "text-orange-500" : ""}>{d}</span>
                      ))}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-5 sm:p-7 flex flex-col">
                    <h3 className="text-white font-black text-lg mb-6">App Controls</h3>
                    <div className="space-y-5 flex-1">
                      {[
                        {
                          label: "Maintenance Mode",
                          sub: "Lock app for all users",
                          value: maintenanceMode,
                          set: setMaintenanceMode,
                          activeColor: "bg-red-500",
                        },
                        {
                          label: "Allow Signups",
                          sub: "Open for new chefs",
                          value: allowSignups,
                          set: setAllowSignups,
                          activeColor: "bg-green-500",
                        },
                        {
                          label: "AI Recipe Bot",
                          sub: "Enable AI suggestions",
                          value: aiBot,
                          set: setAiBot,
                          activeColor: "bg-orange-500",
                        },
                      ].map((ctrl, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <div>
                            <p className="text-white font-bold text-sm">{ctrl.label}</p>
                            <p className="text-slate-500 text-[11px] mt-0.5">{ctrl.sub}</p>
                          </div>
                          <button
                            onClick={() => ctrl.set(!ctrl.value)}
                            className={`w-13 h-7 rounded-full p-1 transition-colors duration-300 outline-none shrink-0 ml-4 ${ctrl.value ? ctrl.activeColor : "bg-white/10"}`}
                            style={{ width: 52 }}
                          >
                            <div
                              className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${ctrl.value ? "translate-x-6" : "translate-x-0"}`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Storage bar */}
                    <div className="mt-6 pt-5 border-t border-white/5">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-slate-400 text-xs font-bold">Storage Used</p>
                        <span className="text-emerald-400 text-xs font-black">{metrics.storagePercent}%</span>
                      </div>
                      <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden border border-white/5">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-green-400 h-full rounded-full transition-all duration-700"
                          style={{ width: `${metrics.storagePercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recipe Type Breakdown + Top Recipes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Breakdown */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-5 sm:p-7">
                    <h3 className="text-white font-black text-lg mb-6">Recipe Breakdown</h3>
                    <div className="space-y-4">
                      {[
                        { label: "🥬 Vegetarian", count: metrics.vegCount, color: "bg-green-500", total: metrics.totalRecipes },
                        { label: "🥩 Non-Veg", count: metrics.nonVegCount, color: "bg-red-500", total: metrics.totalRecipes },
                      ].map((item, i) => (
                        <div key={i}>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-sm font-bold text-white">{item.label}</span>
                            <span className="text-xs font-black text-slate-400">{item.count} / {item.total}</span>
                          </div>
                          <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden">
                            <div
                              className={`${item.color} h-full rounded-full transition-all duration-700`}
                              style={{ width: `${item.total > 0 ? (item.count / item.total) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-3">
                      {[
                        { label: "Easy", count: recipes.filter(r => r.difficulty === "Easy").length, color: "text-green-400" },
                        { label: "Medium", count: recipes.filter(r => r.difficulty === "Medium").length, color: "text-yellow-400" },
                        { label: "Hard", count: recipes.filter(r => r.difficulty === "Hard").length, color: "text-red-400" },
                      ].map((d, i) => (
                        <div key={i} className="bg-white/[0.02] rounded-2xl p-3 text-center border border-white/5">
                          <p className={`text-xl font-black ${d.color}`}>{d.count}</p>
                          <p className="text-slate-500 text-[10px] font-bold mt-0.5">{d.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Recipes */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-5 sm:p-7">
                    <h3 className="text-white font-black text-lg mb-5">🏆 Top Liked Recipes</h3>
                    {topRecipes.length === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-8">No recipes yet</p>
                    ) : (
                      <div className="space-y-3">
                        {topRecipes.map((r, i) => (
                          <div key={r.id} className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-orange-500/20 transition-all">
                            <span className="text-orange-400 font-black text-sm w-5">#{i + 1}</span>
                            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-white/5 flex items-center justify-center">
                              {r.image_url ? (
                                <img src={r.image_url} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xl">{r.emoji}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-bold text-sm truncate">{r.name}</p>
                              <p className="text-slate-500 text-[11px]">{r.author_name}</p>
                            </div>
                            <span className="text-red-400 font-black text-sm flex items-center gap-1 shrink-0">
                              ❤️ {r.likes_count}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ════════════════════════════════════
                USERS SECTION
            ════════════════════════════════════ */}
            {activeSection === "users" && (
              <div className="space-y-5">
                {/* Search bar */}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <div className="relative flex-1 w-full">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search chefs..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-white text-sm outline-none focus:border-orange-500/40 placeholder:text-slate-500 transition-colors"
                    />
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 px-4 py-3 rounded-2xl text-xs font-bold text-slate-400 whitespace-nowrap shrink-0">
                    {filteredUsers.length} / {metrics.totalUsers} chefs
                  </div>
                </div>

                {/* User cards - mobile: cards, desktop: table */}
                {/* Desktop table */}
                <div className="hidden md:block bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="border-b border-white/5">
                        <tr className="text-slate-500 text-[10px] uppercase tracking-widest">
                          <th className="px-6 py-4 font-bold">Chef</th>
                          <th className="px-4 py-4 font-bold text-center">Recipes</th>
                          <th className="px-4 py-4 font-bold text-center">Followers</th>
                          <th className="px-4 py-4 font-bold text-center">Following</th>
                          <th className="px-4 py-4 font-bold">Joined</th>
                          <th className="px-4 py-4 font-bold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.03]">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-16 text-slate-500 text-sm">
                              No chefs found
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-sm font-black shrink-0">
                                    {u.full_name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-white font-bold text-sm leading-tight">{u.full_name}</p>
                                    <p className="text-slate-500 text-[11px]">@{u.username}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className="text-white font-black bg-white/5 px-3 py-1 rounded-lg text-sm">{u.recipes_count}</span>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className="text-orange-400 font-bold text-sm">{u.followers_count}</span>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className="text-slate-400 font-bold text-sm">{u.following_count}</span>
                              </td>
                              <td className="px-4 py-4">
                                <span className="text-slate-500 text-xs font-medium">{timeAgo(u.joined)}</span>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <button
                                  onClick={() => toggleBan(u.id)}
                                  className={`text-[11px] font-bold px-4 py-2 rounded-xl transition-all outline-none [-webkit-tap-highlight-color:transparent] ${
                                    bannedIds.has(u.id)
                                      ? "bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white border border-green-500/20"
                                      : "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20"
                                  }`}
                                >
                                  {bannedIds.has(u.id) ? "Unban" : "Ban"}
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-16 text-slate-500 bg-white/[0.02] rounded-3xl border border-white/5 text-sm">
                      No chefs found
                    </div>
                  ) : (
                    filteredUsers.map((u) => (
                      <div key={u.id} className="bg-white/[0.02] border border-white/5 rounded-3xl p-4 hover:border-orange-500/20 transition-all">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-lg font-black shrink-0">
                            {u.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-white font-black text-base truncate">{u.full_name}</p>
                                <p className="text-slate-500 text-xs">@{u.username}</p>
                              </div>
                              <button
                                onClick={() => toggleBan(u.id)}
                                className={`shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all outline-none [-webkit-tap-highlight-color:transparent] ${
                                  bannedIds.has(u.id)
                                    ? "bg-green-500/10 text-green-500 border border-green-500/20"
                                    : "bg-red-500/10 text-red-500 border border-red-500/20"
                                }`}
                              >
                                {bannedIds.has(u.id) ? "Unban" : "Ban"}
                              </button>
                            </div>
                            <div className="flex gap-4 mt-3">
                              {[
                                { label: "Recipes", val: u.recipes_count },
                                { label: "Followers", val: u.followers_count },
                                { label: "Following", val: u.following_count },
                              ].map((s, i) => (
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
                {/* Search */}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <div className="relative flex-1 w-full">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search recipes..."
                      value={recipeSearch}
                      onChange={(e) => setRecipeSearch(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-white text-sm outline-none focus:border-orange-500/40 placeholder:text-slate-500 transition-colors"
                    />
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 px-4 py-3 rounded-2xl text-xs font-bold text-slate-400 whitespace-nowrap shrink-0">
                    {filteredRecipes.length} recipes
                  </div>
                </div>

                {/* Desktop table */}
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
                        {filteredRecipes.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="text-center py-16 text-slate-500 text-sm">
                              No recipes found
                            </td>
                          </tr>
                        ) : (
                          filteredRecipes.map((r) => (
                            <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-6 py-3.5">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 bg-white/5 flex items-center justify-center">
                                    {r.image_url ? (
                                      <img src={r.image_url} className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-lg">{r.emoji}</span>
                                    )}
                                  </div>
                                  <p className="text-white font-bold text-sm">{r.name}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3.5">
                                <p className="text-slate-400 text-sm">{r.author_name}</p>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <span className="text-red-400 font-black text-sm">{r.likes_count}</span>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <span className="text-blue-400 font-bold text-sm">{r.comments_count}</span>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${r.type === "Veg" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                                  {r.type}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${r.difficulty === "Easy" ? "text-green-400" : r.difficulty === "Hard" ? "text-red-400" : "text-yellow-400"}`}>
                                  {r.difficulty}
                                </span>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className="text-slate-500 text-xs">{timeAgo(r.created_at)}</span>
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                <button
                                  onClick={() => deleteRecipe(r.id)}
                                  className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all outline-none [-webkit-tap-highlight-color:transparent]"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile / Tablet cards */}
                <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredRecipes.length === 0 ? (
                    <div className="col-span-full text-center py-16 text-slate-500 bg-white/[0.02] rounded-3xl border border-white/5 text-sm">
                      No recipes found
                    </div>
                  ) : (
                    filteredRecipes.map((r) => (
                      <div key={r.id} className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden hover:border-orange-500/20 transition-all">
                        <div className="w-full h-36 bg-white/5 flex items-center justify-center relative overflow-hidden">
                          {r.image_url ? (
                            <img src={r.image_url} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-5xl">{r.emoji}</span>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                            <p className="text-white font-black text-base leading-tight">{r.name}</p>
                            <button
                              onClick={() => deleteRecipe(r.id)}
                              className="w-8 h-8 bg-red-500/80 rounded-xl flex items-center justify-center text-white text-xs transition-all hover:bg-red-500 shrink-0 outline-none [-webkit-tap-highlight-color:transparent]"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                        <div className="p-3 flex items-center justify-between flex-wrap gap-2">
                          <p className="text-slate-400 text-xs font-medium">{r.author_name} • {timeAgo(r.created_at)}</p>
                          <div className="flex items-center gap-3 text-xs font-bold">
                            <span className="text-red-400">❤️ {r.likes_count}</span>
                            <span className="text-blue-400">💬 {r.comments_count}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
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
    </div>
  );
}
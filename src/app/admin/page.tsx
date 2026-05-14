"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase"; // Path apne hisaab se check kar lena
import { useRouter } from "next/navigation";

// Zestly Specific Tracking Types
interface UserTrack {
  id: string;
  name: string;
  email: string;
  role: "User" | "Chef Pro" | "Super Admin";
  status: "Active" | "Banned";
  recipesCount: number;
  lastActive: string;
}

interface ActivityLog {
  id: number;
  action: string;
  time: string;
  type: "success" | "warning" | "danger" | "info";
}

export default function ZestlyAdminPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- 1. ZESTLY METRICS ---
  const [metrics] = useState({
    totalUsers: 1420,
    activeRecipes: 8432,
    activeCookSessions: 342,
    storageUsed: "12.4 GB",
    storageLimit: "50 GB",
    storagePercent: 24.8,
    imageCompressions: "14.2k",
    serverHealth: 99,
  });

  // --- 2. USER MANAGEMENT ---
  const [users, setUsers] = useState<UserTrack[]>([
    { id: "U1", name: "Loading...", email: "loading...", role: "Super Admin", status: "Active", recipesCount: 156, lastActive: "Just now" },
    { id: "U2", name: "Rahul Verma", email: "rahul@cook.com", role: "Chef Pro", status: "Active", recipesCount: 42, lastActive: "2 mins ago" },
    { id: "U3", name: "Priya Singh", email: "priya99@yahoo.com", role: "User", status: "Active", recipesCount: 3, lastActive: "1 hour ago" },
    { id: "U4", name: "FoodSpammer", email: "fake@bot.com", role: "User", status: "Banned", recipesCount: 0, lastActive: "2 days ago" },
  ]);

  // --- 3. FOOD APP ACTIVITY LOGS ---
  const [logs, setLogs] = useState<ActivityLog[]>([
    { id: 1, action: "Rahul uploaded a new recipe: 'Paneer Tikka'.", time: "1 min ago", type: "info" },
    { id: 2, action: "Image compression saved 45MB in the last hour.", time: "15 mins ago", type: "success" },
    { id: 3, action: "High traffic detected in 'Cook Mode' (Dinner Time).", time: "1 hour ago", type: "warning" },
    { id: 4, action: "Blocked 12 spam accounts from uploading fake recipes.", time: "3 hours ago", type: "danger" },
  ]);

  // --- 4. ZESTLY CONTROLS ---
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowSignups, setAllowSignups] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState(true);

  // 🚀 FETCH CURRENT ADMIN DETAILS
  useEffect(() => {
    const fetchAdminDetails = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setAdminUser(session.user);
        // Update first user row with real admin details
        setUsers(prevUsers => {
          const newUsers = [...prevUsers];
          newUsers[0] = {
            ...newUsers[0],
            name: session.user.user_metadata?.full_name || "Head Chef (You)",
            email: session.user.email || "admin@zestly.com"
          };
          return newUsers;
        });
      } else {
        router.push("/login"); // Agar login nahi hai to bhej do
      }
      setIsLoading(false);
    };
    fetchAdminDetails();
  }, [router]);

  const toggleUserStatus = (id: string) => {
    if(id === "U1") { alert("Super Admin (You) cannot be banned! 🛑"); return; }
    setUsers(users.map(u => u.id === id ? { ...u, status: u.status === "Active" ? "Banned" : "Active" } : u));
    setLogs([{ id: Date.now(), action: `Admin changed status for user ${id}.`, time: "Just now", type: "warning" }, ...logs]);
  };

  const clearLogs = () => setLogs([]);

  // Mocking Live Engagement Graph (Orange/Red theme)
  const graphData = [30, 45, 25, 60, 80, 50, 95, 70, 40, 85, 65, 100, 75, 90];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07070a]">
         <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070a] text-white font-sans p-4 md:p-8 relative overflow-x-hidden selection:bg-orange-500/30">
      
      {/* ZESTLY GLOW BACKGROUND */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-900/20 via-red-900/10 to-transparent pointer-events-none z-0"></div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* --- HEADER & ADMIN PROFILE --- */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
          <div>
            <button onClick={() => router.push('/')} className="mb-6 text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-xl transition-all w-max border border-white/5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              Back to App
            </button>
            <h2 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 tracking-tight">Zestly Admin</h2>
            <p className="text-orange-400 font-bold text-sm flex items-center gap-2 mt-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.8)]"></span> Live Command Center
            </p>
          </div>

          {/* REAL ADMIN IDENTITY BADGE */}
          <div className="bg-white/[0.02] border border-orange-500/30 px-5 py-4 rounded-2xl backdrop-blur-md flex items-center gap-4 shadow-[0_0_30px_rgba(249,115,22,0.1)] group hover:border-orange-500/50 transition-all">
             <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-xl font-black shadow-inner">
               {adminUser?.user_metadata?.full_name?.charAt(0).toUpperCase() || adminUser?.email?.charAt(0).toUpperCase() || "A"}
             </div>
             <div>
               <p className="text-xs text-orange-400 font-bold uppercase tracking-wider mb-0.5">Super Admin</p>
               <p className="text-white font-black leading-tight">{adminUser?.user_metadata?.full_name || "Head Chef"}</p>
               <p className="text-slate-400 text-[11px] font-medium">{adminUser?.email}</p>
             </div>
          </div>
        </div>

        {/* --- ROW 1: TOP LEVEL METRICS (Cards) --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          
          <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-orange-500/20 p-6 rounded-3xl shadow-xl relative overflow-hidden group hover:border-orange-500/50 transition-all backdrop-blur-md">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all"></div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Total Foodies</p>
            <h3 className="text-4xl font-black text-white">{metrics.totalUsers.toLocaleString()}</h3>
            <p className="text-green-400 text-xs font-bold mt-3 flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" /></svg> +124 this week</p>
          </div>

          <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-red-500/20 p-6 rounded-3xl shadow-xl relative overflow-hidden group hover:border-red-500/50 transition-all backdrop-blur-md">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all"></div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Recipes Stored</p>
            <h3 className="text-4xl font-black text-white">{metrics.activeRecipes.toLocaleString()}</h3>
            <p className="text-green-400 text-xs font-bold mt-3 flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" /></svg> +430 this week</p>
          </div>

          <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-yellow-500/20 p-6 rounded-3xl shadow-xl relative overflow-hidden group hover:border-yellow-500/50 transition-all backdrop-blur-md">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl group-hover:bg-yellow-500/20 transition-all"></div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Live Cook Sessions</p>
            <h3 className="text-4xl font-black text-white flex items-center gap-2">
              {metrics.activeCookSessions} <span className="text-2xl">👨‍🍳</span>
            </h3>
            <p className="text-orange-400 text-xs font-bold mt-3 animate-pulse flex items-center gap-1"><span className="w-2 h-2 bg-orange-500 rounded-full"></span> Dinner Rush Active</p>
          </div>

          <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-emerald-500/20 p-6 rounded-3xl shadow-xl relative overflow-hidden group hover:border-emerald-500/50 transition-all flex flex-col justify-between backdrop-blur-md">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
            <div>
              <div className="flex justify-between items-center mb-3">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Image Storage</p>
                <span className="text-emerald-400 text-xs font-black bg-emerald-500/10 px-2 py-1 rounded-md">{metrics.storageUsed}</span>
              </div>
              <div className="w-full bg-black/50 h-2.5 rounded-full overflow-hidden mb-2 border border-white/5">
                <div className="bg-gradient-to-r from-emerald-500 to-green-400 h-full rounded-full" style={{ width: `${metrics.storagePercent}%` }}></div>
              </div>
            </div>
            <p className="text-slate-400 text-[11px] font-bold text-right flex items-center justify-end gap-1"><svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> {metrics.imageCompressions} Auto-Compressed</p>
          </div>

        </div>

        {/* --- ROW 2: LIVE TRAFFIC GRAPH & CONTROLS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 bg-white/[0.02] border border-white/10 p-6 md:p-8 rounded-[2.5rem] shadow-2xl backdrop-blur-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-white">App Engagement (Cook Mode)</h3>
              <span className="bg-orange-500/20 text-orange-400 px-4 py-1.5 rounded-full text-xs font-bold border border-orange-500/30 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping"></span> Live Tracking
              </span>
            </div>
            <div className="flex items-end gap-2 sm:gap-3 h-48 w-full">
              {graphData.map((val, i) => (
                <div key={i} className="flex-1 bg-gradient-to-t from-orange-600/80 to-yellow-400/80 rounded-t-md hover:from-orange-500 hover:to-yellow-300 transition-all duration-300 cursor-pointer group relative" style={{ height: `${val}%` }}>
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-xs font-black px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">{val}k</div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-slate-500 text-xs font-bold uppercase mt-5">
              <span>Breakfast (8 AM)</span><span>Lunch (1 PM)</span><span className="text-orange-400">Dinner (Now)</span>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/10 p-6 md:p-8 rounded-[2.5rem] shadow-2xl flex flex-col backdrop-blur-sm">
            <h3 className="text-xl font-black text-white mb-8">Zestly Core Controls</h3>
            <div className="space-y-6 flex-1">
              
              <div className="flex justify-between items-center group">
                <div>
                  <p className="text-white font-bold text-sm">Maintenance Mode</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">Lock app for recipe updates</p>
                </div>
                <div onClick={() => setMaintenanceMode(!maintenanceMode)} className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors duration-300 ${maintenanceMode ? 'bg-red-500' : 'bg-white/10 group-hover:bg-white/20'}`}>
                  <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${maintenanceMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
              </div>

              <div className="flex justify-between items-center group">
                <div>
                  <p className="text-white font-bold text-sm">Allow New Chefs</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">Open for public signups</p>
                </div>
                <div onClick={() => setAllowSignups(!allowSignups)} className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors duration-300 ${allowSignups ? 'bg-green-500' : 'bg-white/10 group-hover:bg-white/20'}`}>
                  <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${allowSignups ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
              </div>

              <div className="flex justify-between items-center group">
                <div>
                  <p className="text-white font-bold text-sm">AI Recipe Bot</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">Enable AI in Profile Tab</p>
                </div>
                <div onClick={() => setAiSuggestions(!aiSuggestions)} className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors duration-300 ${aiSuggestions ? 'bg-orange-500' : 'bg-white/10 group-hover:bg-white/20'}`}>
                  <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${aiSuggestions ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
              </div>
              
            </div>
          </div>
        </div>

        {/* --- ROW 3: USER MANAGEMENT & LOGS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* CHEF DATABASE */}
          <div className="bg-white/[0.02] border border-white/10 p-6 md:p-8 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h3 className="text-xl font-black text-white">Chef Database</h3>
              <div className="bg-black/50 border border-white/10 px-4 py-2.5 rounded-xl flex items-center focus-within:border-orange-500/50 transition-colors w-full sm:w-auto">
                <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <input type="text" placeholder="Search Chef..." className="bg-transparent border-none text-xs text-white outline-none w-full sm:w-32" />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 text-[10px] uppercase tracking-widest">
                    <th className="pb-4 font-bold">Chef Info</th>
                    <th className="pb-4 font-bold text-center">Recipes</th>
                    <th className="pb-4 font-bold text-center">Role</th>
                    <th className="pb-4 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-white/[0.03] transition-colors group">
                      <td className="py-4 pr-4">
                        <p className="text-white font-bold text-sm leading-tight flex items-center gap-2">
                          {user.name} 
                          {user.id === "U1" && <span className="bg-orange-500/20 text-orange-400 text-[9px] px-1.5 py-0.5 rounded uppercase">You</span>}
                        </p>
                        <p className="text-slate-500 text-[11px] mt-0.5">{user.email}</p>
                      </td>
                      <td className="py-4 text-center">
                        <span className="text-white font-black bg-white/5 px-3 py-1 rounded-lg">{user.recipesCount}</span>
                      </td>
                      <td className="py-4 text-center">
                        <span className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border ${user.role === 'Super Admin' ? 'bg-red-500/10 text-red-400 border-red-500/20' : user.role === 'Chef Pro' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-slate-500/10 text-slate-300 border-slate-500/20'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        {user.role !== "Super Admin" && (
                          <button onClick={() => toggleUserStatus(user.id)} className={`text-[11px] font-bold px-4 py-2 rounded-xl transition-all shadow-lg ${user.status === 'Active' ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20' : 'bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white border border-green-500/20'}`}>
                            {user.status === 'Active' ? 'Ban User' : 'Unban'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TERMINAL LOGS */}
          <div className="bg-[#0b0b0e] border border-white/10 p-6 md:p-8 rounded-[2.5rem] shadow-2xl flex flex-col font-mono relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4 relative z-10">
              <h3 className="text-sm font-bold text-slate-300 flex items-center gap-3">
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M4 12a8 8 0 018-8v8H4z"/></svg>
                Zestly Event Logs
              </h3>
              <button onClick={clearLogs} className="text-slate-400 hover:text-white text-xs font-bold bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors border border-white/5">Clear Logs</button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 max-h-80 relative z-10 custom-scrollbar">
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2">
                  <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 12H4M12 20V4"/></svg>
                  <p className="text-xs">Waiting for kitchen events...</p>
                </div>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="text-xs leading-relaxed flex items-start gap-3 bg-black/40 p-3 rounded-xl border border-white/5">
                    <span className="text-slate-600 shrink-0 font-bold">[{log.time}]</span>
                    <span className={`${log.type === 'danger' ? 'text-red-400' : log.type === 'warning' ? 'text-yellow-400' : log.type === 'success' ? 'text-green-400' : 'text-orange-400'} font-medium`}>
                      {log.action}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-slate-500 relative z-10">
              <span className="animate-pulse text-orange-500 font-black">_</span> Zestly Engine Running V2.0
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
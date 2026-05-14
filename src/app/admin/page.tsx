"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Zestly Specific Tracking Types
interface UserTrack {
  id: string;
  name: string;
  email: string;
  role: "User" | "Chef Pro" | "Admin";
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

  // --- 1. ZESTLY METRICS ---
  const [metrics] = useState({
    totalUsers: 1420,
    activeRecipes: 8432,
    activeCookSessions: 342, // Food app specific
    storageUsed: "12.4 GB",
    storageLimit: "50 GB",
    storagePercent: 24.8,
    imageCompressions: "14.2k", // Track image compression savings
    serverHealth: 99,
  });

  // --- 2. USER MANAGEMENT ---
  const [users, setUsers] = useState<UserTrack[]>([
    { id: "U1", name: "Nadeem (You)", email: "admin@zestly.com", role: "Admin", status: "Active", recipesCount: 156, lastActive: "Just now" },
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

  const toggleUserStatus = (id: string) => {
    if(id === "U1") { alert("Super Admin cannot be banned!"); return; }
    setUsers(users.map(u => u.id === id ? { ...u, status: u.status === "Active" ? "Banned" : "Active" } : u));
    setLogs([{ id: Date.now(), action: `Admin changed status for user ${id}.`, time: "Just now", type: "warning" }, ...logs]);
  };

  const clearLogs = () => setLogs([]);

  // Mocking Live Engagement Graph (Orange/Red theme)
  const graphData = [30, 45, 25, 60, 80, 50, 95, 70, 40, 85, 65, 100, 75, 90];

  return (
    <div className="min-h-screen bg-[#07070a] text-white font-sans p-4 md:p-8 relative overflow-x-hidden selection:bg-orange-500/30">
      
      {/* ZESTLY GLOW BACKGROUND */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-900/20 via-red-900/10 to-transparent pointer-events-none z-0"></div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10 pb-20">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <button onClick={() => router.push('/')} className="mb-4 text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl transition-all w-max">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              Back to Zestly App
            </button>
            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 tracking-tight">Zestly Admin</h2>
            <p className="text-orange-400 font-bold text-sm flex items-center gap-2 mt-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.8)]"></span> Live Command Center
            </p>
          </div>
          <div className="bg-black/50 border border-orange-500/30 px-5 py-3 rounded-xl backdrop-blur-md flex items-center gap-3 shadow-[0_0_20px_rgba(249,115,22,0.15)]">
             <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Server Health</span>
             <span className="text-green-400 font-black text-lg">{metrics.serverHealth}%</span>
          </div>
        </div>

        {/* --- ROW 1: TOP LEVEL METRICS (Cards) --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          
          <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-orange-500/20 p-5 rounded-3xl shadow-xl relative overflow-hidden group hover:border-orange-500/50 transition-all backdrop-blur-md">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all"></div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Total Foodies</p>
            <h3 className="text-3xl font-black text-white">{metrics.totalUsers.toLocaleString()}</h3>
            <p className="text-green-400 text-xs font-bold mt-2">↑ +124 this week</p>
          </div>

          <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-red-500/20 p-5 rounded-3xl shadow-xl relative overflow-hidden group hover:border-red-500/50 transition-all backdrop-blur-md">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all"></div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Recipes Stored</p>
            <h3 className="text-3xl font-black text-white">{metrics.activeRecipes.toLocaleString()}</h3>
            <p className="text-green-400 text-xs font-bold mt-2">↑ +430 this week</p>
          </div>

          <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-yellow-500/20 p-5 rounded-3xl shadow-xl relative overflow-hidden group hover:border-yellow-500/50 transition-all backdrop-blur-md">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl group-hover:bg-yellow-500/20 transition-all"></div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Live Cook Sessions</p>
            <h3 className="text-3xl font-black text-white flex items-center gap-2">
              {metrics.activeCookSessions} <span className="text-lg">👨‍🍳</span>
            </h3>
            <p className="text-orange-400 text-xs font-bold mt-2 animate-pulse">Dinner Rush Active</p>
          </div>

          <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-emerald-500/20 p-5 rounded-3xl shadow-xl relative overflow-hidden group hover:border-emerald-500/50 transition-all flex flex-col justify-between backdrop-blur-md">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Image Storage</p>
              <span className="text-emerald-400 text-xs font-black">{metrics.storageUsed}</span>
            </div>
            <div className="w-full bg-black h-2 rounded-full overflow-hidden mb-1">
              <div className="bg-gradient-to-r from-emerald-500 to-green-400 h-full rounded-full" style={{ width: `${metrics.storagePercent}%` }}></div>
            </div>
            <p className="text-slate-500 text-[10px] font-bold text-right">{metrics.imageCompressions} Auto-Compressed</p>
          </div>

        </div>

        {/* --- ROW 2: LIVE TRAFFIC GRAPH & CONTROLS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 bg-gradient-to-b from-white/[0.03] to-transparent border border-white/10 p-6 rounded-[2.5rem] shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-white">App Engagement (Cook Mode)</h3>
              <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-xs font-bold border border-orange-500/30">Live Tracking</span>
            </div>
            <div className="flex items-end gap-2 h-40 w-full">
              {graphData.map((val, i) => (
                <div key={i} className="flex-1 bg-gradient-to-t from-orange-600 to-yellow-400 rounded-t-sm hover:opacity-80 transition-opacity cursor-pointer group relative" style={{ height: `${val}%` }}>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">{val}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-slate-500 text-[10px] font-bold uppercase mt-4">
              <span>Breakfast (8 AM)</span><span>Lunch (1 PM)</span><span>Dinner (Now)</span>
            </div>
          </div>

          <div className="bg-gradient-to-b from-white/[0.03] to-transparent border border-white/10 p-6 rounded-[2.5rem] shadow-2xl flex flex-col">
            <h3 className="text-lg font-black text-white mb-6">Zestly Core Controls</h3>
            <div className="space-y-5 flex-1">
              
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white font-bold text-sm">Maintenance Mode</p>
                  <p className="text-slate-500 text-xs">Lock app for recipe updates</p>
                </div>
                <button onClick={() => setMaintenanceMode(!maintenanceMode)} className={`w-14 h-8 rounded-full transition-all flex items-center px-1 shadow-inner ${maintenanceMode ? 'bg-red-500' : 'bg-white/10'}`}>
                  <div className={`w-6 h-6 rounded-full bg-white transition-all transform ${maintenanceMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white font-bold text-sm">Allow New Chefs</p>
                  <p className="text-slate-500 text-xs">Open for public signups</p>
                </div>
                <button onClick={() => setAllowSignups(!allowSignups)} className={`w-14 h-8 rounded-full transition-all flex items-center px-1 shadow-inner ${allowSignups ? 'bg-green-500' : 'bg-white/10'}`}>
                  <div className={`w-6 h-6 rounded-full bg-white transition-all transform ${allowSignups ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white font-bold text-sm">AI Recipe Bot</p>
                  <p className="text-slate-500 text-xs">Enable AI in Profile Tab</p>
                </div>
                <button onClick={() => setAiSuggestions(!aiSuggestions)} className={`w-14 h-8 rounded-full transition-all flex items-center px-1 shadow-inner ${aiSuggestions ? 'bg-orange-500' : 'bg-white/10'}`}>
                  <div className={`w-6 h-6 rounded-full bg-white transition-all transform ${aiSuggestions ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>
              
            </div>
          </div>
        </div>

        {/* --- ROW 3: USER MANAGEMENT & LOGS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* USER DB */}
          <div className="bg-white/[0.02] border border-white/10 p-6 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-white">Chef Database</h3>
              <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg flex items-center">
                <input type="text" placeholder="Search Chef..." className="bg-transparent border-none text-xs text-white outline-none w-32" />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-500 text-[10px] uppercase tracking-wider">
                    <th className="pb-3 font-bold min-w-[150px]">Chef Info</th>
                    <th className="pb-3 font-bold text-center">Recipes</th>
                    <th className="pb-3 font-bold text-center">Role</th>
                    <th className="pb-3 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4">
                        <p className="text-white font-bold text-sm leading-tight">{user.name}</p>
                        <p className="text-slate-500 text-[10px]">{user.email}</p>
                      </td>
                      <td className="py-4 text-center">
                        <span className="text-white font-bold">{user.recipesCount}</span>
                      </td>
                      <td className="py-4 text-center">
                        <span className={`text-[9px] font-bold px-2 py-1 rounded-md border ${user.role === 'Admin' ? 'bg-red-500/10 text-red-400 border-red-500/20' : user.role === 'Chef Pro' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-slate-500/10 text-slate-300 border-slate-500/20'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        {user.role !== "Admin" && (
                          <button onClick={() => toggleUserStatus(user.id)} className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${user.status === 'Active' ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white'}`}>
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
          <div className="bg-[#0c0c10] border border-white/10 p-6 rounded-[2.5rem] shadow-2xl flex flex-col font-mono relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
              <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M4 12a8 8 0 018-8v8H4z"/></svg>
                Zestly Event Logs
              </h3>
              <button onClick={clearLogs} className="text-slate-500 hover:text-white text-[10px] font-bold bg-white/5 px-2 py-1 rounded transition-colors">Clear</button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 max-h-64">
              {logs.length === 0 ? (
                <p className="text-slate-600 text-xs">Waiting for kitchen events...</p>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="text-[11px] leading-relaxed flex items-start gap-3">
                    <span className="text-slate-600 shrink-0">[{log.time}]</span>
                    <span className={`${log.type === 'danger' ? 'text-red-400' : log.type === 'warning' ? 'text-yellow-400' : log.type === 'success' ? 'text-green-400' : 'text-orange-400'} font-bold`}>
                      {log.action}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-slate-500">
              <span className="animate-pulse text-orange-500">_</span> Zestly Engine Running...
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
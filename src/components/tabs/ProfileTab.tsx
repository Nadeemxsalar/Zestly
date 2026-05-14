"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function ProfileTab({ user }: { user: any }) {
  const router = useRouter();
  
  // --- FEATURE STATES (Working Toggles & Inputs) ---
  const [notifications, setNotifications] = useState(true);
  const [mealPlanAlerts, setMealPlanAlerts] = useState(false);
  const [isMetric, setIsMetric] = useState(true); // Metric (Kg/C) vs Imperial (Lbs/F)
  const [diet, setDiet] = useState("High Protein");
  const [theme, setTheme] = useState<"orange" | "green" | "blue">("orange");
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // --- AI CHAT STATES ---
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [aiMessage, setAiMessage] = useState(`Hi ${user?.user_metadata?.full_name?.split(" ")[0] || "Chef"}! What are we cooking today?`);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const getInitial = () => {
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return "C";
  };

  // Feature: Working AI Chat Simulation
  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput("");
    setAiMessage(userMsg);
    setIsTyping(true);
    
    setTimeout(() => {
      setIsTyping(false);
      setAiMessage(`I've noted your request about "${userMsg}". I recommend checking the Recipes tab for some magical ideas! ✨`);
    }, 1500);
  };

  // Feature: Cloud Backup Simulation
  const handleExportData = () => {
    setIsExporting(true);
    setExportSuccess(false);
    setTimeout(() => {
      setIsExporting(false);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    }, 2000);
  };

  // Theme Dictionary for Dynamic Styling
  const themeColors = {
    orange: { from: "from-orange-400", to: "to-red-600", text: "text-orange-400", bg: "bg-orange-500", glow: "shadow-orange-500/30" },
    green: { from: "from-green-400", to: "to-emerald-600", text: "text-green-400", bg: "bg-green-500", glow: "shadow-green-500/30" },
    blue: { from: "from-blue-400", to: "to-indigo-600", text: "text-blue-400", bg: "bg-blue-500", glow: "shadow-blue-500/30" }
  };
  const activeTheme = themeColors[theme];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6 pb-10 relative max-w-4xl mx-auto">
      {/* Background Glow matching Theme */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[400px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] ${activeTheme.from}/10 via-[#07070a]/0 to-transparent pointer-events-none -z-10 transition-colors duration-1000`}></div>

      {/* FEATURE 1: DYNAMIC USER PROFILE CARD */}
      <div className="bg-white/[0.02] border border-white/10 p-5 sm:p-8 rounded-[2rem] flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
        <div className={`absolute -right-10 -top-10 w-40 h-40 ${activeTheme.bg}/10 rounded-full blur-3xl pointer-events-none transition-colors duration-700`}></div>
        
        <div className="relative shrink-0 mt-2 sm:mt-0">
          <div className={`w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br ${activeTheme.from} ${activeTheme.to} rounded-[2rem] flex items-center justify-center text-4xl sm:text-5xl font-black text-white shadow-xl ${activeTheme.glow} ring-4 ring-white/5 transition-all duration-500`}>
            {getInitial()}
          </div>
          <div className="absolute -bottom-3 -right-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border-4 border-[#0b0b0e] shadow-lg">
            PRO
          </div>
        </div>
        
        <div className="text-center sm:text-left flex-1 w-full">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight break-all">{user?.user_metadata?.full_name || "Head Chef"}</h2>
          <p className="text-slate-400 text-xs sm:text-sm font-medium mt-1 break-all">{user?.email || "No email provided"}</p>
          
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-4">
            <span className={`bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${activeTheme.text}`}>
              ⭐ Level 12 Chef
            </span>
            <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Active
            </span>
          </div>
        </div>
      </div>

      {/* FEATURE 2: RESPONSIVE GAMIFICATION STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: "📖", title: "Saved", value: "48", color: "bg-blue-500/10 border-blue-500/20" },
          { icon: "🥫", title: "Pantry", value: "124", color: "bg-purple-500/10 border-purple-500/20" },
          { icon: "🔥", title: "Streak", value: "12 Days", color: "bg-orange-500/10 border-orange-500/20" },
          { icon: "💪", title: "Health", value: "94%", color: "bg-green-500/10 border-green-500/20" },
        ].map((stat, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/5 p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row items-center sm:items-start gap-3 hover:bg-white/[0.04] transition-all text-center sm:text-left">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border shrink-0 ${stat.color}`}>{stat.icon}</div>
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{stat.title}</p>
              <p className="text-white font-black text-lg sm:text-xl leading-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* FEATURE 3: INTERACTIVE AI CHEF BOT */}
      <div className="relative group rounded-[2rem] p-[1px] bg-gradient-to-br from-white/10 to-white/5 hover:from-white/20 transition-all duration-500">
        <div className="bg-[#0b0b0e] p-5 sm:p-6 rounded-[2rem] relative overflow-hidden">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${activeTheme.from} ${activeTheme.to} flex items-center justify-center text-lg shadow-lg`}>🤖</div>
            <div>
              <h3 className="text-base font-black text-white leading-tight">Zestly AI Chef</h3>
              <p className={`${activeTheme.text} text-[10px] font-bold`}>{isTyping ? "Typing..." : "Online & Ready"}</p>
            </div>
          </div>
          
          <div className="bg-black/40 border border-white/5 h-32 rounded-2xl p-4 mb-4 flex flex-col justify-end shadow-inner relative overflow-y-auto">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
            {isTyping ? (
               <div className="bg-white/10 text-white w-16 h-10 rounded-2xl rounded-bl-none self-start flex items-center justify-center gap-1 animate-in fade-in">
                 <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce"></span>
                 <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce delay-100"></span>
                 <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce delay-200"></span>
               </div>
            ) : (
              <div className={`bg-white/10 text-white text-sm px-4 py-3 rounded-2xl rounded-bl-none self-start max-w-[90%] sm:max-w-[80%] backdrop-blur-md border border-white/5 animate-in slide-in-from-bottom-2`}>
                {aiMessage}
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendChat()} placeholder="Ask AI... e.g., 'Substitute for eggs?'" className={`flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-${theme}-500/50 transition-colors placeholder:text-slate-600`} disabled={isTyping} />
            <button onClick={handleSendChat} disabled={isTyping || !chatInput.trim()} className={`${activeTheme.bg} hover:opacity-80 text-white px-5 rounded-xl font-bold transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed`}>
              <svg className="w-5 h-5 translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/></svg>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* LEFT COLUMN: SETTINGS */}
        <div className="bg-white/[0.02] border border-white/10 rounded-[2rem] overflow-hidden flex flex-col justify-start">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider pt-5 px-6 pb-2">App Preferences</h3>
          
          {/* FEATURE 4: THEME SELECTOR */}
          <div className="flex items-center justify-between p-4 px-6 border-b border-white/5">
            <div className="text-left">
              <p className="text-white font-medium text-sm">App Theme</p>
              <p className="text-slate-500 text-[10px]">Customize your kitchen color</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setTheme("orange")} className={`w-6 h-6 rounded-full bg-orange-500 border-2 ${theme === 'orange' ? 'border-white' : 'border-transparent'} transition-all hover:scale-110`}></button>
              <button onClick={() => setTheme("green")} className={`w-6 h-6 rounded-full bg-green-500 border-2 ${theme === 'green' ? 'border-white' : 'border-transparent'} transition-all hover:scale-110`}></button>
              <button onClick={() => setTheme("blue")} className={`w-6 h-6 rounded-full bg-blue-500 border-2 ${theme === 'blue' ? 'border-white' : 'border-transparent'} transition-all hover:scale-110`}></button>
            </div>
          </div>

          {/* FEATURE 5: DIETARY DROP-DOWN */}
          <div className="flex items-center justify-between p-4 px-6 border-b border-white/5">
            <div className="text-left">
              <p className="text-white font-medium text-sm">Dietary Focus</p>
              <p className="text-slate-500 text-[10px]">Filter your recommendations</p>
            </div>
            <select value={diet} onChange={(e) => setDiet(e.target.value)} className="bg-black/50 border border-white/10 text-white text-xs rounded-lg px-2 py-1 outline-none appearance-none text-center cursor-pointer">
              <option value="High Protein">High Protein</option>
              <option value="Vegan">Vegan</option>
              <option value="Keto">Keto</option>
              <option value="Balanced">Balanced</option>
            </select>
          </div>

          {/* FEATURE 6: MEASUREMENT UNIT TOGGLE */}
          <div className="flex items-center justify-between p-4 px-6">
            <div className="text-left">
              <p className="text-white font-medium text-sm">Measurement Units</p>
              <p className="text-slate-500 text-[10px]">{isMetric ? "Kilograms, Liters, Celcius" : "Lbs, Ounces, Fahrenheit"}</p>
            </div>
            <div onClick={() => setIsMetric(!isMetric)} className="flex items-center bg-black/50 border border-white/10 rounded-lg p-1 cursor-pointer">
              <span className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${isMetric ? 'bg-white/20 text-white' : 'text-slate-500'}`}>Metric</span>
              <span className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${!isMetric ? 'bg-white/20 text-white' : 'text-slate-500'}`}>Imperial</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: NOTIFICATIONS & DATA */}
        <div className="bg-white/[0.02] border border-white/10 rounded-[2rem] overflow-hidden flex flex-col justify-start">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider pt-5 px-6 pb-2">Alerts & Data</h3>
          
          {/* FEATURE 7: PUSH NOTIFICATIONS */}
          <div className="flex items-center justify-between p-4 px-6 border-b border-white/5">
             <div className="text-left">
                <p className="text-white font-medium text-sm">Push Notifications</p>
                <p className="text-slate-500 text-[10px]">Pantry expiry & daily tips</p>
              </div>
              <div onClick={() => setNotifications(!notifications)} className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ${notifications ? activeTheme.bg : 'bg-white/10'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${notifications ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </div>
          </div>

          {/* FEATURE 8: MEAL PLAN ALERTS */}
          <div className="flex items-center justify-between p-4 px-6 border-b border-white/5">
             <div className="text-left">
                <p className="text-white font-medium text-sm">Auto Meal Plans</p>
                <p className="text-slate-500 text-[10px]">AI weekly schedule</p>
              </div>
              <div onClick={() => setMealPlanAlerts(!mealPlanAlerts)} className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ${mealPlanAlerts ? activeTheme.bg : 'bg-white/10'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${mealPlanAlerts ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </div>
          </div>

          {/* FEATURE 9: DATA EXPORT */}
          <div className="p-4 px-6 pb-6 mt-auto">
            <button onClick={handleExportData} disabled={isExporting || exportSuccess} className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50">
              {isExporting ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Packing Data...</>
              ) : exportSuccess ? (
                <><span className="text-green-400">✓ Downloaded</span></>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg> Backup My Recipes</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* FEATURE 10: SECURE LOGOUT */}
      <button onClick={handleLogout} className="w-full bg-gradient-to-r from-red-500/10 to-rose-600/10 hover:from-red-500/20 hover:to-rose-600/20 border border-red-500/20 text-red-400 font-black py-4 sm:py-5 rounded-[1.5rem] transition-all flex items-center justify-center gap-2 group shadow-lg text-sm sm:text-base">
        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>
        Secure Log Out
      </button>

      {/* Version Tag */}
      <div className="text-center pb-4">
        <p className="text-slate-600 text-[10px] font-bold tracking-widest uppercase">Zestly Pro v2.5 • Developed by Nadeem</p>
      </div>
    </div>
  );
}
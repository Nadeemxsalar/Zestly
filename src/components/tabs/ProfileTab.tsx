"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function ProfileTab({ user }: { user: any }) {
  const router = useRouter();
  
  // --- FEATURE STATES ---
  const [notifications, setNotifications] = useState(true);
  const [mealPlanAlerts, setMealPlanAlerts] = useState(false);
  const [isMetric, setIsMetric] = useState(true); 
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

  // AI Chat Simulation
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

  // Cloud Backup Simulation
  const handleExportData = () => {
    setIsExporting(true);
    setExportSuccess(false);
    setTimeout(() => {
      setIsExporting(false);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    }, 2000);
  };

  // Dynamic Theme Colors (Light & Dark Support)
  const themeColors = {
    orange: { from: "from-orange-400", to: "to-red-500", text: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500", glow: "shadow-[0_8px_30px_#f973164d]", border: "border-orange-500" },
    green: { from: "from-green-400", to: "to-emerald-500", text: "text-green-600 dark:text-green-400", bg: "bg-green-500", glow: "shadow-[0_8px_30px_#22c55e4d]", border: "border-green-500" },
    blue: { from: "from-blue-400", to: "to-indigo-500", text: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500", glow: "shadow-[0_8px_30px_#3b82f64d]", border: "border-blue-500" }
  };
  const activeTheme = themeColors[theme];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6 pb-10 relative max-w-4xl mx-auto cursor-default selection:bg-orange-500/10">
      
      {/* 🚀 Dynamic Background Glow matching Theme */}
      <div className={`absolute top-[-100px] left-1/2 -translate-x-1/2 w-[150%] h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] ${activeTheme.from}/20 via-slate-50 dark:via-[#07070a]/0 to-transparent pointer-events-none -z-10 transition-colors duration-1000`}></div>

      {/* --- FEATURE 1: DYNAMIC USER PROFILE CARD --- */}
      <div className="bg-white dark:bg-[#0b0b0e] border border-slate-200 dark:border-white/10 p-5 sm:p-8 rounded-[2.5rem] flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-7 backdrop-blur-xl shadow-[0_8px_30px_#0000000d] dark:shadow-2xl relative overflow-hidden group transition-colors">
        <div className={`absolute -right-10 -top-10 w-40 h-40 ${activeTheme.bg}/10 rounded-full blur-3xl pointer-events-none transition-colors duration-700`}></div>
        
        <div className="relative shrink-0 mt-2 sm:mt-0">
          <div className={`w-24 h-24 sm:w-[110px] sm:h-[110px] bg-linear-to-br ${activeTheme.from} ${activeTheme.to} rounded-[2rem] flex items-center justify-center text-4xl sm:text-5xl font-black text-white shadow-xl ${activeTheme.glow} ring-4 ring-white dark:ring-[#0b0b0e] transition-all duration-500`}>
            {getInitial()}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-linear-to-r from-yellow-400 to-amber-500 text-black text-[10px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-xl border-4 border-white dark:border-[#0b0b0e] shadow-lg">
            PRO
          </div>
        </div>
        
        <div className="text-center sm:text-left flex-1 w-full">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight break-all leading-tight">{user?.user_metadata?.full_name || "Head Chef"}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-semibold mt-1 break-all">{user?.email || "No email provided"}</p>
          
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mt-5">
            <span className={`bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${activeTheme.text} transition-colors`}>
              ⭐ Level 12 Chef
            </span>
            <span className="bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400 border border-green-200 dark:border-green-500/20 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm dark:shadow-none">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Active
            </span>
          </div>
        </div>
      </div>

      {/* --- FEATURE 2: RESPONSIVE GAMIFICATION STATS --- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {[
          { icon: "📖", title: "Saved", value: "48", color: "bg-blue-50 border-blue-200 text-blue-500 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400" },
          { icon: "🥫", title: "Pantry", value: "124", color: "bg-purple-50 border-purple-200 text-purple-500 dark:bg-purple-500/10 dark:border-purple-500/20 dark:text-purple-400" },
          { icon: "🔥", title: "Streak", value: "12 Days", color: "bg-orange-50 border-orange-200 text-orange-500 dark:bg-orange-500/10 dark:border-orange-500/20 dark:text-orange-400" },
          { icon: "💪", title: "Health", value: "94%", color: "bg-green-50 border-green-200 text-green-500 dark:bg-green-500/10 dark:border-green-500/20 dark:text-green-400" },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-[#0b0b0e] border border-slate-200 dark:border-white/5 p-4 sm:p-5 rounded-[2rem] flex flex-col sm:flex-row items-center sm:items-start gap-3.5 hover:-translate-y-1 transition-all text-center sm:text-left shadow-[0_4px_15px_#00000008] dark:shadow-none">
            <div className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center text-2xl border shrink-0 ${stat.color} shadow-sm dark:shadow-none`}>{stat.icon}</div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">{stat.title}</p>
              <p className="text-slate-900 dark:text-white font-black text-lg sm:text-xl leading-tight mt-0.5">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* --- FEATURE 3: INTERACTIVE AI CHEF BOT --- */}
      <div className="relative group rounded-[2.5rem] p-[1px] bg-linear-to-br from-slate-200 to-slate-100 dark:from-white/10 dark:to-white/5 transition-all duration-500 shadow-[0_8px_30px_#0000000d] dark:shadow-2xl">
        <div className="bg-white dark:bg-[#0b0b0e] p-5 sm:p-7 rounded-[2.5rem] relative overflow-hidden transition-colors">
          <div className="flex items-center gap-3.5 mb-5">
            <div className={`w-11 h-11 rounded-[1.2rem] bg-linear-to-tr ${activeTheme.from} ${activeTheme.to} flex items-center justify-center text-xl shadow-lg transition-colors`}>🤖</div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Zestly AI Chef</h3>
              <p className={`${activeTheme.text} text-[10px] font-extrabold transition-colors`}>{isTyping ? "Typing..." : "Online & Ready"}</p>
            </div>
          </div>
          
          <div className="bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 h-36 rounded-[1.5rem] p-4 mb-5 flex flex-col justify-end shadow-inner dark:shadow-none relative overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {isTyping ? (
               <div className="bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white w-16 h-10 rounded-2xl rounded-bl-none self-start flex items-center justify-center gap-1.5 animate-in fade-in shadow-sm dark:shadow-none">
                 <span className="w-1.5 h-1.5 bg-slate-500 dark:bg-white/60 rounded-full animate-bounce"></span>
                 <span className="w-1.5 h-1.5 bg-slate-500 dark:bg-white/60 rounded-full animate-bounce delay-100"></span>
                 <span className="w-1.5 h-1.5 bg-slate-500 dark:bg-white/60 rounded-full animate-bounce delay-200"></span>
               </div>
            ) : (
              <div className={`bg-white dark:bg-white/10 text-slate-800 dark:text-white text-sm font-medium px-4 py-3 rounded-2xl rounded-bl-none self-start max-w-[90%] sm:max-w-[80%] backdrop-blur-md border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none animate-in slide-in-from-bottom-2`}>
                {aiMessage}
              </div>
            )}
          </div>
          
          <div className="flex gap-2.5">
            <input 
              type="text" 
              value={chatInput} 
              onChange={(e) => setChatInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleSendChat()} 
              placeholder="Ask AI... e.g., 'Substitute for eggs?'" 
              className={`flex-1 bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3.5 text-slate-900 dark:text-white text-sm font-medium outline-none focus:border-slate-400 dark:focus:border-white/20 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-inner dark:shadow-none`} 
              disabled={isTyping} 
            />
            <button 
              onClick={handleSendChat} 
              disabled={isTyping || !chatInput.trim()} 
              className={`${activeTheme.bg} hover:opacity-90 text-white px-5 rounded-2xl font-bold transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-md outline-none [-webkit-tap-highlight-color:transparent]`}
            >
              <svg className="w-5 h-5 translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/></svg>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        
        {/* --- LEFT COLUMN: SETTINGS --- */}
        <div className="bg-white dark:bg-[#0b0b0e] border border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col justify-start shadow-[0_8px_30px_#0000000d] dark:shadow-2xl transition-colors">
          <h3 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest pt-6 px-6 pb-2">App Preferences</h3>
          
          {/* THEME SELECTOR */}
          <div className="flex items-center justify-between p-4 px-6 border-b border-slate-100 dark:border-white/5">
            <div className="text-left">
              <p className="text-slate-900 dark:text-white font-bold text-sm">App Theme</p>
              <p className="text-slate-500 dark:text-slate-400 text-[10px] font-medium">Customize your kitchen color</p>
            </div>
            <div className="flex gap-2.5">
              <button onClick={() => setTheme("orange")} className={`w-7 h-7 rounded-full bg-orange-500 border-2 ${theme === 'orange' ? 'border-slate-900 dark:border-white scale-110 shadow-md' : 'border-transparent'} transition-all cursor-pointer outline-none [-webkit-tap-highlight-color:transparent]`}></button>
              <button onClick={() => setTheme("green")} className={`w-7 h-7 rounded-full bg-green-500 border-2 ${theme === 'green' ? 'border-slate-900 dark:border-white scale-110 shadow-md' : 'border-transparent'} transition-all cursor-pointer outline-none [-webkit-tap-highlight-color:transparent]`}></button>
              <button onClick={() => setTheme("blue")} className={`w-7 h-7 rounded-full bg-blue-500 border-2 ${theme === 'blue' ? 'border-slate-900 dark:border-white scale-110 shadow-md' : 'border-transparent'} transition-all cursor-pointer outline-none [-webkit-tap-highlight-color:transparent]`}></button>
            </div>
          </div>

          {/* DIETARY DROP-DOWN */}
          <div className="flex items-center justify-between p-4 px-6 border-b border-slate-100 dark:border-white/5">
            <div className="text-left">
              <p className="text-slate-900 dark:text-white font-bold text-sm">Dietary Focus</p>
              <p className="text-slate-500 dark:text-slate-400 text-[10px] font-medium">Filter recommendations</p>
            </div>
            <div className="relative">
              <select value={diet} onChange={(e) => setDiet(e.target.value)} className="bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white font-bold text-xs rounded-xl pl-3 pr-8 py-2 outline-none appearance-none text-center cursor-pointer shadow-sm dark:shadow-none outline-none [-webkit-tap-highlight-color:transparent]">
                <option value="High Protein" className="bg-white dark:bg-[#0b0b0e]">High Protein</option>
                <option value="Vegan" className="bg-white dark:bg-[#0b0b0e]">Vegan</option>
                <option value="Keto" className="bg-white dark:bg-[#0b0b0e]">Keto</option>
                <option value="Balanced" className="bg-white dark:bg-[#0b0b0e]">Balanced</option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          {/* MEASUREMENT UNIT TOGGLE */}
          <div className="flex items-center justify-between p-4 px-6 pb-6">
            <div className="text-left">
              <p className="text-slate-900 dark:text-white font-bold text-sm">Measurement Units</p>
              <p className="text-slate-500 dark:text-slate-400 text-[10px] font-medium">{isMetric ? "Kg, Liters, Celcius" : "Lbs, Ounces, Fahrenheit"}</p>
            </div>
            <div onClick={() => setIsMetric(!isMetric)} className="flex items-center bg-slate-100 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl p-1 cursor-pointer shadow-inner dark:shadow-none outline-none [-webkit-tap-highlight-color:transparent]">
              <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${isMetric ? 'bg-white dark:bg-white/20 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-500'}`}>Metric</span>
              <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${!isMetric ? 'bg-white dark:bg-white/20 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-500'}`}>Imperial</span>
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: ALERTS & DATA --- */}
        <div className="bg-white dark:bg-[#0b0b0e] border border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col justify-start shadow-[0_8px_30px_#0000000d] dark:shadow-2xl transition-colors">
          <h3 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest pt-6 px-6 pb-2">Alerts & Data</h3>
          
          {/* PUSH NOTIFICATIONS */}
          <div className="flex items-center justify-between p-4 px-6 border-b border-slate-100 dark:border-white/5">
             <div className="text-left">
                <p className="text-slate-900 dark:text-white font-bold text-sm">Push Notifications</p>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-medium">Pantry expiry & daily tips</p>
              </div>
              <div onClick={() => setNotifications(!notifications)} className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors duration-300 outline-none [-webkit-tap-highlight-color:transparent] shadow-inner ${notifications ? activeTheme.bg : 'bg-slate-300 dark:bg-white/10'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${notifications ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </div>
          </div>

          {/* MEAL PLAN ALERTS */}
          <div className="flex items-center justify-between p-4 px-6 border-b border-slate-100 dark:border-white/5">
             <div className="text-left">
                <p className="text-slate-900 dark:text-white font-bold text-sm">Auto Meal Plans</p>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-medium">AI weekly schedule</p>
              </div>
              <div onClick={() => setMealPlanAlerts(!mealPlanAlerts)} className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors duration-300 outline-none [-webkit-tap-highlight-color:transparent] shadow-inner ${mealPlanAlerts ? activeTheme.bg : 'bg-slate-300 dark:bg-white/10'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${mealPlanAlerts ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </div>
          </div>

          {/* DATA EXPORT */}
          <div className="p-4 px-6 pb-6 mt-auto">
            <button onClick={handleExportData} disabled={isExporting || exportSuccess} className="w-full bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white font-extrabold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 shadow-sm dark:shadow-none outline-none [-webkit-tap-highlight-color:transparent] cursor-pointer active:scale-95">
              {isExporting ? (
                <><span className="w-4 h-4 border-2 border-slate-400 dark:border-white border-t-transparent rounded-full animate-spin"></span> Packing Data...</>
              ) : exportSuccess ? (
                <><span className="text-green-500 dark:text-green-400">✓ Downloaded</span></>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg> Backup My Recipes</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* --- FEATURE 10: SECURE LOGOUT --- */}
      <button onClick={handleLogout} className="w-full bg-linear-to-r from-red-50 to-rose-50 dark:from-red-500/10 dark:to-rose-600/10 hover:from-red-100 hover:to-rose-100 dark:hover:from-red-500/20 dark:hover:to-rose-600/20 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 font-black py-4 sm:py-5 rounded-[1.5rem] transition-all flex items-center justify-center gap-2 group shadow-sm dark:shadow-lg text-sm sm:text-base outline-none [-webkit-tap-highlight-color:transparent] cursor-pointer active:scale-95">
        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>
        Secure Log Out
      </button>

      {/* Version Tag */}
      <div className="text-center pb-6">
        <p className="text-slate-500 dark:text-slate-600 text-[10px] font-extrabold tracking-widest uppercase">Zestly Pro v2.5 • Developed by Nadeem</p>
      </div>
    </div>
  );
}
"use client";

export default function HomeTab() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6 pb-10 relative max-w-full overflow-x-hidden sm:overflow-visible">
      
      {/* Background Mesh Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/10 via-[#07070a]/0 to-transparent pointer-events-none -z-10"></div>

      {/* --- WELCOME HEADER --- */}
      <div className="flex justify-between items-end px-1">
        <div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500 tracking-tight mb-1">
            Home
          </h2>
          <p className="text-blue-400 font-bold text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0"></span>
            Welcome to your smart kitchen!
          </p>
        </div>
      </div>

      {/* --- QUICK ACTION WIDGETS --- */}
      <div className="grid grid-cols-2 gap-3">
        {/* Pantry Widget */}
        <div className="bg-gradient-to-br from-orange-500/20 to-red-500/5 ring-1 ring-orange-500/30 p-4 rounded-3xl backdrop-blur-xl relative overflow-hidden group cursor-pointer transition-all hover:scale-[1.02]">
          <div className="absolute -right-4 -bottom-4 text-6xl opacity-20 group-hover:scale-110 transition-transform">🥫</div>
          <h3 className="text-orange-300 text-xs font-bold uppercase tracking-wider mb-1">Your Pantry</h3>
          <p className="text-lg font-black text-white leading-tight">Stocked & Ready</p>
        </div>
        
        {/* Cookbook Widget */}
        <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/5 ring-1 ring-indigo-500/30 p-4 rounded-3xl backdrop-blur-xl relative overflow-hidden group cursor-pointer transition-all hover:scale-[1.02]">
          <div className="absolute -right-4 -bottom-4 text-6xl opacity-20 group-hover:scale-110 transition-transform">📖</div>
          <h3 className="text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">Cookbook</h3>
          <p className="text-lg font-black text-white leading-tight">Premium Recipes</p>
        </div>
      </div>

      {/* --- GLOBAL KITCHEN FEED --- */}
      <div className="mt-8">
        <div className="flex justify-between items-end mb-4 px-1">
          <h3 className="text-xl font-black text-white">🔥 Trending in Zestly</h3>
          <span className="text-xs text-blue-400 font-bold cursor-pointer hover:text-white transition-colors">See All</span>
        </div>
        
        <div className="space-y-3">
          {/* Mock Recipe 1 */}
          <div className="group w-full relative bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-3xl p-4 backdrop-blur-sm transition-all duration-300 hover:shadow-xl flex items-center justify-between gap-4 cursor-pointer">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 bg-gradient-to-br from-orange-500/20 to-transparent rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-inner ring-1 ring-orange-500/20">
                🍗
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-orange-400 font-bold mb-0.5 truncate">Chef Nadeem</p>
                <h4 className="text-white font-black tracking-tight truncate text-sm sm:text-base">Butter Chicken Ultra</h4>
                <p className="text-slate-400 text-[10px] sm:text-xs font-medium truncate mt-0.5">❤️ 245 Likes • Non-Veg</p>
              </div>
            </div>
            <button className="bg-white/5 hover:bg-white/10 text-white text-xs font-bold py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl transition-all border border-white/10 shrink-0">Save</button>
          </div>

          {/* Mock Recipe 2 */}
          <div className="group w-full relative bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-3xl p-4 backdrop-blur-sm transition-all duration-300 hover:shadow-xl flex items-center justify-between gap-4 cursor-pointer">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 bg-gradient-to-br from-green-500/20 to-transparent rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-inner ring-1 ring-green-500/20">
                🥗
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-green-400 font-bold mb-0.5 truncate">Chef Rahul</p>
                <h4 className="text-white font-black tracking-tight truncate text-sm sm:text-base">Healthy Quinoa Salad</h4>
                <p className="text-slate-400 text-[10px] sm:text-xs font-medium truncate mt-0.5">❤️ 120 Likes • Veg</p>
              </div>
            </div>
            <button className="bg-white/5 hover:bg-white/10 text-white text-xs font-bold py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl transition-all border border-white/10 shrink-0">Save</button>
          </div>
        </div>
      </div>

    </div>
  );
}
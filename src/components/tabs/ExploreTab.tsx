export default function ExploreTab() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-[2rem] mb-6 shadow-lg shadow-purple-500/20 text-white">
        <h2 className="text-2xl font-black mb-1">🌍 Global Kitchen</h2>
        <p className="text-white/80 text-sm font-medium">Discover recipes from the Zestly community.</p>
      </div>
      
      {/* Mock Global Feed */}
      <div className="bg-white/[0.03] border border-white/10 p-5 rounded-3xl mb-4 flex justify-between items-center hover:bg-white/[0.05] transition-all cursor-pointer">
        <div>
          <p className="text-xs text-orange-400 font-bold mb-1">Chef Nadeem</p>
          <h3 className="text-lg font-bold text-white">Butter Chicken Ultra</h3>
          <p className="text-xs text-slate-400 mt-1">❤️ 245 Likes • Non-Veg</p>
        </div>
        <button className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all">Save</button>
      </div>

      <div className="bg-white/[0.03] border border-white/10 p-5 rounded-3xl mb-4 flex justify-between items-center hover:bg-white/[0.05] transition-all cursor-pointer">
        <div>
          <p className="text-xs text-green-400 font-bold mb-1">Chef Rahul</p>
          <h3 className="text-lg font-bold text-white">Healthy Quinoa Salad</h3>
          <p className="text-xs text-slate-400 mt-1">❤️ 120 Likes • Veg</p>
        </div>
        <button className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all">Save</button>
      </div>
    </div>
  );
}
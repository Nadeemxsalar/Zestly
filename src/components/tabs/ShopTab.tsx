export default function ShopTab() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="bg-white/[0.03] border border-white/10 p-6 rounded-[2rem]">
        <div className="flex justify-between text-sm font-bold mb-3">
          <span className="text-slate-400">Est. Cost: <span className="text-white">₹0</span></span>
          <span className="text-slate-400">Budget: <span className="text-orange-400">₹2000</span></span>
        </div>
        <div className="w-full bg-black/50 h-3 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-green-400 to-green-500 w-[10%] h-full rounded-full"></div>
        </div>
      </div>
      
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['Milk', 'Bread', 'Eggs', 'Onion', 'Tomato'].map(item => (
          <button key={item} className="whitespace-nowrap bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-all">+ {item}</button>
        ))}
      </div>
      
      <div className="flex gap-3">
        <input type="text" placeholder="Add to list..." className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-white text-sm outline-none focus:border-orange-500/50" />
        <button className="bg-orange-500 text-white px-5 rounded-2xl font-bold hover:bg-orange-400 transition-all">+</button>
      </div>

      <div className="bg-white/[0.03] border border-white/10 p-6 rounded-[2rem] text-center">
        <p className="text-slate-400 text-sm">Your shopping list is empty.</p>
      </div>
    </div>
  );
}
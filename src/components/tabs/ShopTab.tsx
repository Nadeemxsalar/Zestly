"use client";
import { useState } from "react";

interface ShopItem {
  id: string;
  name: string;
  checked: boolean;
  estCost: number;
}

export default function ShopTab() {
  const [items, setItems] = useState<ShopItem[]>([
    { id: '1', name: "Almond Milk", checked: false, estCost: 250 },
    { id: '2', name: "Brown Bread", checked: true, estCost: 50 },
  ]);
  const [newItemName, setNewItemName] = useState("");
  const budget = 2000;

  const totalCost = items.reduce((sum, item) => sum + item.estCost, 0);
  const budgetPercentage = Math.min((totalCost / budget) * 100, 100);

  // Dynamic color for budget bar
  const progressColor = 
    budgetPercentage < 50 ? "from-green-400 to-emerald-500" :
    budgetPercentage < 85 ? "from-yellow-400 to-orange-500" : 
    "from-orange-500 to-red-500";

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    
    setItems([{
      id: Date.now().toString(),
      name: newItemName,
      checked: false,
      estCost: Math.floor(Math.random() * 100) + 20 // Mock cost
    }, ...items]);
    setNewItemName("");
  };

  const toggleCheck = (id: string) => {
    setItems(items.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const addQuickItem = (name: string) => {
    if (items.some(i => i.name.toLowerCase() === name.toLowerCase())) return;
    setItems([{
      id: Date.now().toString(),
      name: name,
      checked: false,
      estCost: Math.floor(Math.random() * 80) + 20
    }, ...items]);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6 pb-10 relative max-w-full overflow-x-hidden sm:overflow-visible cursor-default selection:bg-orange-500/10">
      
      {/* 🚀 Premium Background Glow */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[150%] h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/60 via-slate-50 to-transparent dark:from-blue-500/10 dark:via-[#07070a]/0 dark:to-transparent pointer-events-none -z-10 transition-colors duration-500"></div>

      {/* --- HEADER --- */}
      <div className="flex justify-between items-end px-1 pt-2">
        <div>
          <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tighter mb-1.5 transition-colors">Shopping</h2>
          <p className="text-blue-500 font-bold text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0 shadow-[0_0_8px_#3b82f666]"></span>
            {items.length} Items remaining
          </p>
        </div>
      </div>

      {/* --- BUDGET TRACKER CARD --- */}
      <div className="bg-white dark:bg-[#0b0b0e] border border-slate-200 dark:border-white/10 p-5 sm:p-6 rounded-[2rem] shadow-[0_8px_30px_#0000000d] dark:shadow-2xl transition-all">
        <div className="flex justify-between text-sm font-black mb-4">
          <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider">Est. Cost: <span className="text-slate-900 dark:text-white text-base ml-1">₹{totalCost}</span></span>
          <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider">Budget: <span className="text-orange-500 dark:text-orange-400 text-base ml-1">₹{budget}</span></span>
        </div>
        
        <div className="w-full bg-slate-100 dark:bg-black/50 h-3.5 rounded-full overflow-hidden shadow-inner border border-slate-200 dark:border-white/5">
          <div 
            className={`bg-linear-to-r ${progressColor} h-full rounded-full transition-all duration-1000 ease-out`}
            style={{ width: `${budgetPercentage}%` }}
          ></div>
        </div>
        <p className="text-right text-[10px] font-bold text-slate-400 mt-2">{Math.floor(budgetPercentage)}% Used</p>
      </div>
      
      {/* --- QUICK ADD PILLS (Invisible Scrollbar) --- */}
      <div className="px-1">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-widest">Quick Add</h3>
        <div className="flex gap-2.5 overflow-x-auto pb-2.5 -mx-1 px-1 scrollbar-hide snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {['Milk 🥛', 'Bread 🍞', 'Eggs 🥚', 'Onion 🧅', 'Tomato 🍅', 'Chicken 🍗'].map(item => (
            <button 
              key={item} 
              onClick={() => addQuickItem(item.split(' ')[0])}
              className="snap-start whitespace-nowrap bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-2.5 rounded-full text-xs font-extrabold text-slate-700 dark:text-slate-300 hover:text-orange-500 dark:hover:text-white hover:border-orange-200 dark:hover:bg-white/10 transition-all shadow-[0_4px_10px_#0000000a] dark:shadow-none active:scale-95 outline-none [-webkit-tap-highlight-color:transparent]"
            >
              + {item}
            </button>
          ))}
        </div>
      </div>
      
      {/* --- INPUT BAR --- */}
      <div className="relative group z-20 w-full px-1">
        <div className="absolute -inset-0.5 bg-linear-to-r from-blue-400 to-purple-400 rounded-[1.5rem] blur-lg opacity-0 dark:opacity-20 group-focus-within:opacity-20 dark:group-focus-within:opacity-50 transition duration-500"></div>
        <form onSubmit={handleAddItem} className="relative bg-white dark:bg-[#0c0c10] border border-slate-200 dark:border-white/10 p-2 rounded-[1.5rem] flex items-center shadow-[0_8px_30px_#0000000d] dark:shadow-2xl transition-all focus-within:border-blue-500/40 w-full">
          
          <input 
            type="text" 
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Add to list..." 
            className="flex-1 bg-transparent text-slate-900 dark:text-white font-semibold px-4 py-2 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm cursor-text"
          />
          <button 
            type="submit"
            disabled={!newItemName.trim()}
            className="shrink-0 bg-blue-500 text-white w-10 h-10 flex items-center justify-center rounded-xl font-black hover:bg-blue-600 transition-all active:scale-95 shadow-[0_4px_15px_#3b82f64d] disabled:opacity-50 disabled:cursor-not-allowed outline-none [-webkit-tap-highlight-color:transparent]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          </button>
        </form>
      </div>

      {/* --- SHOPPING LIST RENDERER --- */}
      <div className="px-1 mt-6">
        {items.length === 0 ? (
          <div className="bg-white dark:bg-[#0b0b0e] border-2 border-dashed border-slate-200 dark:border-white/10 p-10 rounded-[2.5rem] text-center shadow-sm dark:shadow-none transition-colors">
            <span className="text-5xl block mb-4 opacity-50">🛒</span>
            <h3 className="text-slate-900 dark:text-white font-black text-lg mb-1">List is Empty</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Add ingredients for your next cooking session.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <div 
                key={item.id} 
                className={`group flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${item.checked ? 'bg-slate-50 dark:bg-white/[0.01] border-slate-100 dark:border-white/5 opacity-60' : 'bg-white dark:bg-white/[0.03] border-slate-200 dark:border-white/10 shadow-[0_4px_15px_#0000000a] dark:shadow-sm hover:border-slate-300 dark:hover:border-white/20'}`}
              >
                <div className="flex items-center gap-4 overflow-hidden">
                  <button 
                    onClick={() => toggleCheck(item.id)}
                    className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center border-2 transition-all outline-none [-webkit-tap-highlight-color:transparent] cursor-pointer active:scale-90 ${item.checked ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-300 dark:border-slate-500 hover:border-blue-400 text-transparent'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  </button>
                  <span className={`font-bold text-sm sm:text-base transition-all truncate ${item.checked ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-white'}`}>
                    {item.name}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 shrink-0 pl-2">
                  <span className="text-xs font-extrabold text-slate-400 bg-slate-100 dark:bg-black/40 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/5">
                    ₹{item.estCost}
                  </span>
                  <button 
                    onClick={() => deleteItem(item.id)}
                    className="text-slate-400 hover:text-red-500 bg-slate-50 dark:bg-transparent hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-lg transition-colors cursor-pointer outline-none [-webkit-tap-highlight-color:transparent] opacity-100 sm:opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
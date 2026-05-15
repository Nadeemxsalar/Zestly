"use client";
import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/lib/supabase"; 

interface PantryTabProps {
  user?: any;
}

interface PantryItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  category: string;
  expiryDate: string;
  pricePerUnit: number;
}

const analyzeItem = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.match(/milk|cheese|butter|paneer|egg|yogurt|curd/)) return { cat: "Dairy", emoji: "🧀" };
  if (lower.match(/chicken|meat|fish|mutton|beef|pork/)) return { cat: "Meat", emoji: "🥩" };
  if (lower.match(/apple|banana|orange|fruit/)) return { cat: "Fruits", emoji: "🍎" };
  if (lower.match(/tomato|onion|potato|spinach|veg|carrot/)) return { cat: "Veggies", emoji: "🥦" };
  if (lower.match(/bread|bun|cake|flour|rice|pasta|oats/)) return { cat: "Grains", emoji: "🌾" };
  return { cat: "Staples", emoji: "🥫" };
};

export default function PantryTab({ user }: PantryTabProps) {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [isLoadingDB, setIsLoadingDB] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  const [newItemName, setNewItemName] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("Kg");
  
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [filter, setFilter] = useState<"all" | "urgent" | "low">("all");

  useEffect(() => {
    fetchPantryItems();
  }, []);

  const fetchPantryItems = async () => {
    const { data, error } = await supabase
      .from("pantry")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      const formattedItems: PantryItem[] = data.map(dbItem => ({
        id: dbItem.id,
        name: dbItem.name,
        qty: dbItem.qty || 1,
        unit: dbItem.unit || "Kg",
        category: dbItem.category || "Staples",
        expiryDate: dbItem.expiry_date || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        pricePerUnit: dbItem.price_per_unit || 100
      }));
      setItems(formattedItems);
    }
    setIsLoadingDB(false);
  };

  const seedDefaultItems = async () => {
    setIsSeeding(true);
    const defaultData = [
      { name: "Almond Milk", qty: 2, unit: "Liters", category: "Dairy", expiry_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0], price_per_unit: 250 },
      { name: "Brown Bread", qty: 0.5, unit: "Pack", category: "Grains", expiry_date: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0], price_per_unit: 50 },
      { name: "Chicken Breast", qty: 500, unit: "g", category: "Meat", expiry_date: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0], price_per_unit: 0.4 },
    ];

    const { data, error } = await supabase.from("pantry").insert(defaultData).select();
    
    if (!error && data) {
      const newItems = data.map(dbItem => ({
        id: dbItem.id,
        name: dbItem.name,
        qty: dbItem.qty,
        unit: dbItem.unit,
        category: dbItem.category,
        expiryDate: dbItem.expiry_date,
        pricePerUnit: dbItem.price_per_unit
      }));
      setItems([...newItems, ...items]);
    }
    setIsSeeding(false);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName) return;
    
    const { cat } = analyzeItem(newItemName);
    const newExpiryDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    
    const newItemData = {
      name: newItemName,
      qty: 1,
      unit: newItemUnit,
      category: cat,
      expiry_date: newExpiryDate,
      price_per_unit: 100 
    };

    const { data, error } = await supabase.from("pantry").insert([newItemData]).select();

    if (!error && data) {
      const dbItem = data[0];
      setItems([{
        id: dbItem.id,
        name: dbItem.name,
        qty: dbItem.qty,
        unit: dbItem.unit,
        category: dbItem.category,
        expiryDate: dbItem.expiry_date,
        pricePerUnit: dbItem.price_per_unit
      }, ...items]);
    }
    setNewItemName("");
  };

  const handleUpdateQty = async (id: string, delta: number) => {
    const itemToUpdate = items.find(i => i.id === id);
    if (!itemToUpdate) return;

    const newQty = Math.max(0, parseFloat((itemToUpdate.qty + delta).toFixed(2)));

    if (newQty <= 0) {
      setItems(items.filter(i => i.id !== id)); 
      await supabase.from("pantry").delete().eq("id", id); 
    } else {
      setItems(items.map(i => i.id === id ? { ...i, qty: newQty } : i));
      await supabase.from("pantry").update({ qty: newQty }).eq("id", id);
    }
  };

  const getDaysLeft = (dateStr: string) => Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (86400000));

  const stats = useMemo(() => {
    const totalValue = items.reduce((acc, item) => acc + (item.qty * item.pricePerUnit), 0);
    const urgent = items.filter(i => getDaysLeft(i.expiryDate) <= 3).length;
    const lowStock = items.filter(i => (i.unit === 'Kg' || i.unit === 'Liters') ? i.qty < 1 : i.qty < 2).length;
    return { totalValue, urgent, lowStock };
  }, [items]);

  const filteredItems = items.filter(item => {
    if (filter === "urgent") return getDaysLeft(item.expiryDate) <= 3;
    if (filter === "low") return (item.unit === 'Kg' || item.unit === 'Liters') ? item.qty < 1 : item.qty < 2;
    return true;
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6 pb-10 relative max-w-full overflow-x-hidden sm:overflow-visible cursor-default selection:bg-orange-500/10">
      
      {/* 🚀 Premium Glow Background */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[150%] h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-100/60 via-slate-50 to-transparent dark:from-orange-500/10 dark:via-[#07070a]/0 dark:to-transparent pointer-events-none -z-10 transition-colors duration-500"></div>

      {/* --- HEADER INSIGHTS --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end px-1 gap-4 sm:gap-0 pt-2">
        <div>
          <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tighter mb-1.5 transition-colors">My Pantry</h2>
          <p className="text-orange-500 font-bold text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shrink-0 shadow-[0_0_8px_#f9731666]"></span>
            {isLoadingDB ? "Syncing Cloud..." : `Total Worth: ₹${stats.totalValue.toLocaleString()}`}
          </p>
        </div>
        
        {/* Grid/List Toggle */}
        <div className="flex bg-white dark:bg-white/5 p-1.5 rounded-[1rem] border border-slate-200 dark:border-white/10 shadow-[0_4px_15px_#0000000d] dark:shadow-none self-end sm:self-auto transition-colors">
          <button onClick={() => setViewMode("list")} className={`p-2 rounded-xl transition-all outline-none [-webkit-tap-highlight-color:transparent] ${viewMode === "list" ? "bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm" : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white"}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <button onClick={() => setViewMode("grid")} className={`p-2 rounded-xl transition-all outline-none [-webkit-tap-highlight-color:transparent] ${viewMode === "grid" ? "bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm" : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white"}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
          </button>
        </div>
      </div>

      {/* --- SMART WIDGETS ROW --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* AI Recipe Matcher */}
        <div className="bg-linear-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/5 border border-indigo-200 dark:border-indigo-500/20 p-5 rounded-[2rem] backdrop-blur-xl relative overflow-hidden group shadow-sm dark:shadow-none transition-colors">
          <div className="absolute -right-4 -bottom-4 text-6xl opacity-30 dark:opacity-20 group-hover:scale-110 transition-transform duration-500">🍳</div>
          <h3 className="text-indigo-600 dark:text-indigo-300 text-xs font-black uppercase tracking-widest mb-1.5">AI Kitchen</h3>
          <p className="text-3xl font-black text-slate-900 dark:text-white leading-tight">{Math.floor(items.length * 1.5)} <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Recipes</span></p>
          <button className="mt-3 text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-3.5 py-2 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-500/30 transition-colors outline-none [-webkit-tap-highlight-color:transparent]">View Matches →</button>
        </div>

        {/* Nutritional Scanner */}
        <div className="bg-linear-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/5 border border-emerald-200 dark:border-emerald-500/20 p-5 rounded-[2rem] backdrop-blur-xl relative overflow-hidden group shadow-sm dark:shadow-none transition-colors">
          <div className="absolute -right-4 -bottom-4 text-6xl opacity-30 dark:opacity-20 group-hover:scale-110 transition-transform duration-500">🥑</div>
          <h3 className="text-emerald-600 dark:text-emerald-300 text-xs font-black uppercase tracking-widest mb-1.5">Pantry Vibe</h3>
          <p className="text-xl font-black text-slate-900 dark:text-white leading-tight">High Protein</p>
          <div className="flex gap-1.5 mt-4">
             <div className="h-2 flex-1 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b98166]"></div>
             <div className="h-2 w-1/4 bg-slate-200 dark:bg-slate-600 rounded-full"></div>
             <div className="h-2 w-1/4 bg-slate-200 dark:bg-slate-600 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* --- PRO INPUT BAR --- */}
      <div className="relative group z-20 w-full">
        <div className="absolute -inset-0.5 bg-linear-to-r from-orange-400 to-rose-400 rounded-[2.2rem] blur-lg opacity-0 dark:opacity-20 group-focus-within:opacity-20 dark:group-focus-within:opacity-50 transition duration-500"></div>
        <form onSubmit={handleAddItem} className="relative bg-white dark:bg-black/60 backdrop-blur-2xl border border-slate-200 dark:border-white/10 p-2 sm:p-2 rounded-[2rem] flex items-center shadow-[0_8px_30px_#0000000d] dark:shadow-2xl w-full transition-all focus-within:border-orange-500/40">
          
          <div className="pl-4 pr-2 text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>
          </div>
          
          <input 
            type="text" 
            value={newItemName} onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Add pantry item..." 
            className="flex-1 min-w-[80px] w-full bg-transparent text-slate-900 dark:text-white font-semibold px-2 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm sm:text-base cursor-text"
          />
          <div className="relative shrink-0 mr-2">
            <select value={newItemUnit} onChange={(e) => setNewItemUnit(e.target.value)} className="bg-slate-100 dark:bg-white/5 text-orange-600 dark:text-orange-400 font-extrabold rounded-[1rem] pl-3 pr-7 py-2.5 sm:py-3 outline-none appearance-none min-w-[50px] sm:min-w-[60px] text-xs sm:text-sm cursor-pointer outline-none [-webkit-tap-highlight-color:transparent]">
              <option className="bg-white dark:bg-black text-slate-900 dark:text-white">Kg</option>
              <option className="bg-white dark:bg-black text-slate-900 dark:text-white">g</option>
              <option className="bg-white dark:bg-black text-slate-900 dark:text-white">L</option>
              <option className="bg-white dark:bg-black text-slate-900 dark:text-white">Pcs</option>
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-orange-500 dark:text-orange-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          <button type="submit" disabled={!newItemName} className="shrink-0 bg-linear-to-br from-orange-400 to-red-500 text-white font-black p-3.5 sm:p-4 rounded-[1.2rem] sm:rounded-[1.5rem] shadow-[0_4px_15px_#f973164d] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed outline-none [-webkit-tap-highlight-color:transparent]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
          </button>
        </form>
      </div>

      {/* 🚀 SMART FILTER CHIPS (Invisible Scrollbar) */}
      <div className="flex gap-2.5 overflow-x-auto pb-2.5 w-full snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <button onClick={() => setFilter("all")} className={`snap-start whitespace-nowrap px-5 py-3 rounded-full text-xs font-extrabold transition-all outline-none [-webkit-tap-highlight-color:transparent] ${filter === "all" ? "bg-slate-900 text-white dark:bg-white dark:text-black shadow-[0_4px_15px_#00000026] dark:shadow-md" : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 dark:bg-white/5 dark:text-slate-400 dark:border-white/10 dark:hover:bg-white/10"}`}>All Items ({items.length})</button>
        <button onClick={() => setFilter("urgent")} className={`snap-start whitespace-nowrap px-5 py-3 rounded-full text-xs font-extrabold transition-all flex items-center gap-1.5 border outline-none [-webkit-tap-highlight-color:transparent] ${filter === "urgent" ? "bg-red-500 text-white border-red-500 shadow-[0_4px_15px_#ef44444d]" : "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"}`}>
          <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span> Expiring Soon ({stats.urgent})
        </button>
        <button onClick={() => setFilter("low")} className={`snap-start whitespace-nowrap px-5 py-3 rounded-full text-xs font-extrabold transition-all flex items-center gap-1.5 border outline-none [-webkit-tap-highlight-color:transparent] ${filter === "low" ? "bg-yellow-500 text-black border-yellow-500 shadow-[0_4px_15px_#eab3084d]" : "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-500 dark:border-yellow-500/20"}`}>
          ⚠️ Low Stock ({stats.lowStock})
        </button>
      </div>

      {/* --- INVENTORY RENDERER --- */}
      {isLoadingDB ? (
        <div className="flex justify-center py-10 w-full">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "flex flex-col space-y-4 w-full"}>
          {filteredItems.map((item) => {
            const daysLeft = getDaysLeft(item.expiryDate);
            const isUrgent = daysLeft <= 2;
            const isLow = (item.unit === 'Kg' || item.unit === 'Liters') ? item.qty < 1 : item.qty < 2;
            const { emoji } = analyzeItem(item.name);

            return (
              <div key={item.id} className={`group w-full relative bg-white dark:bg-white/[0.02] border ${isUrgent ? 'border-red-400/50 dark:border-red-500/30 shadow-[0_4px_20px_#ef44441a]' : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 shadow-[0_8px_30px_#0000000a] dark:shadow-none'} rounded-[2rem] p-4 sm:p-5 transition-all duration-300 ${viewMode === "grid" ? "flex flex-col" : "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"}`}>
                
                {isLow && <span className="absolute top-4 right-4 bg-yellow-400 dark:bg-yellow-500 text-black text-[9px] font-black uppercase px-2.5 py-1 rounded-lg shadow-sm border border-yellow-300 dark:border-yellow-400 z-10 flex items-center gap-1">⚠️ Low</span>}

                <div className={`flex ${viewMode === "grid" ? "flex-col mb-4" : "items-center flex-1 gap-4 min-w-0 w-full sm:w-auto"}`}>
                  <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 bg-slate-50 dark:bg-white/5 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-inner border border-slate-100 dark:border-white/5">
                    {emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className={`text-slate-900 dark:text-white font-extrabold tracking-tight truncate ${viewMode === "grid" ? "text-xl mt-3" : "text-lg"}`}>{item.name}</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider truncate mt-0.5">{item.category}</p>
                  </div>
                </div>

                <div className={`flex ${viewMode === "grid" ? "flex-col gap-4" : "items-center justify-between sm:justify-end gap-3 sm:gap-5 w-full sm:w-auto mt-2 sm:mt-0"}`}>
                  
                  <div className={`flex items-center justify-center px-3.5 py-2 rounded-xl text-xs font-extrabold shrink-0 border ${daysLeft < 0 ? 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-transparent' : isUrgent ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' : 'bg-green-50 text-green-600 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-transparent'}`}>
                     {daysLeft < 0 ? 'Expired' : daysLeft === 0 ? 'Last Day!' : `${daysLeft}d left`}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                    <div className="flex items-center bg-slate-50 dark:bg-black/40 p-1.5 rounded-xl border border-slate-200 dark:border-white/5 flex-1 sm:flex-none justify-center min-w-[110px] shadow-inner dark:shadow-none">
                      <button onClick={() => handleUpdateQty(item.id, -0.5)} className="w-8 h-8 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-all font-black text-lg outline-none [-webkit-tap-highlight-color:transparent] shadow-sm dark:shadow-none">-</button>
                      <span className="w-14 text-center font-black text-slate-900 dark:text-white text-sm">{item.qty}<span className="text-[10px] text-slate-500 font-bold ml-1">{item.unit}</span></span>
                      <button onClick={() => handleUpdateQty(item.id, 0.5)} className="w-8 h-8 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-all font-black text-lg outline-none [-webkit-tap-highlight-color:transparent] shadow-sm dark:shadow-none">+</button>
                    </div>

                    <button className="w-11 h-11 shrink-0 flex items-center justify-center bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500 hover:text-white rounded-[1rem] transition-all outline-none [-webkit-tap-highlight-color:transparent]" title="Add to Cart">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="col-span-full text-center py-16 px-6 border-2 border-dashed border-slate-300 dark:border-white/10 rounded-[2.5rem] bg-white dark:bg-white/[0.01]">
              <div className="text-5xl mb-4 opacity-50">🛸</div>
              <h3 className="text-slate-900 dark:text-white font-black text-lg mb-1">Pantry is Empty</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-6">Time to restock your premium kitchen!</p>
              
              <button 
                onClick={seedDefaultItems} 
                disabled={isSeeding}
                className="bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500 hover:text-white px-6 py-3 rounded-xl font-black transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-50 outline-none [-webkit-tap-highlight-color:transparent]"
              >
                {isSeeding ? (
                  <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div> Syncing...</>
                ) : "Load Sample Data 🪄"}
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
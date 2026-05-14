"use client";
import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/lib/supabase"; // 🔥 SUPABASE CONNECTED

interface PantryItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  category: string;
  expiryDate: string;
  pricePerUnit: number;
}

// 4. Auto-Emoji & Category Logic
const analyzeItem = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.match(/milk|cheese|butter|paneer|egg|yogurt|curd/)) return { cat: "Dairy", emoji: "🧀" };
  if (lower.match(/chicken|meat|fish|mutton|beef|pork/)) return { cat: "Meat", emoji: "🥩" };
  if (lower.match(/apple|banana|orange|fruit/)) return { cat: "Fruits", emoji: "🍎" };
  if (lower.match(/tomato|onion|potato|spinach|veg|carrot/)) return { cat: "Veggies", emoji: "🥦" };
  if (lower.match(/bread|bun|cake|flour|rice|pasta|oats/)) return { cat: "Grains", emoji: "🌾" };
  return { cat: "Staples", emoji: "🥫" };
};

export default function PantryTab() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [isLoadingDB, setIsLoadingDB] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  const [newItemName, setNewItemName] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("Kg");
  
  // 2. View & 3. Filter States
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [filter, setFilter] = useState<"all" | "urgent" | "low">("all");

  // 🚀 1. FETCH FROM SUPABASE
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

  // 🚀 2. SEED DEFAULT DATA TO SUPABASE (Magical Button Logic)
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

  // 🚀 3. ADD TO SUPABASE
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
      price_per_unit: 100 // Mock price
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

  // 🚀 4. UPDATE OR DELETE IN SUPABASE
  const handleUpdateQty = async (id: string, delta: number) => {
    const itemToUpdate = items.find(i => i.id === id);
    if (!itemToUpdate) return;

    const newQty = Math.max(0, parseFloat((itemToUpdate.qty + delta).toFixed(2)));

    // Agar Quantity 0 ho gayi, toh Database se delete kardo
    if (newQty <= 0) {
      setItems(items.filter(i => i.id !== id)); // Fast UI Update
      await supabase.from("pantry").delete().eq("id", id); // Background DB Delete
    } else {
      // Quantity update karo
      setItems(items.map(i => i.id === id ? { ...i, qty: newQty } : i));
      await supabase.from("pantry").update({ qty: newQty }).eq("id", id);
    }
  };

  const getDaysLeft = (dateStr: string) => Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (86400000));

  // 1. Pantry Worth & Stats
  const stats = useMemo(() => {
    const totalValue = items.reduce((acc, item) => acc + (item.qty * item.pricePerUnit), 0);
    const urgent = items.filter(i => getDaysLeft(i.expiryDate) <= 3).length;
    const lowStock = items.filter(i => (i.unit === 'Kg' || i.unit === 'Liters') ? i.qty < 1 : i.qty < 2).length;
    return { totalValue, urgent, lowStock };
  }, [items]);

  // Filtered Items
  const filteredItems = items.filter(item => {
    if (filter === "urgent") return getDaysLeft(item.expiryDate) <= 3;
    if (filter === "low") return (item.unit === 'Kg' || item.unit === 'Liters') ? item.qty < 1 : item.qty < 2;
    return true;
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6 pb-10 relative max-w-full overflow-x-hidden sm:overflow-visible">
      
      {/* Background Mesh Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-500/10 via-[#07070a]/0 to-transparent pointer-events-none -z-10"></div>

      {/* --- HEADER INSIGHTS (Responsive Flex) --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end px-1 gap-4 sm:gap-0">
        <div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500 tracking-tight mb-1">My Pantry</h2>
          {/* 1. Net Worth Tracker */}
          <p className="text-orange-400 font-bold text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shrink-0"></span>
            {isLoadingDB ? "Syncing Cloud..." : `Total Worth: ₹${stats.totalValue.toLocaleString()}`}
          </p>
        </div>
        
        {/* 2. Grid/List Toggle */}
        <div className="flex bg-white/5 p-1 rounded-xl ring-1 ring-white/10 shadow-lg self-end sm:self-auto">
          <button onClick={() => setViewMode("list")} className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-white/10 text-white shadow-md" : "text-slate-500 hover:text-white"}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white/10 text-white shadow-md" : "text-slate-500 hover:text-white"}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
          </button>
        </div>
      </div>

      {/* --- SMART WIDGETS ROW (Responsive Grid) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* 5. AI Recipe Matcher */}
        <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/5 ring-1 ring-indigo-500/30 p-4 rounded-3xl backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 text-6xl opacity-20 group-hover:scale-110 transition-transform">🍳</div>
          <h3 className="text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">AI Kitchen</h3>
          <p className="text-2xl font-black text-white">{Math.floor(items.length * 1.5)} <span className="text-sm font-medium text-slate-300">Recipes</span></p>
          <button className="mt-2 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-full hover:bg-indigo-500/40 transition-colors">View Matches →</button>
        </div>

        {/* 9. Nutritional Scanner */}
        <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/5 ring-1 ring-emerald-500/30 p-4 rounded-3xl backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 text-6xl opacity-20 group-hover:scale-110 transition-transform">🥑</div>
          <h3 className="text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">Pantry Vibe</h3>
          <p className="text-lg font-black text-white leading-tight">High Protein</p>
          <div className="flex gap-1 mt-3">
             <div className="h-1.5 flex-1 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]"></div>
             <div className="h-1.5 w-1/4 bg-slate-600 rounded-full"></div>
             <div className="h-1.5 w-1/4 bg-slate-600 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* --- PRO INPUT BAR (Responsive Form) --- */}
      <div className="relative group z-20 w-full">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-rose-500 rounded-[2rem] blur-md opacity-30 group-focus-within:opacity-60 transition duration-500"></div>
        <form onSubmit={handleAddItem} className="relative bg-black/60 backdrop-blur-2xl ring-1 ring-white/10 p-1.5 sm:p-1.5 rounded-[1.5rem] sm:rounded-[2rem] flex items-center shadow-2xl w-full">
          
          <button type="button" className="p-2 sm:p-3.5 shrink-0 text-slate-400 hover:text-orange-400 hover:bg-white/5 rounded-2xl transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>
          </button>
          
          <input 
            type="text" 
            value={newItemName} onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Add items..." 
            className="flex-1 min-w-[80px] w-full bg-transparent text-white font-medium px-1 sm:px-2 outline-none placeholder:text-slate-500 text-sm sm:text-base"
          />
          <select value={newItemUnit} onChange={(e) => setNewItemUnit(e.target.value)} className="shrink-0 bg-white/5 text-orange-400 font-bold rounded-xl px-1 py-2 sm:px-2 sm:py-2.5 outline-none appearance-none text-center min-w-[40px] sm:min-w-[50px] mr-1 text-xs sm:text-sm">
            <option className="bg-black text-white">Kg</option><option className="bg-black text-white">g</option><option className="bg-black text-white">L</option><option className="bg-black text-white">Pcs</option>
          </select>
          <button type="submit" disabled={!newItemName} className="shrink-0 bg-gradient-to-br from-orange-400 to-red-500 text-white font-black p-3 sm:p-4 rounded-xl sm:rounded-[1.5rem] shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
          </button>
        </form>
      </div>

      {/* 3. SMART FILTER CHIPS (Scrollable) */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 w-full snap-x">
        <button onClick={() => setFilter("all")} className={`snap-start whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === "all" ? "bg-white text-black shadow-lg" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}>All Items ({items.length})</button>
        <button onClick={() => setFilter("urgent")} className={`snap-start whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${filter === "urgent" ? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
          <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span> Expiring Soon ({stats.urgent})
        </button>
        <button onClick={() => setFilter("low")} className={`snap-start whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${filter === "low" ? "bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]" : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"}`}>
          ⚠️ Low Stock ({stats.lowStock})
        </button>
      </div>

      {/* --- INVENTORY RENDERER --- */}
      {isLoadingDB ? (
        <div className="flex justify-center py-10 w-full">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "flex flex-col space-y-3 w-full"}>
          {filteredItems.map((item) => {
            const daysLeft = getDaysLeft(item.expiryDate);
            const isUrgent = daysLeft <= 2;
            const isLow = (item.unit === 'Kg' || item.unit === 'Liters') ? item.qty < 1 : item.qty < 2;
            const { emoji } = analyzeItem(item.name);

            return (
              <div key={item.id} className={`group w-full relative bg-white/[0.02] hover:bg-white/[0.04] border ${isUrgent ? 'border-red-500/30' : 'border-white/10'} rounded-3xl p-4 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl ${viewMode === "grid" ? "flex flex-col" : "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"}`}>
                
                {/* 🔥 8. Low Stock Badge - BULLETPROOF FIX (Andar ki taraf safely tuck kiya gaya hai) */}
                {isLow && <span className="absolute top-3 right-3 bg-yellow-500 text-black text-[9px] font-black uppercase px-2.5 py-1 rounded-lg shadow-lg border border-yellow-400 z-10 flex items-center gap-1">⚠️ Low</span>}

                {/* Icon & Name */}
                <div className={`flex ${viewMode === "grid" ? "flex-col mb-4" : "items-center flex-1 gap-3 sm:gap-4 min-w-0 w-full sm:w-auto"}`}>
                  <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-inner ring-1 ring-white/5">
                    {emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className={`text-white font-black tracking-tight truncate ${viewMode === "grid" ? "text-lg mt-3" : "text-base"}`}>{item.name}</h4>
                    <p className="text-slate-400 text-xs font-medium truncate">{item.category}</p>
                  </div>
                </div>

                {/* Controls & Expiry */}
                <div className={`flex ${viewMode === "grid" ? "flex-col gap-4" : "items-center justify-between sm:justify-end gap-2 sm:gap-4 w-full sm:w-auto mt-2 sm:mt-0"}`}>
                  
                  {/* Expiry Pill */}
                  <div className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 ${daysLeft < 0 ? 'bg-slate-800 text-slate-500' : isUrgent ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/50' : 'bg-green-500/10 text-green-400'}`}>
                     {daysLeft < 0 ? 'Expired' : daysLeft === 0 ? 'Last Day!' : `${daysLeft}d left`}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                    {/* +/- Controls */}
                    <div className="flex items-center bg-black/50 p-1 rounded-xl ring-1 ring-white/5 flex-1 sm:flex-none justify-center min-w-[100px]">
                      <button onClick={() => handleUpdateQty(item.id, -0.5)} className="w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all">-</button>
                      <span className="w-12 text-center font-black text-sm">{item.qty}<span className="text-[9px] text-slate-500 ml-0.5">{item.unit}</span></span>
                      <button onClick={() => handleUpdateQty(item.id, 0.5)} className="w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all">+</button>
                    </div>

                    {/* 7. Quick Cart Button */}
                    <button className="w-10 h-10 sm:w-9 sm:h-9 shrink-0 flex items-center justify-center bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-white rounded-xl transition-all" title="Add to Cart">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                    </button>
                  </div>

                </div>
              </div>
            );
          })}

          {/* 🔥 THE MAGIC BUTTON WHEN PANTRY IS EMPTY 🔥 */}
          {filteredItems.length === 0 && (
            <div className="col-span-full text-center py-12 px-6 border border-dashed border-white/10 rounded-[2rem] bg-white/[0.01]">
              <div className="text-4xl mb-3 opacity-50">🛸</div>
              <p className="text-slate-400 font-medium text-sm mb-5">Pantry is empty. Time to restock!</p>
              
              <button 
                onClick={seedDefaultItems} 
                disabled={isSeeding}
                className="bg-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-white border border-orange-500/30 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 mx-auto disabled:opacity-50"
              >
                {isSeeding ? (
                  <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div> Loading...</>
                ) : "Load Sample Data 🪄"}
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
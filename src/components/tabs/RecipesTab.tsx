"use client";
import { useState, useRef } from "react";

interface Recipe {
  id: string;
  name: string;
  time: string;
  calories: number;
  type: "Veg" | "Non-Veg";
  category: string;
  emoji: string;
  gradient: string;
  isLiked: boolean;
  ingredients: string[];
  steps: string[];
  imageUrl?: string;
  macros: { protein: number; carbs: number; fats: number };
  difficulty: "Easy" | "Medium" | "Hard";
}

export default function RecipesTab() {
  // 🔥 5 PREMIUM DEFAULT RECIPES
  const [recipes, setRecipes] = useState<Recipe[]>([
    { 
      id: "1", name: "Butter Chicken Ultra", time: "45 Min", calories: 650, type: "Non-Veg", category: "High Protein", emoji: "🍗", gradient: "from-orange-500 to-red-600", isLiked: true, 
      ingredients: ["500g Boneless Chicken", "2 tbsp Premium Butter", "1 Cup Tomato Puree", "50ml Heavy Cream"], 
      steps: ["Marinate chicken in yogurt and spices.", "Melt butter and sear chicken.", "Add puree and simmer.", "Drizzle cream and serve hot!"],
      macros: { protein: 45, carbs: 12, fats: 32 }, difficulty: "Medium"
    },
    { 
      id: "2", name: "Avocado Quinoa Bowl", time: "15 Min", calories: 320, type: "Veg", category: "Quick Meal", emoji: "🥑", gradient: "from-green-400 to-emerald-600", isLiked: false, 
      ingredients: ["1 Cup Cooked Quinoa", "1 Ripe Avocado", "Cherry Tomatoes", "Olive Oil Dressing"], 
      steps: ["Fluff the cooked quinoa in a bowl.", "Slice the avocado and arrange on top.", "Halve the cherry tomatoes and add.", "Drizzle with olive oil, salt, and pepper."],
      macros: { protein: 12, carbs: 35, fats: 18 }, difficulty: "Easy"
    },
    { 
      id: "3", name: "Smoky Paneer Tikka", time: "30 Min", calories: 410, type: "Veg", category: "High Protein", emoji: "🍢", gradient: "from-yellow-400 to-orange-500", isLiked: true, 
      ingredients: ["250g Paneer Cubes", "1 Cup Hung Curd", "Tikka Masala", "Bell Peppers & Onions"], 
      steps: ["Mix hung curd with tikka masala.", "Coat paneer and veggies in the marinade.", "Skewer them alternately.", "Grill for 15 mins until charred."],
      macros: { protein: 22, carbs: 15, fats: 28 }, difficulty: "Medium"
    },
    { 
      id: "4", name: "Hyderabadi Dum Biryani", time: "90 Min", calories: 850, type: "Non-Veg", category: "Heavy Meal", emoji: "🥘", gradient: "from-amber-600 to-orange-700", isLiked: false, 
      ingredients: ["1kg Basmati Rice", "750g Mutton/Chicken", "Fried Onions (Birista)", "Saffron Milk", "Whole Spices"], 
      steps: ["Marinate meat overnight with spices and yogurt.", "Partially boil rice with whole spices.", "Layer meat, rice, fried onions, and saffron.", "Seal pot and cook on Dum (slow heat) for 45 mins."],
      macros: { protein: 48, carbs: 85, fats: 35 }, difficulty: "Hard"
    },
    { 
      id: "5", name: "Berry Protein Smoothie", time: "5 Min", calories: 250, type: "Veg", category: "Quick Meal", emoji: "🍓", gradient: "from-pink-500 to-rose-500", isLiked: false, 
      ingredients: ["1 Scoop Whey Protein", "Mixed Berries", "1 Cup Almond Milk", "Chia Seeds"], 
      steps: ["Add almond milk to the blender.", "Drop in the berries and protein powder.", "Blend until smooth.", "Top with chia seeds and enjoy cold."],
      macros: { protein: 25, carbs: 20, fats: 5 }, difficulty: "Easy"
    }
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"All" | "Veg" | "Non-Veg" | "Quick Meal" | "High Protein">("All");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [cookModeRecipe, setCookModeRecipe] = useState<Recipe | null>(null);
  const [portions, setPortions] = useState(1);
  const [currentStep, setCurrentStep] = useState(-1);

  // --- ADVANCED FORM STATES ---
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"Veg" | "Non-Veg">("Veg");
  const [newTime, setNewTime] = useState("");
  const [newCalories, setNewCalories] = useState("");
  const [newProtein, setNewProtein] = useState("");
  const [newCarbs, setNewCarbs] = useState("");
  const [newFats, setNewFats] = useState("");
  const [newDifficulty, setNewDifficulty] = useState<"Easy" | "Medium" | "Hard">("Easy");
  const [newIngredients, setNewIngredients] = useState("");
  const [newSteps, setNewSteps] = useState("");
  
  // Image Upload & Drag-Drop States
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleLike = (id: string) => setRecipes(recipes.map(r => r.id === id ? { ...r, isLiked: !r.isLiked } : r));

  // 🚀 ADVANCED: Image Compression Logic
  const processImageFile = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    setIsCompressing(true);
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800; // Better quality, still small size
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
        setImageFile(compressedBase64);
        setIsCompressing(false);
      };
    };
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processImageFile(e.target.files[0]);
  };

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) processImageFile(e.dataTransfer.files[0]);
  };

  const handleAddRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate DB Upload UX
    
    const newRecipe: Recipe = {
      id: Date.now().toString(), 
      name: newName, 
      time: newTime ? `${newTime} Min` : "30 Min", 
      calories: newCalories ? parseInt(newCalories) : 400, 
      type: newType, 
      category: newProtein && parseInt(newProtein) > 20 ? "High Protein" : "Quick Meal", 
      emoji: newType === "Veg" ? "🥗" : "🥩", 
      gradient: "from-blue-500 to-indigo-600", 
      isLiked: false,
      ingredients: newIngredients ? newIngredients.split('\n').filter(i => i.trim() !== "") : ["Secret Ingredient"], 
      steps: newSteps ? newSteps.split('\n').filter(s => s.trim() !== "") : ["Mix and cook."],
      imageUrl: imageFile || undefined, 
      macros: { 
        protein: newProtein ? parseInt(newProtein) : 10, 
        carbs: newCarbs ? parseInt(newCarbs) : 20, 
        fats: newFats ? parseInt(newFats) : 10 
      }, 
      difficulty: newDifficulty
    };
    
    setRecipes([newRecipe, ...recipes]);
    
    // Reset Form
    setIsAddModalOpen(false); 
    setNewName(""); setNewTime(""); setNewCalories(""); setNewProtein(""); setNewCarbs(""); setNewFats("");
    setNewIngredients(""); setNewSteps(""); setImageFile(null); setIsSaving(false);
  };

  const openCookMode = (recipe: Recipe) => { setCookModeRecipe(recipe); setPortions(1); setCurrentStep(-1); };

  const filteredRecipes = recipes.filter(recipe => {
    return (filter === "All" || recipe.type === filter || recipe.category === filter) && recipe.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6 pb-10 relative">
      <div className="absolute top-0 right-0 w-[150%] h-[400px] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-600/10 via-[#07070a]/0 to-transparent pointer-events-none -z-10"></div>

      {/* --- HEADER --- */}
      <div className="flex justify-between items-end px-1 relative z-10">
        <div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500 tracking-tight mb-1">Cookbook</h2>
          <p className="text-orange-400 font-bold text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span> {recipes.length} Recipes
          </p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="cursor-pointer bg-gradient-to-br from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white p-3 rounded-2xl shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all active:scale-95">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
        </button>
      </div>

      {/* --- SEARCH & FILTERS --- */}
      <div className="space-y-4 relative z-10">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-rose-500 rounded-[2rem] blur-sm opacity-20 group-focus-within:opacity-50 transition duration-500"></div>
          <div className="relative bg-[#0c0c10] border border-white/[0.08] p-1.5 rounded-[2rem] flex items-center shadow-xl">
            <div className="pl-4 text-slate-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg></div>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search recipes..." className="flex-1 bg-transparent text-white font-medium px-4 py-3 outline-none placeholder:text-slate-600" />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {["All", "Veg", "Non-Veg", "High Protein", "Quick Meal"].map((f) => (
            <button key={f} onClick={() => setFilter(f as any)} className={`cursor-pointer whitespace-nowrap px-5 py-2.5 rounded-[1.2rem] text-xs font-bold transition-all border ${filter === f ? "bg-white text-black border-transparent shadow-[0_0_15px_rgba(255,255,255,0.2)]" : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"}`}>
              {f === "Veg" && "🥬 "} {f === "Non-Veg" && "🥩 "} {f === "High Protein" && "💪 "} {f === "Quick Meal" && "⚡ "} {f}
            </button>
          ))}
        </div>
      </div>

      {/* --- RECIPE GRID --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10 mt-6">
        {filteredRecipes.map((recipe) => (
          <div key={recipe.id} className="group bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 p-2.5 rounded-[2rem] backdrop-blur-sm transition-all duration-300 hover:shadow-2xl flex flex-col">
            
            <div className={`w-full h-36 rounded-[1.5rem] relative overflow-hidden flex items-center justify-center shadow-inner ${!recipe.imageUrl ? `bg-gradient-to-br ${recipe.gradient}` : 'bg-black/50'}`}>
              {recipe.imageUrl ? (
                <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              ) : (
                <span className="text-6xl drop-shadow-2xl group-hover:scale-110 transition-transform duration-500">{recipe.emoji}</span>
              )}
              
              {/* Macro Tags Overlay */}
              <div className="absolute bottom-2 left-2 flex gap-1 z-20">
                <span className="bg-black/60 backdrop-blur-md border border-white/10 text-white text-[9px] font-bold px-2 py-1 rounded-lg flex items-center gap-1"><span className="text-blue-400">P</span> {recipe.macros.protein}g</span>
                <span className="bg-black/60 backdrop-blur-md border border-white/10 text-white text-[9px] font-bold px-2 py-1 rounded-lg flex items-center gap-1"><span className="text-yellow-400">C</span> {recipe.macros.carbs}g</span>
              </div>

              <button onClick={() => toggleLike(recipe.id)} className="cursor-pointer absolute top-3 right-3 bg-black/30 backdrop-blur-md p-2 rounded-xl text-white hover:bg-black/50 transition-colors z-20">
                <svg className={`w-5 h-5 ${recipe.isLiked ? 'fill-red-500 text-red-500' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
              </button>
            </div>

            <div className="p-3 pt-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-2 mb-1">
                  <h3 className="text-white font-black text-lg leading-tight tracking-tight">{recipe.name}</h3>
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md border ${recipe.type === 'Veg' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{recipe.type}</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                    <span className="flex items-center gap-1">⏱️ {recipe.time}</span>
                    <span className="flex items-center gap-1 text-orange-400">🔥 {recipe.calories} cal</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${recipe.difficulty === 'Easy' ? 'bg-green-500/10 text-green-400' : recipe.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>
                    {recipe.difficulty}
                  </span>
                </div>
              </div>
              <button onClick={() => openCookMode(recipe)} className="cursor-pointer w-full mt-5 bg-white/5 hover:bg-orange-500 text-white font-black py-3.5 rounded-xl transition-all duration-300 flex justify-center items-center gap-2 group/btn border border-white/5 hover:border-orange-500 shadow-lg">
                <span>Start Cooking</span>
                <svg className="w-4 h-4 opacity-50 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ========================================= */}
      {/* 🚀 MODAL 1: ADVANCED PRO ADD RECIPE */}
      {/* ========================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0b0b0e] border border-white/10 w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 rounded-[2.5rem] animate-in slide-in-from-bottom-10 duration-300 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-white">Create Recipe</h3>
              <button disabled={isSaving} onClick={() => setIsAddModalOpen(false)} className="cursor-pointer text-slate-400 hover:bg-white/10 w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-50 transition-colors">✕</button>
            </div>
            
            <form onSubmit={handleAddRecipe} className="space-y-5">
              
              {/* DRAG AND DROP IMAGE UPLOAD */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !imageFile && !isCompressing && fileInputRef.current?.click()}
                className={`relative w-full h-40 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center group overflow-hidden ${isDragging ? 'border-orange-500 bg-orange-500/10' : 'border-white/20 hover:border-orange-500/50 bg-white/[0.02] cursor-pointer'}`}
              >
                <input type="file" accept="image/*" onChange={handleImageChange} ref={fileInputRef} disabled={isCompressing || isSaving} className="hidden" />
                
                {isCompressing ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-orange-400 font-bold text-sm animate-pulse">Compressing Image...</p>
                  </div>
                ) : imageFile ? (
                  <>
                    <img src={imageFile} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                    <button type="button" onClick={(e) => { e.stopPropagation(); setImageFile(null); }} className="absolute top-2 right-2 bg-black/70 hover:bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-lg z-20">✕</button>
                  </>
                ) : (
                  <>
                    <div className={`text-4xl mb-2 transition-transform duration-300 ${isDragging ? 'scale-125' : 'group-hover:-translate-y-2'}`}>📸</div>
                    <p className="text-white font-bold text-sm">{isDragging ? 'Drop Image Here!' : 'Tap or Drag Food Photo Here'}</p>
                    <p className="text-slate-500 text-xs mt-1">JPEG, PNG • Auto-compressed</p>
                  </>
                )}
              </div>

              {/* ROW 1: Name & Type */}
              <div className="flex gap-3">
                <input type="text" placeholder="Recipe Name (e.g. Masala Dosa)" value={newName} onChange={(e) => setNewName(e.target.value)} disabled={isSaving} className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white outline-none focus:border-orange-500 transition-all disabled:opacity-50" required />
                <select value={newType} onChange={(e) => setNewType(e.target.value as any)} disabled={isSaving} className="w-32 bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white outline-none focus:border-orange-500 appearance-none disabled:opacity-50">
                  <option value="Veg" className="bg-[#0b0b0e]">🥬 Veg</option>
                  <option value="Non-Veg" className="bg-[#0b0b0e]">🥩 Meat</option>
                </select>
              </div>

              {/* ROW 2: Time, Cals, Difficulty */}
              <div className="grid grid-cols-3 gap-3">
                <input type="number" placeholder="Mins" value={newTime} onChange={(e) => setNewTime(e.target.value)} disabled={isSaving} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white outline-none focus:border-orange-500 transition-all placeholder:text-slate-500" />
                <input type="number" placeholder="Kcal" value={newCalories} onChange={(e) => setNewCalories(e.target.value)} disabled={isSaving} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white outline-none focus:border-orange-500 transition-all placeholder:text-slate-500" />
                <select value={newDifficulty} onChange={(e) => setNewDifficulty(e.target.value as any)} disabled={isSaving} className="w-full bg-white/5 border border-white/10 rounded-2xl px-3 py-3.5 text-white outline-none focus:border-orange-500 appearance-none text-sm">
                  <option value="Easy" className="bg-black">🟢 Easy</option>
                  <option value="Medium" className="bg-black">🟡 Medium</option>
                  <option value="Hard" className="bg-black">🔴 Hard</option>
                </select>
              </div>

              {/* ROW 3: Macros */}
              <div className="bg-white/[0.02] border border-white/5 p-3 rounded-2xl">
                <p className="text-slate-400 text-xs font-bold mb-3 uppercase tracking-wider pl-1">Macros (per serving)</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex items-center bg-black/40 rounded-xl px-3 py-2 border border-white/5">
                    <span className="text-blue-400 font-bold text-xs mr-2">P</span>
                    <input type="number" placeholder="Protein" value={newProtein} onChange={(e) => setNewProtein(e.target.value)} className="w-full bg-transparent text-white outline-none text-sm placeholder:text-slate-600" />
                    <span className="text-slate-500 text-xs">g</span>
                  </div>
                  <div className="flex items-center bg-black/40 rounded-xl px-3 py-2 border border-white/5">
                    <span className="text-yellow-400 font-bold text-xs mr-2">C</span>
                    <input type="number" placeholder="Carbs" value={newCarbs} onChange={(e) => setNewCarbs(e.target.value)} className="w-full bg-transparent text-white outline-none text-sm placeholder:text-slate-600" />
                    <span className="text-slate-500 text-xs">g</span>
                  </div>
                  <div className="flex items-center bg-black/40 rounded-xl px-3 py-2 border border-white/5">
                    <span className="text-red-400 font-bold text-xs mr-2">F</span>
                    <input type="number" placeholder="Fats" value={newFats} onChange={(e) => setNewFats(e.target.value)} className="w-full bg-transparent text-white outline-none text-sm placeholder:text-slate-600" />
                    <span className="text-slate-500 text-xs">g</span>
                  </div>
                </div>
              </div>

              <textarea placeholder="Ingredients (One per line)&#10;e.g. 2 Eggs&#10;1 Onion" value={newIngredients} onChange={(e) => setNewIngredients(e.target.value)} disabled={isSaving} rows={3} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white outline-none focus:border-orange-500 transition-all disabled:opacity-50 resize-none text-sm placeholder:text-slate-500"></textarea>
              <textarea placeholder="Steps (One per line)&#10;e.g. Fry the onions.&#10;Add spices and mix." value={newSteps} onChange={(e) => setNewSteps(e.target.value)} disabled={isSaving} rows={3} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white outline-none focus:border-orange-500 transition-all disabled:opacity-50 resize-none text-sm placeholder:text-slate-500"></textarea>
              
              <button type="submit" disabled={isSaving || isCompressing} className="cursor-pointer w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-black py-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] mt-2 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                {isSaving ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Saving Magic...</>
                ) : "Save to Cookbook"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* 🔥 MODAL 2: INTERACTIVE COOK MODE UX */}
      {/* ========================================= */}
      {cookModeRecipe && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#0b0b0e] sm:p-4">
          <div className="w-full h-full max-w-2xl mx-auto sm:border sm:border-white/10 sm:rounded-[2.5rem] flex flex-col bg-[#07070a] shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom-full duration-500">
            
            <div className="shrink-0 pt-12 pb-4 px-6 bg-white/[0.02] border-b border-white/5 relative z-20">
              <button onClick={() => setCookModeRecipe(null)} className="absolute top-6 right-6 cursor-pointer bg-white/10 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20">✕</button>
              <h3 className="text-xl font-black text-white mb-4 pr-10">{cookModeRecipe.name}</h3>
              
              <div className="flex gap-1 mb-2">
                <div className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${currentStep === -1 ? 'bg-orange-500' : 'bg-white/10'}`}></div>
                {cookModeRecipe.steps.map((_, idx) => (
                  <div key={idx} className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${currentStep >= idx ? 'bg-orange-500' : 'bg-white/10'}`}></div>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-8">
              {currentStep === -1 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
                  <div className="bg-gradient-to-r from-orange-500/10 to-red-500/5 border border-orange-500/20 p-5 rounded-[2rem] flex justify-between items-center">
                    <div>
                      <span className="text-orange-400 font-bold text-sm block">Serving Size</span>
                    </div>
                    <div className="flex items-center gap-4 bg-black/40 p-1.5 rounded-xl border border-white/5">
                      <button onClick={() => setPortions(Math.max(1, portions - 1))} className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 text-white font-black text-lg">-</button>
                      <span className="font-black text-white w-6 text-center text-lg">{portions}</span>
                      <button onClick={() => setPortions(portions + 1)} className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 text-white font-black text-lg">+</button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white font-black text-lg mb-4">Ingredients</h4>
                    <ul className="grid grid-cols-1 gap-3">
                      {cookModeRecipe.ingredients.map((ing, i) => (
                        <li key={i} className="flex items-center gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                          <span className="text-white font-medium">{ing} <span className="text-orange-400 font-bold ml-1">(x{portions})</span></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {currentStep >= 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-4xl font-black text-white">{currentStep + 1}</div>
                  <h2 className="text-2xl sm:text-3xl font-medium text-white px-4">{cookModeRecipe.steps[currentStep]}</h2>
                </div>
              )}
            </div>

            <div className="shrink-0 p-6 bg-gradient-to-t from-[#07070a] to-transparent relative z-20">
              {currentStep === -1 ? (
                <button onClick={() => setCurrentStep(0)} className="w-full bg-white text-black font-black text-lg py-5 rounded-[1.5rem] hover:scale-[1.02] transition-all">Let's Start Cooking</button>
              ) : (
                <div className="flex gap-4">
                  <button onClick={() => setCurrentStep(currentStep - 1)} className="w-1/3 bg-white/10 text-white font-bold py-5 rounded-[1.5rem]">Back</button>
                  <button onClick={() => { if (currentStep < cookModeRecipe.steps.length - 1) setCurrentStep(currentStep + 1); else setCookModeRecipe(null); }} className={`w-2/3 text-white font-black py-5 rounded-[1.5rem] ${currentStep === cookModeRecipe.steps.length - 1 ? 'bg-green-500' : 'bg-orange-500'}`}>
                    {currentStep === cookModeRecipe.steps.length - 1 ? "Finish Meal 🍽️" : "Next Step"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
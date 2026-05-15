"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

interface RecipesTabProps {
  user: any;
}

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
  authorId?: string; 
}

export default function RecipesTab({ user }: RecipesTabProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoadingDB, setIsLoadingDB] = useState(true);
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"All" | "Veg" | "Non-Veg" | "Quick Meal" | "High Protein">("All");
  const [sortBy, setSortBy] = useState<"Newest" | "Quickest" | "High Protein">("Newest");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [cookModeRecipe, setCookModeRecipe] = useState<Recipe | null>(null);
  const [portions, setPortions] = useState(1);
  const [currentStep, setCurrentStep] = useState(-1);

  const [mounted, setMounted] = useState(false);

  // --- ADVANCED FORM STATES ---
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"Veg" | "Non-Veg">("Veg");
  const [newTime, setNewTime] = useState("");
  const [newCalories, setNewCalories] = useState("");
  const [newProtein, setNewProtein] = useState("");
  const [newCarbs, setNewCarbs] = useState("");
  const [newFats, setNewFats] = useState("");
  const [newDifficulty, setNewDifficulty] = useState<"Easy" | "Medium" | "Hard">("Easy");
  
  const [newIngredients, setNewIngredients] = useState<string[]>([""]);
  const [newSteps, setNewSteps] = useState<string[]>([""]);
  
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      const formattedRecipes: Recipe[] = data.map(dbRecipe => ({
        id: dbRecipe.id,
        name: dbRecipe.name,
        time: dbRecipe.time || "30 Min",
        calories: dbRecipe.calories || 400,
        type: dbRecipe.type as any || "Veg",
        category: dbRecipe.category || "Quick Meal",
        emoji: dbRecipe.emoji || (dbRecipe.type === "Veg" ? "🥗" : "🥩"),
        gradient: dbRecipe.gradient || (dbRecipe.type === "Veg" ? "from-green-500 to-emerald-600" : "from-orange-500 to-red-600"),
        isLiked: dbRecipe.is_liked || false,
        ingredients: dbRecipe.ingredients || [],
        steps: dbRecipe.steps || [],
        imageUrl: dbRecipe.image_url || undefined,
        macros: dbRecipe.macros || { protein: 10, carbs: 20, fats: 10 },
        difficulty: dbRecipe.difficulty as any || "Medium",
        authorId: dbRecipe.author_id || dbRecipe.user_id 
      }));
      setRecipes(formattedRecipes);
    }
    setIsLoadingDB(false);
  };

  const checkAuth = () => {
    if (!user) {
      alert("Chef, you need to log in to use this feature! 🔒👨‍🍳");
      router.push("/login");
      return false;
    }
    return true;
  };

  const handleOpenAddModal = () => {
    if (checkAuth()) setIsAddModalOpen(true);
  };

  const toggleLike = async (id: string) => {
    if (!checkAuth()) return;
    const recipe = recipes.find(r => r.id === id);
    if (!recipe) return;
    setRecipes(recipes.map(r => r.id === id ? { ...r, isLiked: !r.isLiked } : r));
    await supabase.from("recipes").update({ is_liked: !recipe.isLiked }).eq("id", id);
  };

  const handleShare = (postName: string) => {
    navigator.clipboard.writeText(`Check out this amazing recipe: ${postName} on Zestly!`);
    alert(`Link for ${postName} copied to clipboard! 🚀`);
  };

  const handleDelete = async (id: string) => {
    if (!checkAuth()) return;
    if (confirm("Are you sure you want to delete this recipe?")) {
      setRecipes(recipes.filter(r => r.id !== id)); 
      await supabase.from("recipes").delete().eq("id", id); 
    }
  };

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
        const MAX_WIDTH = 1000; 
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.8);
        setImageFile(compressedBase64);
        setIsCompressing(false);
      };
    };
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processImageFile(e.target.files[0]);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) processImageFile(e.dataTransfer.files[0]);
  };

  const handleIngredientChange = (index: number, value: string) => {
    const updated = [...newIngredients]; updated[index] = value; setNewIngredients(updated);
  };
  const addIngredientField = () => setNewIngredients([...newIngredients, ""]);
  const removeIngredientField = (index: number) => { if (newIngredients.length > 1) setNewIngredients(newIngredients.filter((_, i) => i !== index)); };

  const handleStepChange = (index: number, value: string) => {
    const updated = [...newSteps]; updated[index] = value; setNewSteps(updated);
  };
  const addStepField = () => setNewSteps([...newSteps, ""]);
  const removeStepField = (index: number) => { if (newSteps.length > 1) setNewSteps(newSteps.filter((_, i) => i !== index)); };

  const handleAddRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    
    setIsSaving(true);
    let finalImageUrl = undefined;

    if (imageFile) {
      finalImageUrl = imageFile; 
      try {
        const fetchRes = await fetch(imageFile);
        const blob = await fetchRes.blob();
        const fileName = `recipe-${Date.now()}.jpg`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("recipe-images")
          .upload(fileName, blob, { contentType: "image/jpeg" });

        if (!uploadError && uploadData) {
          const { data: publicUrlData } = supabase.storage.from("recipe-images").getPublicUrl(fileName);
          finalImageUrl = publicUrlData.publicUrl; 
        }
      } catch (err) {
        console.error("Image upload skipped:", err);
      }
    }

    const finalIngredients = newIngredients.filter(i => i.trim() !== "");
    const finalSteps = newSteps.filter(s => s.trim() !== "");
    const defaultGradient = newType === "Veg" ? "from-green-500 to-emerald-600" : "from-orange-500 to-red-600";

    const newRecipeData = {
      name: newName, 
      time: newTime ? `${newTime} Min` : "30 Min", 
      calories: newCalories ? parseInt(newCalories) : 400, 
      type: newType, 
      category: newProtein && parseInt(newProtein) > 20 ? "High Protein" : "Quick Meal", 
      emoji: newType === "Veg" ? "🥗" : "🥩", 
      gradient: defaultGradient, 
      is_liked: false,
      ingredients: finalIngredients.length > 0 ? finalIngredients : ["Secret Ingredient"], 
      steps: finalSteps.length > 0 ? finalSteps : ["Mix and cook."],
      image_url: finalImageUrl, 
      macros: { protein: newProtein ? parseInt(newProtein) : 10, carbs: newCarbs ? parseInt(newCarbs) : 20, fats: newFats ? parseInt(newFats) : 10 }, 
      difficulty: newDifficulty,
      author_id: user?.id, 
      author_name: user?.user_metadata?.full_name || "Chef"
    };

    const { data, error } = await supabase.from("recipes").insert([newRecipeData]).select();
    
    if (!error && data) {
      const dbRecipe = data[0];
      const addedRecipe: Recipe = {
        id: dbRecipe.id, name: dbRecipe.name, time: dbRecipe.time, calories: dbRecipe.calories, type: dbRecipe.type,
        category: dbRecipe.category, emoji: dbRecipe.emoji, gradient: dbRecipe.gradient, isLiked: dbRecipe.is_liked,
        ingredients: dbRecipe.ingredients, steps: dbRecipe.steps, imageUrl: dbRecipe.image_url, macros: dbRecipe.macros, difficulty: dbRecipe.difficulty,
        authorId: dbRecipe.author_id
      };
      setRecipes([addedRecipe, ...recipes]);
    }

    setIsAddModalOpen(false); 
    setNewName(""); setNewTime(""); setNewCalories(""); setNewProtein(""); setNewCarbs(""); setNewFats("");
    setNewIngredients([""]); setNewSteps([""]); setImageFile(null); setIsSaving(false);
  };

  const openCookMode = (recipe: Recipe) => { setCookModeRecipe(recipe); setPortions(1); setCurrentStep(-1); };

  const filteredAndSortedRecipes = useMemo(() => {
    let result = recipes.filter(recipe => {
      return (filter === "All" || recipe.type === filter || recipe.category === filter) && 
             recipe.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    if (sortBy === "Quickest") {
      result.sort((a, b) => parseInt(a.time) - parseInt(b.time));
    } else if (sortBy === "High Protein") {
      result.sort((a, b) => b.macros.protein - a.macros.protein);
    }
    
    return result;
  }, [recipes, filter, searchQuery, sortBy]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-7 pb-24 relative max-w-full overflow-x-hidden cursor-default selection:bg-orange-500/10 w-full flex flex-col items-center">
      
      <div className="absolute top-0 right-0 w-[150%] h-[400px] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-100/80 via-slate-50 to-transparent dark:from-red-600/10 dark:via-[#07070a]/0 dark:to-transparent pointer-events-none -z-10 transition-colors duration-500"></div>

      {/* --- HEADER --- */}
      <div className="w-full max-w-5xl flex justify-between items-end px-5 sm:px-1 relative z-10 pt-2">
        <div>
          <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tighter mb-1.5 transition-colors">Cookbook</h2>
          <p className="text-orange-500 dark:text-orange-400 font-bold text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span> {isLoadingDB ? "Loading..." : `${recipes.length} Masterpieces`}
          </p>
        </div>
        <button onClick={handleOpenAddModal} className="cursor-pointer bg-linear-to-br from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white p-3.5 rounded-[1.2rem] shadow-[0_4px_15px_#f9731666] transition-all active:scale-95 group outline-none [-webkit-tap-highlight-color:transparent]">
          <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>

      {/* --- SEARCH, FILTERS & SORTING --- */}
      <div className="w-full max-w-5xl space-y-4 relative z-10 pt-1">
        <div className="flex gap-2.5 px-4 sm:px-1">
          <div className="relative group flex-1">
            <div className="absolute -inset-0.5 bg-linear-to-r from-orange-400 to-red-400 rounded-[2.2rem] blur-lg opacity-0 dark:opacity-10 group-focus-within:opacity-20 dark:group-focus-within:opacity-40 transition duration-500"></div>
            <div className="relative bg-white dark:bg-[#0c0c10] border border-slate-200 dark:border-white/10 p-2.5 rounded-[2.2rem] flex items-center shadow-[0_8px_30px_#0000000d] dark:shadow-2xl transition-all focus-within:border-orange-500/40">
              <div className="p-3 text-slate-400 group-focus-within:text-orange-500 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </div>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search recipes..." className="flex-1 w-full min-w-0 bg-transparent text-slate-900 dark:text-white font-semibold px-2 py-2.5 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 cursor-text" />
            </div>
          </div>
          
          <div className="relative shrink-0">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-white dark:bg-[#0c0c10] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white text-xs sm:text-sm font-extrabold rounded-full pl-5 pr-10 py-4 h-full outline-none cursor-pointer focus:border-orange-500/50 shadow-[0_8px_30px_#0000000d] dark:shadow-2xl appearance-none outline-none [-webkit-tap-highlight-color:transparent]">
              <option value="Newest" className="bg-white dark:bg-black text-slate-900 dark:text-white">✨ Newest</option>
              <option value="Quickest" className="bg-white dark:bg-black text-slate-900 dark:text-white">⏱️ Quickest</option>
              <option value="High Protein" className="bg-white dark:bg-black text-slate-900 dark:text-white">💪 High Protein</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 px-5 sm:px-0 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {["All", "Veg", "Non-Veg", "High Protein", "Quick Meal"].map((f, index, arr) => (
            <button key={f} onClick={() => setFilter(f as any)} className={`snap-start cursor-pointer whitespace-nowrap px-5 py-3 rounded-full text-xs font-extrabold transition-all border outline-none [-webkit-tap-highlight-color:transparent] ${index === 0 ? "ml-5 sm:ml-1" : ""} ${index === arr.length - 1 ? "mr-5 sm:mr-1" : ""} ${filter === f ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-black dark:border-white shadow-[0_4px_15px_#00000026] dark:shadow-md scale-105" : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 dark:bg-[#0c0c10] dark:text-slate-300 dark:border-white/10 dark:hover:bg-white/5"}`}>
              {f === "Veg" && "🥬 "} {f === "Non-Veg" && "🥩 "} {f === "High Protein" && "💪 "} {f === "Quick Meal" && "⚡ "} {f}
            </button>
          ))}
        </div>
      </div>

      {/* --- RECIPE GRID --- */}
      {isLoadingDB ? (
        <div className="flex flex-col items-center justify-center py-20 text-orange-500 gap-4">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-bold">Loading your Cloud Recipes...</p>
        </div>
      ) : (
        <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 gap-10 sm:gap-7 relative z-10 mt-6 px-1">
          {filteredAndSortedRecipes.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center text-center py-20 px-6 border-2 border-dashed border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.01] rounded-[2.5rem] animate-in zoom-in-95 duration-500 mx-4">
              <span className="text-6xl mb-5 opacity-50 drop-shadow-md">👨‍🍳</span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">No Masterpieces Found</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm max-w-xs">
                {filter === "All" ? "Your cookbook is empty. Click the plus button above to add your first culinary masterpiece!" : `No ${filter} recipes found. Try changing your filters.`}
              </p>
            </div>
          ) : (
            filteredAndSortedRecipes.map((recipe) => (
              <div key={recipe.id} className="mb-6 sm:mb-0 sm:bg-white sm:dark:bg-[#0b0b0e] sm:border sm:border-slate-200/80 sm:dark:border-white/10 sm:rounded-[2.5rem] sm:overflow-hidden sm:shadow-[0_8px_35px_#0000000d] sm:dark:shadow-2xl transition-all sm:hover:-translate-y-1.5 sm:hover:shadow-[0_20px_50px_#0000001a] group/card flex flex-col">
                
                {/* Image Area */}
                <div className={`-mx-5 w-[calc(100%+40px)] sm:mx-0 sm:w-full h-[23rem] sm:h-64 relative flex items-center justify-center cursor-pointer sm:overflow-hidden ${!recipe.imageUrl ? `bg-linear-to-br ${recipe.gradient}` : 'bg-slate-100 dark:bg-black'}`}>
                  {recipe.imageUrl ? (
                    <>
                      <div className="absolute inset-0 bg-cover bg-center blur-xl opacity-20 sm:group-hover/card:opacity-40 sm:group-hover/card:scale-110 transition-all duration-700" style={{ backgroundImage: `url(${recipe.imageUrl})` }}></div>
                      <img src={recipe.imageUrl} alt={recipe.name} className="relative z-10 w-full h-full object-cover sm:group-hover/card:scale-105 transition-transform duration-700" />
                    </>
                  ) : (
                    <span className="text-8xl drop-shadow-2xl sm:group-hover/card:scale-110 transition-transform duration-500">{recipe.emoji}</span>
                  )}
                  
                  {/* Title Overlay */}
                  <div className="absolute bottom-0 left-0 w-full bg-linear-to-t from-black/80 via-black/30 to-transparent p-5 pt-20 z-20">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="text-white font-extrabold text-2xl leading-tight tracking-tight drop-shadow-lg">{recipe.name}</h3>
                      <span className={`shrink-0 text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg border backdrop-blur-md ${recipe.type === 'Veg' ? 'bg-green-500/20 text-green-300 border-green-400/30' : 'bg-red-500/20 text-red-300 border-red-400/30'}`}>{recipe.type}</span>
                    </div>
                  </div>

                  {/* Top Tags */}
                  <div className="absolute top-4 left-4 flex gap-2 z-20">
                    <span className="bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5"><span className="text-blue-400">P</span> {recipe.macros.protein}g</span>
                    <span className="bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5"><span className="text-yellow-400">C</span> {recipe.macros.carbs}g</span>
                  </div>

                  {/* Top Right Action Buttons */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2.5 z-20">
                    <button onClick={() => toggleLike(recipe.id)} className="group cursor-pointer bg-black/50 backdrop-blur-md p-2.5 rounded-full text-white hover:bg-black/80 transition-colors active:scale-95 outline-none [-webkit-tap-highlight-color:transparent]">
                      <svg className={`w-5 h-5 transition-transform ${recipe.isLiked ? 'fill-red-500 text-red-500 scale-110 drop-shadow-[0_0_8px_#ef444466]' : 'group-hover:text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                    </button>
                    <button onClick={() => handleShare(recipe.name)} className="cursor-pointer bg-black/50 backdrop-blur-md p-2.5 rounded-full text-white hover:bg-green-500 transition-colors active:scale-95 outline-none [-webkit-tap-highlight-color:transparent]">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
                    </button>
                    {user && user.id === recipe.authorId && (
                      <button onClick={() => handleDelete(recipe.id)} className="cursor-pointer bg-black/50 backdrop-blur-md p-2.5 rounded-full text-white hover:bg-red-500 transition-colors active:scale-95 outline-none [-webkit-tap-highlight-color:transparent]">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Details Section */}
                <div className="py-5 px-4 sm:p-5 flex-1 flex flex-col justify-between bg-transparent">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5"><span className="text-base">⏱️</span> {recipe.time}</span>
                      <span className="flex items-center gap-1.5 text-orange-500 dark:text-orange-400"><span className="text-base">🔥</span> {recipe.calories} cal</span>
                    </div>
                    <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-full border ${recipe.difficulty === 'Easy' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-transparent' : recipe.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-transparent' : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-transparent'}`}>
                      {recipe.difficulty}
                    </span>
                  </div>
                  
                  <button onClick={() => openCookMode(recipe)} className="cursor-pointer w-full mt-6 bg-slate-900 dark:bg-white/5 hover:bg-slate-800 dark:hover:bg-orange-500 text-white font-extrabold py-4 rounded-xl transition-all duration-300 flex justify-center items-center gap-2.5 group/btn shadow-[0_4px_15px_#00000033] dark:shadow-none active:scale-95 outline-none [-webkit-tap-highlight-color:transparent]">
                    <span>Start Cooking</span>
                    <svg className="w-5 h-5 opacity-50 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ========================================= */}
      {/* 🚀 MODAL 1: ADD RECIPE (FULL SCREEN) */}
      {/* ========================================= */}
      {mounted && isAddModalOpen && createPortal(
        <div className="fixed inset-0 z-[99999] bg-white dark:bg-[#07070a] flex flex-col animate-in slide-in-from-bottom-full duration-300">
          <div className="w-full max-w-4xl mx-auto flex flex-col h-full relative">
            
            {/* Header */}
            <div className="shrink-0 flex justify-between items-center px-6 py-5 border-b border-slate-100 dark:border-white/10 sticky top-0 bg-white dark:bg-[#07070a] z-50 shadow-sm dark:shadow-none">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">Create Recipe</h3>
              <button disabled={isSaving} onClick={() => setIsAddModalOpen(false)} className="cursor-pointer text-slate-500 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 dark:text-white w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50 transition-colors outline-none [-webkit-tap-highlight-color:transparent]">✕</button>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 sm:px-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <form onSubmit={handleAddRecipe} className="space-y-8 pb-10">
                
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !imageFile && !isCompressing && fileInputRef.current?.click()}
                  className={`relative w-full aspect-video sm:h-72 rounded-[2.5rem] border-2 border-dashed transition-all flex flex-col items-center justify-center group overflow-hidden outline-none [-webkit-tap-highlight-color:transparent] ${isDragging ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10' : 'border-slate-300 dark:border-white/20 hover:border-orange-500 bg-slate-50 dark:bg-[#0c0c10] cursor-pointer'}`}
                >
                  <input type="file" accept="image/*" onChange={handleImageChange} ref={fileInputRef} disabled={isCompressing || isSaving} className="hidden" />
                  
                  {isCompressing ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-orange-500 font-bold animate-pulse">Processing Image...</p>
                    </div>
                  ) : imageFile ? (
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/60">
                      <div className="absolute inset-0 bg-cover bg-center blur-xl opacity-60 scale-110" style={{ backgroundImage: `url(${imageFile})` }}></div>
                      <img src={imageFile} alt="Preview" className="relative z-10 w-full h-full object-contain drop-shadow-2xl p-1 rounded-xl" />
                      <button type="button" onClick={(e) => { e.stopPropagation(); setImageFile(null); }} className="absolute top-4 right-4 bg-black/70 hover:bg-red-500 text-white w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-lg z-20 cursor-pointer outline-none [-webkit-tap-highlight-color:transparent]">✕</button>
                    </div>
                  ) : (
                    <>
                      <svg className={`w-12 h-12 mb-4 text-slate-400 transition-transform duration-300 ${isDragging ? 'scale-125 text-orange-500' : 'group-hover:-translate-y-1 group-hover:text-orange-500'}`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                      </svg>
                      <p className="text-slate-700 dark:text-white font-extrabold text-base">{isDragging ? 'Drop Image Here!' : 'Upload Recipe Photo'}</p>
                      <p className="text-slate-400 text-sm mt-2 font-medium">High quality images get more likes</p>
                    </>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <input type="text" placeholder="Recipe Name" value={newName} onChange={(e) => setNewName(e.target.value)} disabled={isSaving} className="flex-1 w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white outline-none focus:border-orange-500 transition-all cursor-text disabled:opacity-50 placeholder:text-slate-400" required />
                  <div className="relative w-full sm:w-40 shrink-0">
                    <select value={newType} onChange={(e) => setNewType(e.target.value as any)} disabled={isSaving} className="w-full h-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-4 pr-10 py-4 text-slate-900 dark:text-white font-bold outline-none focus:border-orange-500 appearance-none disabled:opacity-50 cursor-pointer">
                      <option value="Veg" className="bg-white dark:bg-[#0b0b0e]">🥬 Veg</option>
                      <option value="Non-Veg" className="bg-white dark:bg-[#0b0b0e]">🥩 Meat</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <input type="number" placeholder="Mins" value={newTime} onChange={(e) => setNewTime(e.target.value)} disabled={isSaving} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white outline-none focus:border-orange-500 transition-all placeholder:text-slate-400 cursor-text font-bold" />
                  <input type="number" placeholder="Kcal" value={newCalories} onChange={(e) => setNewCalories(e.target.value)} disabled={isSaving} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white outline-none focus:border-orange-500 transition-all placeholder:text-slate-400 cursor-text font-bold" />
                  <div className="relative w-full col-span-2 sm:col-span-1">
                    <select value={newDifficulty} onChange={(e) => setNewDifficulty(e.target.value as any)} disabled={isSaving} className="w-full h-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-4 pr-10 py-4 text-slate-900 dark:text-white font-bold outline-none focus:border-orange-500 appearance-none cursor-pointer">
                      <option value="Easy" className="bg-white dark:bg-black">🟢 Easy</option>
                      <option value="Medium" className="bg-white dark:bg-black">🟡 Med</option>
                      <option value="Hard" className="bg-white dark:bg-black">🔴 Hard</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 p-5 rounded-3xl">
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mb-4 uppercase tracking-wider">Macros (per serving)</p>
                  <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    <div className="flex items-center bg-white dark:bg-black/40 rounded-2xl px-3 sm:px-4 py-3 border border-slate-200 dark:border-white/5 focus-within:border-orange-500 transition-colors shadow-sm dark:shadow-none">
                      <span className="text-blue-500 font-bold text-xs sm:text-sm mr-2">P</span>
                      <input type="number" placeholder="0" value={newProtein} onChange={(e) => setNewProtein(e.target.value)} className="w-full bg-transparent text-slate-900 dark:text-white font-bold outline-none text-sm sm:text-base placeholder:text-slate-400 cursor-text" />
                      <span className="text-slate-400 text-xs sm:text-sm font-bold">g</span>
                    </div>
                    <div className="flex items-center bg-white dark:bg-black/40 rounded-2xl px-3 sm:px-4 py-3 border border-slate-200 dark:border-white/5 focus-within:border-orange-500 transition-colors shadow-sm dark:shadow-none">
                      <span className="text-yellow-500 font-bold text-xs sm:text-sm mr-2">C</span>
                      <input type="number" placeholder="0" value={newCarbs} onChange={(e) => setNewCarbs(e.target.value)} className="w-full bg-transparent text-slate-900 dark:text-white font-bold outline-none text-sm sm:text-base placeholder:text-slate-400 cursor-text" />
                      <span className="text-slate-400 text-xs sm:text-sm font-bold">g</span>
                    </div>
                    <div className="flex items-center bg-white dark:bg-black/40 rounded-2xl px-3 sm:px-4 py-3 border border-slate-200 dark:border-white/5 focus-within:border-orange-500 transition-colors shadow-sm dark:shadow-none">
                      <span className="text-red-500 font-bold text-xs sm:text-sm mr-2">F</span>
                      <input type="number" placeholder="0" value={newFats} onChange={(e) => setNewFats(e.target.value)} className="w-full bg-transparent text-slate-900 dark:text-white font-bold outline-none text-sm sm:text-base placeholder:text-slate-400 cursor-text" />
                      <span className="text-slate-400 text-xs sm:text-sm font-bold">g</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 p-5 rounded-3xl space-y-4">
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Ingredients</p>
                  {newIngredients.map((ing, idx) => (
                    <div key={`ing-${idx}`} className="flex gap-3 items-center">
                      <div className="w-6 text-center text-sm font-bold text-slate-400">{idx + 1}.</div>
                      <input type="text" placeholder="e.g. 2 Chopped Onions" value={ing} onChange={(e) => handleIngredientChange(idx, e.target.value)} disabled={isSaving} className="flex-1 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-medium outline-none focus:border-orange-500 transition-all cursor-text shadow-sm dark:shadow-none" required />
                      {newIngredients.length > 1 && (
                        <button type="button" onClick={() => removeIngredientField(idx)} className="text-slate-400 hover:text-red-500 p-2 transition-colors cursor-pointer active:scale-95 outline-none [-webkit-tap-highlight-color:transparent]">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addIngredientField} className="cursor-pointer text-orange-500 font-bold text-base flex items-center gap-1.5 mt-2 ml-9 hover:underline outline-none [-webkit-tap-highlight-color:transparent]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg> Add Ingredient
                  </button>
                </div>

                <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 p-5 rounded-3xl space-y-4">
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Cooking Steps</p>
                  {newSteps.map((step, idx) => (
                    <div key={`step-${idx}`} className="flex gap-3 items-start">
                      <div className="w-6 pt-4 text-center text-sm font-bold text-slate-400">{idx + 1}.</div>
                      <textarea placeholder="e.g. Heat oil in a pan..." value={step} onChange={(e) => handleStepChange(idx, e.target.value)} disabled={isSaving} rows={2} className="flex-1 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-medium outline-none focus:border-orange-500 transition-all resize-none cursor-text shadow-sm dark:shadow-none" required></textarea>
                      {newSteps.length > 1 && (
                        <button type="button" onClick={() => removeStepField(idx)} className="text-slate-400 hover:text-red-500 p-2 mt-2 transition-colors cursor-pointer active:scale-95 outline-none [-webkit-tap-highlight-color:transparent]">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addStepField} className="cursor-pointer text-orange-500 font-bold text-base flex items-center gap-1.5 mt-2 ml-9 hover:underline outline-none [-webkit-tap-highlight-color:transparent]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg> Add Step
                  </button>
                </div>
                
                <div className="pt-4">
                  <button type="submit" disabled={isSaving || isCompressing} className="cursor-pointer w-full bg-linear-to-r from-orange-500 to-red-500 text-white font-black py-5 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_8px_20px_#f973164d] flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed outline-none [-webkit-tap-highlight-color:transparent]">
                    {isSaving ? (
                      <><div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Uploading Magic...</>
                    ) : "Save to Cloud"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================= */}
      {/* 🔥 MODAL 2: COOK MODE UX (FULL SCREEN) */}
      {/* ========================================= */}
      {mounted && cookModeRecipe && createPortal(
        <div className="fixed inset-0 z-[99999] bg-white dark:bg-[#07070a] flex flex-col animate-in slide-in-from-bottom-full duration-500">
          <div className="w-full max-w-4xl mx-auto flex flex-col h-full relative">
            
            <div className="shrink-0 pt-10 pb-4 px-6 sm:px-10 bg-white dark:bg-[#07070a] border-b border-slate-100 dark:border-white/5 relative z-20">
              <button onClick={() => setCookModeRecipe(null)} className="absolute top-8 right-6 sm:right-10 cursor-pointer bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/20 transition-colors outline-none [-webkit-tap-highlight-color:transparent]">✕</button>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6 pr-14 leading-tight">{cookModeRecipe.name}</h3>
              
              <div className="flex gap-1.5 mb-2">
                <div className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${currentStep === -1 ? 'bg-orange-500' : 'bg-slate-200 dark:bg-white/10'}`}></div>
                {cookModeRecipe.steps.map((_, idx) => (
                  <div key={idx} className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${currentStep >= idx ? 'bg-orange-500' : 'bg-slate-200 dark:bg-white/10'}`}></div>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {currentStep === -1 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-10">
                  <div className="bg-linear-to-r from-orange-50 to-red-50 dark:from-orange-500/10 dark:to-red-500/5 border border-orange-200 dark:border-orange-500/20 p-6 rounded-[2rem] flex justify-between items-center">
                    <div>
                      <span className="text-orange-600 dark:text-orange-400 font-extrabold text-base block">Serving Size</span>
                    </div>
                    <div className="flex items-center gap-5 bg-white dark:bg-black/40 p-2 rounded-2xl border border-orange-100 dark:border-white/5 shadow-sm dark:shadow-none">
                      <button onClick={() => setPortions(Math.max(1, portions - 1))} className="cursor-pointer w-12 h-12 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-900 dark:text-white font-black text-xl active:scale-95 transition-transform outline-none [-webkit-tap-highlight-color:transparent]">-</button>
                      <span className="font-black text-slate-900 dark:text-white w-8 text-center text-xl">{portions}</span>
                      <button onClick={() => setPortions(portions + 1)} className="cursor-pointer w-12 h-12 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-900 dark:text-white font-black text-xl active:scale-95 transition-transform outline-none [-webkit-tap-highlight-color:transparent]">+</button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-slate-900 dark:text-white font-black text-xl mb-5">Ingredients</h4>
                    <ul className="grid grid-cols-1 gap-4">
                      {cookModeRecipe.ingredients.map((ing, i) => (
                        <li key={i} className="flex items-center gap-5 bg-slate-50 dark:bg-white/[0.02] p-5 rounded-2xl border border-slate-100 dark:border-white/5">
                          <span className="text-slate-700 dark:text-white font-bold text-lg">{ing} <span className="text-orange-500 dark:text-orange-400 ml-2">(x{portions})</span></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {currentStep >= 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-10 animate-in zoom-in-95 duration-500">
                  <div className="w-32 h-32 rounded-full bg-linear-to-br from-orange-400 to-red-500 flex items-center justify-center text-5xl font-black text-white shadow-[0_8px_30px_#f9731666]">{currentStep + 1}</div>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-white px-4 leading-relaxed">{cookModeRecipe.steps[currentStep]}</h2>
                </div>
              )}
            </div>

            <div className="shrink-0 p-6 sm:px-10 pb-8 bg-linear-to-t from-white dark:from-[#07070a] to-transparent relative z-20">
              {currentStep === -1 ? (
                <button onClick={() => setCurrentStep(0)} className="cursor-pointer w-full bg-slate-900 dark:bg-white text-white dark:text-black font-black text-xl py-5 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all outline-none [-webkit-tap-highlight-color:transparent] shadow-[0_8px_30px_#00000033] dark:shadow-[0_8px_30px_#ffffff33]">Let's Start Cooking</button>
              ) : (
                <div className="flex gap-4">
                  <button onClick={() => setCurrentStep(currentStep - 1)} className="cursor-pointer w-1/3 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white font-extrabold text-lg py-5 rounded-2xl transition-colors active:scale-95 outline-none [-webkit-tap-highlight-color:transparent]">Back</button>
                  <button onClick={() => { if (currentStep < cookModeRecipe.steps.length - 1) setCurrentStep(currentStep + 1); else setCookModeRecipe(null); }} className={`cursor-pointer w-2/3 text-white font-extrabold text-lg py-5 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg outline-none [-webkit-tap-highlight-color:transparent] ${currentStep === cookModeRecipe.steps.length - 1 ? 'bg-green-500 hover:bg-green-600 shadow-[0_8px_20px_#22c55e66]' : 'bg-orange-500 hover:bg-orange-600 shadow-[0_8px_20px_#f9731666]'}`}>
                    {currentStep === cookModeRecipe.steps.length - 1 ? "Finish Meal 🍽️" : "Next Step"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
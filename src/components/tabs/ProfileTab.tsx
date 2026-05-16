"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
// 🚀 Library imports
import Cropper from 'react-easy-crop';
import { getCroppedImg } from "@/lib/cropUtils";

export default function ProfileTab({ user }: { user: any }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  // --- USER DATA STATES ---
  const [profile, setProfile] = useState<any>(null);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [savedPosts, setSavedPosts] = useState<any[]>([]); 
  const [savedRecipeIds, setSavedRecipeIds] = useState<string[]>([]); 
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // --- UI STATES ---
  const [activeTab, setActiveTab] = useState<"posts" | "saved">("posts");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: "" });
  const [unsaveConfirmId, setUnsaveConfirmId] = useState<string | null>(null);

  // --- COOK MODE STATES ---
  const [cookModePost, setCookModePost] = useState<any | null>(null);
  const [portions, setPortions] = useState(1);
  const [currentStep, setCurrentStep] = useState(-1);

  // --- EDIT PROFILE STATES ---
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  // --- ADVANCED IMAGE STATES ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [pendingAvatarBlob, setPendingAvatarBlob] = useState<Blob | null>(null);
  const [pendingAvatarPreview, setPendingAvatarPreview] = useState<string | null>(null);

  // --- SETTINGS STATES ---
  const [notifications, setNotifications] = useState(true);
  const [mealPlanAlerts, setMealPlanAlerts] = useState(false);
  const [isMetric, setIsMetric] = useState(true); 
  const [theme, setTheme] = useState<"orange" | "green" | "blue">("orange");
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [aiMessage, setAiMessage] = useState(`Hi Chef! What are we cooking today?`);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const showToast = (msg: string) => {
    setToast({ isOpen: true, message: msg });
    setTimeout(() => setToast({ isOpen: false, message: "" }), 3000);
  };

  useEffect(() => {
    setMounted(true);
    if (user) {
      setAiMessage(`Hi ${user?.user_metadata?.full_name?.split(" ")[0] || "Chef"}! What are we cooking today?`);
      fetchProfileData();
    }
    return () => {
        if (pendingAvatarPreview) URL.revokeObjectURL(pendingAvatarPreview);
    }
  }, [user, pendingAvatarPreview]);

  const fetchProfileData = async () => {
    setIsLoading(true);
    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (profileData) {
      setProfile(profileData);
      setEditName(profileData.full_name || "");
      setEditUsername(profileData.username || "");
      setEditBio(profileData.bio || "");

      const savedIds = profileData.saved_recipes || [];
      setSavedRecipeIds(savedIds);
      if (savedIds.length > 0) {
        const { data: sRecipes } = await supabase.from("recipes").select("*").in("id", savedIds);
        if (sRecipes) setSavedPosts(sRecipes);
      } else {
        setSavedPosts([]);
      }
    }

    const { data: recipes } = await supabase.from("recipes").select("*").eq("author_id", user.id).order("created_at", { ascending: false });
    if (recipes) {
      setMyPosts(recipes);
      setStats((prev: any) => ({ ...prev, posts: recipes.length }));
    }

    const { count: followersCount } = await supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", user.id);
    const { count: followingCount } = await supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", user.id);
    
    setStats((prev: any) => ({ ...prev, followers: followersCount || 0, following: followingCount || 0 }));
    setIsLoading(false);
  };

  const openCookMode = (post: any) => {
    setCookModePost(post);
    setPortions(1);
    setCurrentStep(-1);
  };

  const handleUnsaveClick = (e: React.MouseEvent, recipeId: string) => {
    e.stopPropagation(); 
    setUnsaveConfirmId(recipeId);
  };

  const confirmUnsave = async () => {
    if (!unsaveConfirmId) return;
    const newSavedIds = savedRecipeIds.filter(id => id !== unsaveConfirmId);
    setSavedRecipeIds(newSavedIds);
    setSavedPosts(savedPosts.filter(p => p.id !== unsaveConfirmId)); 
    await supabase.from("profiles").update({ saved_recipes: newSavedIds }).eq("id", user.id);
    showToast("Removed from Vault 🔓");
    setUnsaveConfirmId(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsProcessingImage(true);
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageToCrop(reader.result as string);
        setIsProcessingImage(false);
        setZoom(1); 
      });
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixelsData: any) => {
    setCroppedAreaPixels(croppedAreaPixelsData);
  }, []);

  const handleSaveCrop = async () => {
    try {
      if (!imageToCrop || !croppedAreaPixels) return;
      setIsProcessingImage(true);
      showToast("Fixing & Compressing image... ✂️⏳");

      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (croppedBlob) {
        if (pendingAvatarPreview) URL.revokeObjectURL(pendingAvatarPreview);
        const previewUrl = URL.createObjectURL(croppedBlob);
        setPendingAvatarPreview(previewUrl);
        setPendingAvatarBlob(croppedBlob);
        showToast("Photo fixed! Click 'Save Changes' to upload. ✅");
      }
      setImageToCrop(null);
    } catch (e) {
      console.error(e);
      showToast("Failed to crop image.");
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const submitProfileSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    showToast("Saving your profile... ⏳");

    try {
        const cleanUsername = editUsername.toLowerCase().trim().replace(/\s+/g, '_');
        const { data: existing } = await supabase.from("profiles").select("id").eq("username", cleanUsername).neq("id", user.id).single();
        if (existing) {
          showToast("Username is already taken! ❌");
          setIsSaving(false);
          return;
        }

        let finalAvatarUrl = profile?.avatar_url;

        if (pendingAvatarBlob) {
            setIsProcessingImage(true);
            const fileName = `${user.id}-${Date.now()}.jpg`;
            const filePath = `${fileName}`;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, pendingAvatarBlob, { contentType: 'image/jpeg', upsert: true });
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
            finalAvatarUrl = publicUrl;
        }

        const { error: updateError } = await supabase.from("profiles").update({
          full_name: editName,
          username: cleanUsername,
          bio: editBio,
          avatar_url: finalAvatarUrl
        }).eq("id", user.id);

        if (updateError) throw updateError;

        setProfile((prev: any) => ({ ...prev, full_name: editName, username: cleanUsername, bio: editBio, avatar_url: finalAvatarUrl }));
        setPendingAvatarBlob(null);
        if (pendingAvatarPreview) URL.revokeObjectURL(pendingAvatarPreview);
        setPendingAvatarPreview(null);
        showToast("Profile Saved Successfully! ✨✅");
        setIsEditOpen(false); 
    } catch (error: any) {
        console.error(error);
        showToast(error.message || "Failed to save profile. ❌");
    } finally {
        setIsSaving(false);
        setIsProcessingImage(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput("");
    setAiMessage(userMsg);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setAiMessage(`I've noted "${userMsg}". Check the Global Feed for some magical ideas! ✨`);
    }, 1500);
  };

  const handleExportData = () => {
    setIsExporting(true);
    setExportSuccess(false);
    setTimeout(() => {
      setIsExporting(false);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    }, 2000);
  };

  const themeColors = {
    orange: { from: "from-orange-400", to: "to-red-500", text: "text-orange-500", bg: "bg-orange-500", glow: "shadow-[0_0_40px_#f9731666]", border: "border-orange-500", rawFrom: '#fb923c' },
    green: { from: "from-green-400", to: "to-emerald-500", text: "text-green-500", bg: "bg-green-500", glow: "shadow-[0_0_40px_#22c55e66]", border: "border-green-500", rawFrom: '#4ade80' },
    blue: { from: "from-blue-400", to: "to-indigo-500", text: "text-blue-500", bg: "bg-blue-500", glow: "shadow-[0_0_40px_#3b82f666]", border: "border-blue-500", rawFrom: '#60a5fa' }
  };
  const activeTheme = themeColors[theme];
  const initial = profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "C";

  const cropperClasses = "fixed inset-0 z-[99999] bg-black flex flex-col animate-in fade-in duration-300";
  const cropperBoxClasses = "relative flex-1 bg-black sm:bg-slate-900 sm:m-10 sm:rounded-3xl overflow-hidden shadow-2xl border border-white/5 flex items-center justify-center";

  if (isLoading) return <div className="flex items-center justify-center h-screen"><div className={`w-12 h-12 border-4 ${activeTheme.border} border-t-transparent rounded-full animate-spin`}></div></div>;

  return (
    <div className="animate-in fade-in duration-700 pb-24 w-full max-w-5xl mx-auto bg-slate-50 dark:bg-[#07070a] min-h-screen relative overflow-x-hidden selection:bg-orange-500/20">
      
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-[400px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] ${activeTheme.from}/10 via-transparent to-transparent pointer-events-none -z-10`}></div>

      {/* --- PREMIUM HEADER --- */}
      <div className="flex justify-between items-center px-6 py-4 sticky top-0 bg-slate-50/80 dark:bg-[#07070a]/80 backdrop-blur-xl z-40">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
          {profile?.username || "chef_zestly"} 
          <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-green-500 animate-pulse"></span>
        </h2>
        <button onClick={() => setIsMenuOpen(true)} className="p-2 -mr-2 shrink-0 cursor-pointer text-slate-900 dark:text-white outline-none active:scale-90 transition-transform [-webkit-tap-highlight-color:transparent] group flex flex-col gap-1.5 items-end">
          <div className="w-7 h-[3px] bg-current rounded-full transition-all"></div>
          <div className="w-5 h-[3px] bg-current rounded-full group-hover:w-7 transition-all"></div>
          <div className="w-7 h-[3px] bg-current rounded-full transition-all"></div>
        </button>
      </div>

      {/* --- MODERN PROFILE INFO --- */}
      <div className="px-6 pt-8 pb-4 max-w-4xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 relative sm:p-4">
          
          <div className="relative shrink-0 group flex items-center justify-center">
            {/* 🚀 FIXED: Glow reduced so it doesn't overlap the navbar or get cut off */}
            <div className={`absolute -inset-4 sm:-inset-6 bg-gradient-to-tr ${activeTheme.from} ${activeTheme.to} rounded-full blur-2xl opacity-25 group-hover:opacity-45 transition-all duration-700 pointer-events-none z-0`}></div>
            
            <div className={`relative z-10 w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr ${activeTheme.from} ${activeTheme.to} p-[4px] shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-transform group-hover:scale-[1.03]`}>
              <div className="w-full h-full bg-white dark:bg-[#121216] rounded-full flex items-center justify-center text-4xl sm:text-5xl font-black text-slate-900 dark:text-white border-4 border-white dark:border-[#07070a] uppercase transition-colors overflow-hidden relative">
                {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Profile" /> : initial}
                {(isSaving || isProcessingImage) && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>}
              </div>
            </div>
            <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 z-20 bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border-2 border-white dark:border-[#07070a] shadow-lg">PRO</div>
          </div>
          
          <div className="flex-1 w-full text-center sm:text-left mt-2 sm:mt-6 z-10 relative">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">{profile?.full_name || "Head Chef"}</h1>
            <p className={`${activeTheme.text} text-xs sm:text-sm font-bold mb-3 uppercase tracking-wider`}>Culinary Artist</p>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium whitespace-pre-wrap leading-relaxed max-w-lg mx-auto sm:mx-0">
              {profile?.bio || "Passionate Chef at Zestly 🍳\nTurning raw ingredients into pure magic!"}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center bg-white/60 dark:bg-white/[0.03] backdrop-blur-md border border-slate-200/50 dark:border-white/10 rounded-[1.5rem] py-5 px-6 mt-8 shadow-sm dark:shadow-none">
          <div className="flex flex-col items-center flex-1"><span className="text-2xl font-black text-slate-900 dark:text-white">{stats.posts}</span><span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest mt-0.5">Posts</span></div>
          <div className="w-px h-10 bg-slate-200 dark:bg-white/10"></div>
          <div className="flex flex-col items-center flex-1"><span className="text-2xl font-black text-slate-900 dark:text-white">{stats.followers}</span><span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest mt-0.5">Followers</span></div>
          <div className="w-px h-10 bg-slate-200 dark:bg-white/10"></div>
          <div className="flex flex-col items-center flex-1"><span className="text-2xl font-black text-slate-900 dark:text-white">{stats.following}</span><span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest mt-0.5">Following</span></div>
        </div>

        <div className="flex gap-4 mt-6">
          <button onClick={() => setIsEditOpen(true)} className={`flex-1 bg-gradient-to-tr ${activeTheme.from} ${activeTheme.to} text-white font-extrabold py-3.5 rounded-2xl text-sm sm:text-base transition-all active:scale-95 outline-none [-webkit-tap-highlight-color:transparent] shadow-md hover:shadow-lg`}>Edit Profile</button>
          <button onClick={() => showToast("Profile Link Copied! 🔗")} className="flex-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-900 dark:text-white font-extrabold py-3.5 rounded-2xl text-sm sm:text-base transition-all active:scale-95 outline-none [-webkit-tap-highlight-color:transparent] shadow-sm dark:shadow-none">Share Profile</button>
        </div>
      </div>

      {/* --- PILL-STYLE SEGMENTED TABS --- */}
      <div className="px-6 mt-6 mb-4 max-w-4xl mx-auto w-full">
        <div className="flex bg-slate-200/50 dark:bg-[#1c1c1e] p-1.5 rounded-2xl gap-1">
          <button onClick={() => setActiveTab("posts")} className={`flex-1 py-3 flex justify-center items-center gap-2 rounded-xl transition-all duration-300 outline-none [-webkit-tap-highlight-color:transparent] font-bold text-sm ${activeTab === "posts" ? "bg-white dark:bg-[#2c2c2e] text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zm0 11h7v7h-7v-7zM3 14h7v7H3v-7z"/></svg> Recipes
          </button>
          <button onClick={() => setActiveTab("saved")} className={`flex-1 py-3 flex justify-center items-center gap-2 rounded-xl transition-all duration-300 outline-none [-webkit-tap-highlight-color:transparent] font-bold text-sm ${activeTab === "saved" ? "bg-white dark:bg-[#2c2c2e] text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg> Saved
          </button>
        </div>
      </div>

      {/* --- ATTRACTIVE POSTS GRID --- */}
      {activeTab === "posts" && (
        <div className="px-5 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
            {myPosts.length === 0 ? (
              <div className="col-span-full text-center py-24 bg-white dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 rounded-[2rem] mt-2">
                <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-tr ${activeTheme.from} ${activeTheme.to} opacity-20 mb-4`}></div>
                <p className="font-bold text-slate-900 dark:text-white text-lg">No Masterpieces Yet</p>
                <p className="text-slate-500 text-sm mt-1">Your created recipes will appear here.</p>
              </div>
            ) : (
              myPosts.map(post => (
                <div key={post.id} onClick={() => openCookMode({ ...post, ingredients: post.ingredients || ["Secret Ingredient"], steps: post.steps || ["Cook with love!"] })} className="aspect-square relative cursor-pointer group bg-slate-100 dark:bg-[#121216] rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-lg transition-all outline-none [-webkit-tap-highlight-color:transparent]">
                  {post.image_url ? (
                    <img src={post.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${post.gradient || activeTheme.from} flex items-center justify-center group-hover:scale-110 transition-transform duration-700`}>
                      <span className="text-4xl sm:text-6xl drop-shadow-lg">{post.emoji || '🍲'}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 text-white font-black transition-all duration-300">
                    <span className="flex items-center gap-1.5 text-lg"><svg className="w-6 h-6 fill-white" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg> {post.likes_count || 0}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 🚀 UPGRADED: SAVED VAULT SECTION */}
      {activeTab === "saved" && (
        <div className="px-5 sm:px-6">
          {savedPosts.length === 0 ? (
            <div className="text-center py-24 bg-white dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 rounded-[2rem] mt-2">
              <span className="text-4xl block mb-4 opacity-50">🔒</span>
              <p className="font-bold text-slate-900 dark:text-white text-lg">Private Vault</p>
              <p className="text-slate-500 text-sm mt-1">Only you can see what you've saved.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
              {savedPosts.map((post) => (
                <div key={post.id} onClick={() => openCookMode({ ...post, ingredients: post.ingredients || ["Secret Ingredient"], steps: post.steps || ["Cook with love!"] })} className="aspect-square relative cursor-pointer group bg-slate-100 dark:bg-[#121216] rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-lg transition-all">
                  {post.image_url ? (
                    <img src={post.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${post.gradient || activeTheme.from} flex items-center justify-center group-hover:scale-110 transition-transform duration-700`}>
                      <span className="text-4xl sm:text-6xl drop-shadow-lg">{post.emoji || '🍲'}</span>
                    </div>
                  )}
                  
                  <button 
                    onClick={(e) => handleUnsaveClick(e, post.id)} 
                    className="absolute top-3 right-3 p-2.5 bg-black/50 hover:bg-red-500/80 backdrop-blur-md rounded-full text-white transition-all z-20 outline-none shadow-md cursor-pointer active:scale-90"
                    title="Remove from Vault"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>

                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 text-white font-black transition-all duration-300 pointer-events-none">
                    <span className="flex items-center gap-1.5 text-lg">
                      <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg> 
                      {post.likes_count || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================= */}
      {/* 🚀 LEVEL 1: SLEEK SIDE MENU (DRAWER) */}
      {/* ========================================= */}
      {mounted && isMenuOpen && createPortal(
        <div className="fixed inset-0 z-[99998] flex justify-end bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-all" onClick={() => setIsMenuOpen(false)}>
          <div className="w-[80%] sm:w-[380px] h-full bg-white dark:bg-[#121216] shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col border-l border-slate-200 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 dark:border-white/5 relative z-10 bg-white dark:bg-[#121216]">
              <h3 className="font-black text-slate-900 dark:text-white text-xl">Menu</h3>
              <button onClick={() => setIsMenuOpen(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 rounded-full text-slate-900 dark:text-white transition-colors outline-none [-webkit-tap-highlight-color:transparent]">✕</button>
            </div>
            <div className="flex-1 flex flex-col py-3 overflow-y-auto">
              <button onClick={() => { setIsMenuOpen(false); setIsSettingsOpen(true); }} className="flex items-center gap-5 px-6 py-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left outline-none [-webkit-tap-highlight-color:transparent] group">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#1c1c1e] flex items-center justify-center text-xl shadow-sm group-hover:scale-105 transition-transform">⚙️</div>
                <div>
                  <span className="block font-bold text-slate-900 dark:text-white text-base">Settings & Privacy</span>
                  <span className="block text-xs text-slate-500 font-medium mt-0.5">Theme, units, alerts & AI</span>
                </div>
              </button>
              <button onClick={() => { setIsMenuOpen(false); showToast("QR Code generated! 🔲"); }} className="flex items-center gap-5 px-6 py-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left outline-none [-webkit-tap-highlight-color:transparent] group">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#1c1c1e] flex items-center justify-center text-xl shadow-sm group-hover:scale-105 transition-transform">🔲</div>
                <div>
                  <span className="block font-bold text-slate-900 dark:text-white text-base">My QR Code</span>
                  <span className="block text-xs text-slate-500 font-medium mt-0.5">Share your profile instantly</span>
                </div>
              </button>
              <button onClick={() => { setIsMenuOpen(false); handleExportData(); }} className="flex items-center gap-5 px-6 py-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left outline-none [-webkit-tap-highlight-color:transparent] group">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#1c1c1e] flex items-center justify-center text-xl shadow-sm group-hover:scale-105 transition-transform">☁️</div>
                <div>
                  <span className="block font-bold text-slate-900 dark:text-white text-base">Cloud Backup</span>
                  <span className="block text-xs text-slate-500 font-medium mt-0.5">Export all your recipes</span>
                </div>
              </button>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-white/5 mt-auto relative z-10 bg-white dark:bg-[#121216]">
              <button onClick={handleLogout} className="w-full font-black text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-500/10 py-4 rounded-2xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-all outline-none [-webkit-tap-highlight-color:transparent] active:scale-95 disabled:opacity-50">Log Out</button>
            </div>
          </div>
        </div>, document.body
      )}

      {/* ========================================= */}
      {/* 🚀 LEVEL 2: FULL-SCREEN SETTINGS MODAL */}
      {/* ========================================= */}
      {mounted && isSettingsOpen && createPortal(
        <div className="fixed inset-0 z-[99999] bg-slate-50 dark:bg-[#07070a] flex flex-col animate-in slide-in-from-right duration-300">
          <div className="shrink-0 flex items-center px-4 py-4 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#07070a]/80 backdrop-blur-xl sticky top-0 z-10 gap-4">
            <button onClick={() => { setIsSettingsOpen(false); setIsMenuOpen(true); }} className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-slate-900 dark:text-white outline-none [-webkit-tap-highlight-color:transparent] transition-colors cursor-pointer disabled:opacity-50">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            </button>
            <h3 className="font-black text-slate-900 dark:text-white text-2xl tracking-tight">Settings & Privacy</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] max-w-4xl mx-auto w-full">
            <div className="bg-white dark:bg-[#121216] rounded-[2rem] p-6 shadow-[0_8px_30px_#0000000a] dark:shadow-none border border-slate-100 dark:border-white/5">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Visual & App Preferences</h4>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-base block mb-1">Theme Color</span>
                  <span className="text-xs text-slate-500 font-medium">Personalize your UI</span>
                </div>
                <div className="flex gap-2.5 bg-slate-50 dark:bg-[#1c1c1e] p-1.5 rounded-full border border-slate-100 dark:border-white/5">
                  <button onClick={() => setTheme("orange")} className={`w-8 h-8 rounded-full bg-orange-500 border-2 ${theme === 'orange' ? 'border-slate-900 dark:border-white shadow-md scale-110' : 'border-transparent'} transition-all`}></button>
                  <button onClick={() => setTheme("green")} className={`w-8 h-8 rounded-full bg-green-500 border-2 ${theme === 'green' ? 'border-slate-900 dark:border-white shadow-md scale-110' : 'border-transparent'} transition-all`}></button>
                  <button onClick={() => setTheme("blue")} className={`w-8 h-8 rounded-full bg-blue-500 border-2 ${theme === 'blue' ? 'border-slate-900 dark:border-white shadow-md scale-110' : 'border-transparent'} transition-all`}></button>
                </div>
              </div>
              <div className="h-px w-full bg-slate-100 dark:bg-white/5 mb-6"></div>
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-base block mb-1">Measurement Units</span>
                  <span className="text-xs text-slate-500 font-medium">Switch between Metric & Imperial</span>
                </div>
                <button onClick={() => setIsMetric(!isMetric)} className="bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-900 dark:text-white transition-colors cursor-pointer active:scale-95 outline-none [-webkit-tap-highlight-color:transparent] disabled:opacity-50">
                  {isMetric ? "Metric (Kg/L)" : "Imperial (Lbs/Oz)"}
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-[#121216] rounded-[2rem] p-6 shadow-[0_8px_30px_#0000000a] dark:shadow-none border border-slate-100 dark:border-white/5">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Alerts & Notifications</h4>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-base block mb-1">Push Notifications</span>
                  <span className="text-xs text-slate-500 font-medium">Get likes, follows & comments alerts</span>
                </div>
                <div onClick={() => setNotifications(!notifications)} className={`w-14 h-8 shrink-0 rounded-full p-1 cursor-pointer transition-colors duration-300 ${notifications ? activeTheme.bg : 'bg-slate-200 dark:bg-white/10'}`}>
                  <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${notifications ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
              </div>
              <div className="h-px w-full bg-slate-100 dark:bg-white/5 mb-6"></div>
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-base block mb-1">Meal Plan Reminders</span>
                  <span className="text-xs text-slate-500 font-medium">Daily cooking schedule prompts</span>
                </div>
                <div onClick={() => setMealPlanAlerts(!mealPlanAlerts)} className={`w-14 h-8 shrink-0 rounded-full p-1 cursor-pointer transition-colors duration-300 ${mealPlanAlerts ? activeTheme.bg : 'bg-slate-200 dark:bg-white/10'}`}>
                  <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${mealPlanAlerts ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#121216] rounded-[2rem] p-6 shadow-[0_8px_30px_#0000000a] dark:shadow-none border border-slate-100 dark:border-white/5 relative overflow-hidden group">
              <div className={`absolute top-0 right-0 w-32 h-32 bg-linear-to-br ${activeTheme.from} ${activeTheme.to} opacity-10 rounded-bl-[100px] pointer-events-none transition-all group-hover:scale-110`}></div>
              <div className="flex gap-3 items-center mb-5 relative z-10">
                <div className={`w-10 h-10 shrink-0 rounded-[1rem] bg-linear-to-tr ${activeTheme.from} ${activeTheme.to} flex items-center justify-center text-xl shadow-lg`}>🤖</div>
                <h4 className="font-black text-slate-900 dark:text-white text-lg">AI Chef Assistant</h4>
              </div>
              <div className="bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 p-4 rounded-2xl mb-4 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-inner relative z-10">
                {isTyping ? "Thinking of recipes..." : aiMessage}
              </div>
              <div className="flex gap-2.5 relative z-10">
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendChat()} placeholder="e.g., Substitute for eggs?" className="flex-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-3.5 rounded-2xl text-sm outline-none text-slate-900 dark:text-white focus:border-orange-500 transition-colors disabled:opacity-60" disabled={isTyping} />
                <button onClick={handleSendChat} disabled={isTyping || !chatInput.trim()} className={`bg-linear-to-tr ${activeTheme.from} ${activeTheme.to} text-white px-5 rounded-2xl font-black transition-transform active:scale-95 disabled:opacity-50 shadow-md flex items-center justify-center outline-none [-webkit-tap-highlight-color:transparent]`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>, document.body
      )}

      {/* ======================================================= */}
      {/* 🚀 LEVEL 2: 🔥 SLEEK & FULL-SCREEN EDIT PROFILE MODAL */}
      {/* ======================================================= */}
      {mounted && isEditOpen && createPortal(
        <div className="fixed inset-0 z-[99998] bg-slate-50 dark:bg-[#07070a] flex flex-col transition-all overflow-hidden">
          <div className="shrink-0 flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/90 dark:bg-[#07070a]/90 backdrop-blur-xl sticky top-0 z-50">
              <button onClick={() => { setIsEditOpen(false); setPendingAvatarBlob(null); if (pendingAvatarPreview) URL.revokeObjectURL(pendingAvatarPreview); setPendingAvatarPreview(null); }} className="text-sm font-bold text-slate-600 dark:text-slate-300 transition-colors outline-none" disabled={isSaving || isProcessingImage}>Cancel</button>
              <h3 className="font-black text-slate-900 dark:text-white text-xl tracking-tight">Edit Profile</h3>
              <button onClick={() => { setIsEditOpen(false); setPendingAvatarBlob(null); if (pendingAvatarPreview) URL.revokeObjectURL(pendingAvatarPreview); setPendingAvatarPreview(null); }} className={`text-sm font-black ${activeTheme.text} outline-none disabled:opacity-50`} disabled={isSaving || isProcessingImage}>Done</button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 sm:p-10 [&::-webkit-scrollbar]:hidden">
            <form className="w-full max-w-lg mx-auto flex flex-col items-center pb-10" onSubmit={submitProfileSettings}>
               
               {/* 🚀 AVATAR UPLOAD SECTION */}
               <div className="relative group cursor-pointer mb-8 shrink-0 flex items-center justify-center" onClick={() => fileInputRef.current?.click()}>
                 {/* 🚀 FIXED: Modal DP Glow */}
                 <div className={`absolute -inset-4 sm:-inset-6 bg-gradient-to-tr ${activeTheme.from} ${activeTheme.to} rounded-full blur-2xl opacity-25 group-hover:opacity-45 transition-all duration-700 pointer-events-none z-0`}></div>
                 
                 <div className={`relative z-10 w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr ${activeTheme.from} ${activeTheme.to} p-[4px] shadow-2xl transition-transform group-hover:scale-[1.03]`}>
                   <div className="w-full h-full bg-white dark:bg-[#121216] rounded-full flex items-center justify-center text-5xl font-black text-slate-900 dark:text-white border-4 border-white dark:border-[#07070a] uppercase overflow-hidden relative">
                     {pendingAvatarPreview ? <img src={pendingAvatarPreview} className="w-full h-full object-cover" /> : profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : initial}
                     <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg></div>
                     {(isProcessingImage || isSaving) && <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10"><svg className="animate-spin h-7 w-7 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>}
                   </div>
                 </div>
                 <div className={`absolute bottom-1 right-1 sm:bottom-2 sm:right-2 z-20 bg-white dark:bg-[#121216] ${activeTheme.text} w-9 h-9 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-100 dark:border-white/5 group-hover:scale-110 transition-transform`}><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg></div>
               </div>
               
               <input type="file" accept="image/jpeg, image/png, image/webp" className="hidden" ref={fileInputRef} onChange={handleFileChange} disabled={isSaving || isProcessingImage}/>
               
               <div className="w-full space-y-6">
                 <div className="flex flex-col gap-2.5">
                   <label className="text-xs text-slate-500 font-extrabold uppercase tracking-widest pl-1">Full Culinary Name</label>
                   <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 outline-none text-slate-900 dark:text-white font-bold text-lg focus:border-slate-300 dark:focus:border-white/20 transition-colors shadow-inner" placeholder="Chef Name" disabled={isSaving || isProcessingImage} />
                 </div>
                 <div className="flex flex-col gap-2.5">
                   <label className="text-xs text-slate-500 font-extrabold uppercase tracking-widest pl-1">Zestly Username</label>
                   <div className="relative">
                     <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold text-lg">@</span>
                     <input type="text" value={editUsername} onChange={e => setEditUsername(e.target.value)} className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-5 py-4 outline-none text-slate-900 dark:text-white font-bold text-lg lowercase focus:border-slate-300 dark:focus:border-white/20 transition-colors shadow-inner" placeholder="username" disabled={isSaving || isProcessingImage} />
                   </div>
                 </div>
                 <div className="flex flex-col gap-2.5 pb-2">
                   <label className="text-xs text-slate-500 font-extrabold uppercase tracking-widest pl-1">Culinary Bio & Passion</label>
                   <textarea rows={4} value={editBio} onChange={e => setEditBio(e.target.value)} className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 outline-none text-slate-900 dark:text-white font-medium resize-none focus:border-slate-300 dark:focus:border-white/20 transition-colors shadow-inner leading-relaxed" placeholder="Share your cooking story..." disabled={isSaving || isProcessingImage} />
                 </div>
               </div>
               
               <div className="w-full mt-10 sm:mt-12 sticky bottom-0 z-20 py-4 bg-slate-50/80 dark:bg-[#07070a]/80 backdrop-blur-sm sm:static sm:bg-transparent sm:backdrop-blur-none sm:p-0">
                    <button onClick={() => submitProfileSettings()} type="button" disabled={isSaving || isProcessingImage} className={`w-full bg-gradient-to-tr ${activeTheme.from} ${activeTheme.to} text-white font-black py-5 rounded-2xl text-lg transition-all active:scale-95 outline-none [-webkit-tap-highlight-color:transparent] shadow-lg disabled:opacity-60 flex items-center justify-center gap-3`}>
                        {isSaving ? <><svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Saving Culinary Magic...</> : isProcessingImage ? "Processing Image..." : "Save Profile Changes"}
                    </button>
               </div>
            </form>
          </div>
        </div>, document.body
      )}

      {/* ========================================================= */}
      {/* ✂️🚀 MODAL LAYER 3: 🔥 PROFESSIONAL IMAGE CROPPER */}
      {/* ========================================================= */}
      {mounted && imageToCrop && createPortal(
        <div className={cropperClasses}>
          <div className="shrink-0 flex justify-between items-center px-6 py-5 bg-black/90 sm:bg-slate-900 backdrop-blur-md z-20"><button onClick={() => setImageToCrop(null)} className="text-sm font-bold text-slate-300 hover:text-white transition-colors outline-none [-webkit-tap-highlight-color:transparent]">Cancel</button><h3 className="font-black text-white text-lg shrink-0">Fix Profile Photo</h3><div className="w-10"></div></div>
          
          <div className="relative flex-1 bg-black sm:bg-slate-900 sm:m-10 sm:rounded-3xl overflow-hidden shadow-2xl border border-white/5 flex items-center justify-center">
            <Cropper 
                image={imageToCrop} 
                crop={crop} 
                zoom={zoom} 
                aspect={1} 
                onCropChange={setCrop} 
                onCropComplete={onCropComplete} 
                onZoomChange={setZoom} 
                cropShape="round" 
                showGrid={true} 
                maxZoom={5}
                classes={{ 
                    containerClassName: "bg-black sm:bg-slate-900", 
                    mediaClassName: "", 
                    cropAreaClassName: `border-4 ${activeTheme.border}` 
                }}
            />
          </div>
          
          <div className="shrink-0 p-6 pb-8 bg-gradient-to-t from-black via-black/90 to-transparent z-20 space-y-6">
              <div className="flex items-center gap-4 bg-slate-800/60 p-3 rounded-xl border border-white/5"><span className="text-xs text-slate-400">Zoom</span><input type="range" value={zoom} min={1} max={5} step={0.1} onChange={(e: any) => setZoom(Number(e.target.value))} className="w-full h-1.5 rounded-full appearance-none cursor-pointer outline-none" style={{ background: `linear-gradient(90deg, ${activeTheme.rawFrom} 0%, ${activeTheme.rawFrom} ${(zoom-1)/4*100}%, #334155 ${(zoom-1)/4*100}%, #334155 100%)` }} /></div>
              <button onClick={handleSaveCrop} disabled={isProcessingImage} className={`w-full bg-gradient-to-tr ${activeTheme.from} ${activeTheme.to} text-white font-black py-5 rounded-2xl text-lg transition-all active:scale-95 shadow-lg flex items-center justify-center gap-3 disabled:opacity-60`}>
                {isProcessingImage ? "Compressing..." : "Save & Fix Photo ✂️"}
              </button>
          </div>
        </div>, document.body
      )}

      {/* 🚀 COOK MODE MODAL FOR PROFILE */}
      {mounted && cookModePost && createPortal(
        <div className="fixed inset-0 z-[99999] bg-white dark:bg-[#07070a] flex flex-col animate-in slide-in-from-bottom-full duration-500">
          <div className="w-full max-w-4xl mx-auto flex flex-col h-full relative">
            <div className="shrink-0 pt-10 pb-4 px-6 sm:px-10 bg-white dark:bg-[#07070a] border-b border-slate-100 dark:border-white/5 relative z-20">
              <button onClick={() => setCookModePost(null)} className="absolute top-8 right-6 sm:right-10 cursor-pointer bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/20 transition-colors outline-none [-webkit-tap-highlight-color:transparent]">✕</button>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6 pr-14 leading-tight">{cookModePost.name}</h3>
              <div className="flex gap-1.5 mb-2">
                <div className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${currentStep === -1 ? 'bg-orange-500' : 'bg-slate-200 dark:bg-white/10'}`}></div>
                {cookModePost.steps.map((_: any, idx: number) => (
                  <div key={idx} className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${currentStep >= idx ? 'bg-orange-500' : 'bg-slate-200 dark:bg-white/10'}`}></div>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {currentStep === -1 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-10">
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-500/10 dark:to-red-500/5 border border-orange-200 dark:border-orange-500/20 p-6 rounded-[2rem] flex justify-between items-center">
                    <div><span className="text-orange-600 dark:text-orange-400 font-extrabold text-base block">Serving Size</span></div>
                    <div className="flex items-center gap-5 bg-white dark:bg-black/40 p-2 rounded-2xl border border-orange-100 dark:border-white/5 shadow-sm dark:shadow-none">
                      <button onClick={() => setPortions(Math.max(1, portions - 1))} className="cursor-pointer w-12 h-12 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-900 dark:text-white font-black text-xl active:scale-95 transition-transform outline-none [-webkit-tap-highlight-color:transparent]">-</button>
                      <span className="font-black text-slate-900 dark:text-white w-8 text-center text-xl">{portions}</span>
                      <button onClick={() => setPortions(portions + 1)} className="cursor-pointer w-12 h-12 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-900 dark:text-white font-black text-xl active:scale-95 transition-transform outline-none [-webkit-tap-highlight-color:transparent]">+</button>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-slate-900 dark:text-white font-black text-xl mb-5">Ingredients</h4>
                    <ul className="grid grid-cols-1 gap-4">
                      {cookModePost.ingredients.map((ing: string, i: number) => (
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
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-5xl font-black text-white shadow-[0_8px_30px_#f9731666]">{currentStep + 1}</div>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-white px-4 leading-relaxed">{cookModePost.steps[currentStep]}</h2>
                </div>
              )}
            </div>

            <div className="shrink-0 p-6 sm:px-10 pb-8 bg-gradient-to-t from-white dark:from-[#07070a] to-transparent relative z-20">
              {currentStep === -1 ? (
                <button onClick={() => setCurrentStep(0)} className="cursor-pointer w-full bg-slate-900 dark:bg-white text-white dark:text-black font-black text-xl py-5 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all outline-none [-webkit-tap-highlight-color:transparent] shadow-[0_8px_30px_#00000033] dark:shadow-[0_8px_30px_#ffffff33]">Let's Start Cooking</button>
              ) : (
                <div className="flex gap-4">
                  <button onClick={() => setCurrentStep(currentStep - 1)} className="cursor-pointer w-1/3 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white font-extrabold text-lg py-5 rounded-2xl transition-colors active:scale-95 outline-none [-webkit-tap-highlight-color:transparent]">Back</button>
                  <button onClick={() => { if (currentStep < cookModePost.steps.length - 1) setCurrentStep(currentStep + 1); else setCookModePost(null); }} className={`cursor-pointer w-2/3 text-white font-extrabold text-lg py-5 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg outline-none [-webkit-tap-highlight-color:transparent] ${currentStep === cookModePost.steps.length - 1 ? 'bg-green-500 hover:bg-green-600 shadow-[0_8px_20px_#22c55e66]' : 'bg-orange-500 hover:bg-orange-600 shadow-[0_8px_20px_#f9731666]'}`}>
                    {currentStep === cookModePost.steps.length - 1 ? "Finish Meal 🍽️" : "Next Step"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>, document.body
      )}

      {/* 🚀 NEW: UNSAVE CONFIRMATION MODAL */}
      {mounted && unsaveConfirmId && createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200" onClick={() => setUnsaveConfirmId(null)}>
          <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border border-slate-200 dark:border-white/10 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-500/20 text-red-500 rounded-full flex items-center justify-center text-2xl mb-4">🗑️</div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Remove Recipe?</h3>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to remove this recipe from your Private Vault?</p>
            <div className="flex gap-3">
              <button onClick={() => setUnsaveConfirmId(null)} className="flex-1 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white font-bold py-3.5 rounded-xl transition-all outline-none cursor-pointer">Cancel</button>
              <button onClick={confirmUnsave} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-xl transition-all outline-none shadow-[0_4px_15px_#ef44444d] cursor-pointer active:scale-95">Yes, Remove</button>
            </div>
          </div>
        </div>, document.body
      )}

      {mounted && toast.isOpen && createPortal(<div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100000] pointer-events-none"><div className="bg-slate-900 dark:bg-[#1c1c1e] text-white px-6 py-3.5 rounded-full shadow-lg text-sm font-bold border border-slate-700 dark:border-white/10 whitespace-nowrap">{toast.message}</div></div>, document.body)}
    </div>
  );
}
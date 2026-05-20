"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import Cropper from 'react-easy-crop';
import { getCroppedImg } from "@/lib/cropUtils";
// 🔥 NAYA ALGORITHM IMPORT
import { calculateFakeFollowers, calculateFakeEngagement } from "@/lib/viralEngine";

// ─── TYPES ────────────────────────────────────────────────
interface CommentReply { id: string; author: string; avatar_url?: string; text: string; created_at?: string; }
interface CommentData { id: string; author: string; avatar_url?: string; text: string; replies: CommentReply[]; created_at?: string; }
interface FeedPost {
  id: string; name: string; type: string; emoji: string; gradient: string; is_liked: boolean; imageUrl?: string;
  authorName: string; authorId?: string; authorAvatar?: string; authorIsVerified: boolean; 
  realLikesCount: number; realViewsCount: number; likesCount: number; viewsCount: number; commentsCount: number;
  cuisine: string; commentsList: CommentData[]; ingredients: string[]; steps: string[]; time: string; calories: number; difficulty: string;
}

// ─── HELPER ───────────────────────────────────────────────
const timeAgo = (dateStr?: string) => {
  if (!dateStr) return "just now";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h`;
  return `${Math.floor(mins / 1440)}d`;
};
const formatNum = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

// Base64 to Blob helper for Recipe Uploads
const base64ToBlob = (base64Data: string, contentType: string) => {
  const byteCharacters = atob(base64Data.split(',')[1]);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) { byteNumbers[i] = slice.charCodeAt(i); }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  return new Blob(byteArrays, { type: contentType });
};

const VerifiedBadge = ({ sizeClass = "w-5 h-5", noTooltip = false, containerClass = "" }: { sizeClass?: string, noTooltip?: boolean, containerClass?: string }) => (
    <div className={`relative flex items-center justify-center group shrink-0 cursor-pointer ${containerClass}`} title={noTooltip ? "" : "Official Verified Creator"}>
        <div className="absolute inset-0 bg-orange-500 rounded-full blur-[6px] opacity-40 animate-pulse pointer-events-none"></div>
        <div className="absolute inset-0 rounded-full border border-orange-300/30 scale-110 animate-ping pointer-events-none"></div>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={`${sizeClass} relative z-10 drop-shadow-[0_4px_12px_rgba(249,115,22,0.55)] transition-all duration-300 group-hover:scale-110`}>
            <defs><linearGradient id="zestly-premium" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#fde68a" /><stop offset="35%" stopColor="#f59e0b" /><stop offset="70%" stopColor="#f97316" /><stop offset="100%" stopColor="#ea580c" /></linearGradient></defs>
            <path fill="url(#zestly-premium)" d="M12 0.8 L14.6 2.1 L17.5 1.4 L18.8 4 L21.4 5.2 L20.7 8.1 L23.2 10.5 L20.7 12.9 L21.4 15.8 L18.8 17 L17.5 19.6 L14.6 18.9 L12 21.2 L9.4 18.9 L6.5 19.6 L5.2 17 L2.6 15.8 L3.3 12.9 L0.8 10.5 L3.3 8.1 L2.6 5.2 L5.2 4 L6.5 1.4 L9.4 2.1 Z" />
            <path fill="rgba(255,255,255,0.22)" d="M12 2.2C15.5 2.2 18 4.2 19.2 7.2C17.2 5.7 14.8 4.8 12 4.8C9.2 4.8 6.8 5.7 4.8 7.2C6 4.2 8.5 2.2 12 2.2Z" />
            <path fill="#fff" d="M10.2 15.7L6.9 12.4L8.4 10.9L10.2 12.7L15.8 7.1L17.3 8.6L10.2 15.7Z" />
        </svg>
    </div>
);

export default function ProfileTab({ user }: { user: any }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  // --- USER DATA STATES ---
  const [profile, setProfile] = useState<any>(null);
  const [myPosts, setMyPosts] = useState<FeedPost[]>([]);
  const [savedPosts, setSavedPosts] = useState<FeedPost[]>([]); 
  const [savedRecipeIds, setSavedRecipeIds] = useState<string[]>([]); 
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // 🚀 ZESTLY ENGINE & ANALYTICS STATES
  const [fakeMode, setFakeMode] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [analytics, setAnalytics] = useState({ totalViews: 0, totalLikes: 0, reach: 0 });
  const [topPerformingPost, setTopPerformingPost] = useState<any | null>(null);

  // --- UI STATES ---
  const [activeTab, setActiveTab] = useState<"posts" | "saved">("posts");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: "" });
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean, title: string, desc: string, actionFn: () => Promise<void>, isLoading: boolean, type: "danger" | "warning" }>({ isOpen: false, title: "", desc: "", actionFn: async () => {}, isLoading: false, type: "danger" });

  const [myRecipeSearch, setMyRecipeSearch] = useState("");

  // --- POST DETAIL & COMMENTS ---
  const [focusedPost, setFocusedPost] = useState<FeedPost | null>(null);
  const [activeCommentsPost, setActiveCommentsPost] = useState<FeedPost | null>(null);
  const [commentInput, setCommentInput] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false); 
  const [replyingTo, setReplyingTo] = useState<{ commentId: string, author: string, isSubReply?: boolean } | null>(null);

  // --- COOK MODE STATES ---
  const [cookModePost, setCookModePost] = useState<any | null>(null);
  const [portions, setPortions] = useState(1);
  const [currentStep, setCurrentStep] = useState(-1);

  // --- EDIT PROFILE STATES ---
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  // --- ADD RECIPE STATES ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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
  
  const [imageInputMode, setImageInputMode] = useState<"upload" | "link">("upload");
  const [imageUrlLink, setImageUrlLink] = useState("");
  const [recipeImageFile, setRecipeImageFile] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressingRecipeImg, setIsCompressingRecipeImg] = useState(false);
  const [isSavingRecipe, setIsSavingRecipe] = useState(false);
  const recipeFileInputRef = useRef<HTMLInputElement>(null);

  // --- ADVANCED PROFILE IMAGE STATES ---
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [pendingAvatarBlob, setPendingAvatarBlob] = useState<Blob | null>(null);
  const [pendingAvatarPreview, setPendingAvatarPreview] = useState<string | null>(null);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // --- SETTINGS STATES ---
  const [notifications, setNotifications] = useState(true);
  const [mealPlanAlerts, setMealPlanAlerts] = useState(false);
  const [isMetric, setIsMetric] = useState(true); 
  const [theme, setTheme] = useState<"orange" | "green" | "blue">("orange");
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [aiMessage, setAiMessage] = useState(`Hi Chef! What are we cooking today?`);

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const msg = chatInput;
    setChatInput("");
    setAiMessage(msg);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setAiMessage(`I've noted "${msg}". Check the Global Feed for some magical ideas! ✨`);
    }, 1500);
  };

  const showToast = (msg: string) => {
    setToast({ isOpen: true, message: msg });
    setTimeout(() => setToast({ isOpen: false, message: "" }), 3000);
  };

  const openConfirm = (title: string, desc: string, type: "danger" | "warning", actionFn: () => Promise<void>) => {
    setConfirmDialog({ isOpen: true, title, desc, actionFn, isLoading: false, type });
  };

  const executeConfirm = async () => {
    setConfirmDialog(prev => ({ ...prev, isLoading: true }));
    try { await confirmDialog.actionFn(); } catch (err) { console.error(err); }
    setConfirmDialog(prev => ({ ...prev, isOpen: false, isLoading: false }));
  };

  useEffect(() => {
    setMounted(true);
    if (user) {
      setAiMessage(`Hi ${user?.user_metadata?.full_name?.split(" ")[0] || "Chef"}! What are we cooking today?`);
      fetchProfileData();
    }
    return () => { if (pendingAvatarPreview) URL.revokeObjectURL(pendingAvatarPreview); }
  }, [user, pendingAvatarPreview]);

  // Format Helper for Posts
  const formatRecipe = (r: any, isFakeOn: boolean): FeedPost => {
      const safeComments: CommentData[] = (r.comments_data || []).map((c: any, i: number) => ({
          id: c.id || `l_${i}`, author: c.author || "Chef", avatar_url: c.avatar_url || null, text: c.text || "", replies: c.replies || [], created_at: c.created_at || new Date().toISOString()
      }));
      const totalComments = safeComments.reduce((acc: number, c: any) => acc + 1 + (c.replies?.length || 0), 0);
      
      let displayLikes = r.likes_count || 0;
      let displayViews = r.views_count || Math.floor(Math.random() * 20); 
      
      if (isFakeOn) {
          const engineData = calculateFakeEngagement(r.id, r.created_at, isFakeOn);
          displayLikes += engineData.likes;
          displayViews += engineData.views;
      }
      return {
          id: r.id, name: r.name, type: r.type || "Veg", emoji: r.emoji || "🍲", gradient: r.gradient || "from-orange-500 to-red-600",
          is_liked: r.is_liked || false, imageUrl: r.image_url, authorName: r.author_name || "Chef", authorId: r.author_id,
          authorAvatar: profile?.avatar_url || null, authorIsVerified: profile?.is_verified || false,
          realLikesCount: r.likes_count || 0, realViewsCount: r.views_count || 0, likesCount: displayLikes, viewsCount: displayViews,
          commentsList: safeComments, commentsCount: totalComments, cuisine: r.category || "General", ingredients: r.ingredients || [],
          steps: r.steps || [], time: r.time || "30m", calories: r.calories || 400, difficulty: r.difficulty || "Easy"
      };
  };

  const fetchProfileData = async () => {
    setIsLoading(true);
    const { data: settingsData } = await supabase.from("app_settings").select("fake_engagement_enabled").eq("id", 1).single();
    const isFakeOn = settingsData ? settingsData.fake_engagement_enabled : false;
    setFakeMode(isFakeOn);

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
        if (sRecipes) setSavedPosts(sRecipes.map(r => formatRecipe(r, isFakeOn)));
      } else {
        setSavedPosts([]);
      }
    }

    const { data: recipes } = await supabase.from("recipes").select("*").eq("author_id", user.id).order("created_at", { ascending: false });
    
    let formattedMyPosts: FeedPost[] = [];
    let tViews = 0;
    let tLikes = 0;

    if (recipes) {
      formattedMyPosts = recipes.map(r => {
          const formatted = formatRecipe(r, isFakeOn);
          tViews += formatted.viewsCount;
          tLikes += formatted.likesCount;
          return formatted;
      });
      setMyPosts(formattedMyPosts);

      if (formattedMyPosts.length > 0) {
        const top = formattedMyPosts.reduce((prev, current) => (prev.likesCount > current.likesCount) ? prev : current);
        setTopPerformingPost(top);
      }
    }

    const { count: followersCount } = await supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", user.id);
    const { count: followingCount } = await supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", user.id);
    
    const realFollowers = followersCount || 0;
    const bonusFollowers = profileData?.bonus_followers || 0;
    const engineFollowers = calculateFakeFollowers(user.id, profileData?.created_at, recipes?.length || 0, isFakeOn);
    const finalFollowers = realFollowers + bonusFollowers + engineFollowers;

    setStats({ posts: recipes?.length || 0, followers: finalFollowers, following: followingCount || 0 });

    setAnalytics({
        totalViews: tViews,
        totalLikes: tLikes,
        reach: Math.floor(tViews * 1.4 + finalFollowers * 0.5) 
    });
    
    setIsLoading(false);
  };

  const requestVerification = async () => {
      setIsSavingProfile(true);
      showToast("Submitting request... ⏳");
      try {
          await supabase.from("profiles").update({ verification_status: 'pending' }).eq("id", user.id);
          setProfile((prev: any) => ({ ...prev, verification_status: 'pending' }));
          showToast("Verification request sent! 🚀");
      } catch(e) { showToast("Failed to send request."); }
      setIsSavingProfile(false);
  };

  // ─── LIKES & COMMENTS & ACTIONS ─────────────────────────────────
  const toggleLike = async (id: string) => {
    const post = myPosts.find(p => p.id === id) || savedPosts.find(p => p.id === id) || (focusedPost?.id === id ? focusedPost : null);
    if (!post) return;
    const isNowLiked = !post.is_liked;
    const updateMap = (pList: FeedPost[]) => pList.map(p => p.id === id ? { ...p, is_liked: isNowLiked, likesCount: isNowLiked ? p.likesCount + 1 : p.likesCount - 1 } : p);
    
    setMyPosts(updateMap); 
    setSavedPosts(updateMap);
    if (focusedPost?.id === id) setFocusedPost({...focusedPost, is_liked: isNowLiked, likesCount: isNowLiked ? focusedPost.likesCount + 1 : focusedPost.likesCount - 1});
    
    await supabase.from("recipes").update({ is_liked: isNowLiked, likes_count: isNowLiked ? post.realLikesCount + 1 : Math.max(0, post.realLikesCount - 1) }).eq("id", id);
  };

  const handleShare = (postName: string) => {
    navigator.clipboard.writeText(`Check out this amazing recipe: ${postName} on Zestly!`);
    showToast(`Link for ${postName} copied! 🚀`);
  };

  const toggleSave = async (recipeId: string) => {
    const isAlreadySaved = savedRecipeIds.includes(recipeId);
    if (isAlreadySaved) {
        confirmUnsave(recipeId);
    } else {
        const updatedSavedIds = [...savedRecipeIds, recipeId];
        setSavedRecipeIds(updatedSavedIds);
        showToast("Saved to Private Vault 🔒✨");
        await supabase.from("profiles").update({ saved_recipes: updatedSavedIds }).eq("id", user.id);
    }
  };

  const confirmUnsave = (id: string) => {
    openConfirm(
      "Remove Recipe?", 
      "Are you sure you want to remove this recipe from your Private Vault?", 
      "warning", 
      async () => {
        const newSavedIds = savedRecipeIds.filter(savedId => savedId !== id);
        setSavedRecipeIds(newSavedIds);
        setSavedPosts(savedPosts.filter(p => p.id !== id)); 
        await supabase.from("profiles").update({ saved_recipes: newSavedIds }).eq("id", user.id);
        showToast("Removed from Vault 🔓");
      }
    );
  };

  const handleDeleteRecipe = (id: string) => {
      openConfirm(
          "Delete Recipe?",
          "Are you sure you want to permanently delete this recipe? This cannot be undone.",
          "danger",
          async () => {
              setMyPosts(prev => prev.filter(r => r.id !== id)); 
              setStats(prev => ({ ...prev, posts: Math.max(0, prev.posts - 1) }));
              setFocusedPost(null);
              await supabase.from("recipes").delete().eq("id", id); 
              showToast("Recipe deleted successfully! 🗑️");
          }
      );
  };

  const submitComment = async () => {
    if (!activeCommentsPost) return;
    const text = commentInput.trim();
    if (!text) return;

    setIsSubmittingComment(true); 
    const currentUserName = profile?.full_name?.split(" ")[0] || "Chef"; 
    
    const finalText = replyingTo?.isSubReply && !text.startsWith(`@${replyingTo.author}`) ? `@${replyingTo.author} ${text}` : text;

    const newEntry = { id: Date.now().toString(), author: currentUserName, avatar_url: profile?.avatar_url || null, text: finalText, created_at: new Date().toISOString(), replies: [] };
    let newCommentsList = [...activeCommentsPost.commentsList];

    if (replyingTo) {
      newCommentsList = newCommentsList.map(cmt => cmt.id === replyingTo.commentId ? { ...cmt, replies: [...(cmt.replies || []), newEntry] } : cmt);
    } else {
      newCommentsList.push(newEntry);
    }

    const totalComments = newCommentsList.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);
    const updatedPost = { ...activeCommentsPost, commentsCount: totalComments, commentsList: newCommentsList };
    
    const safeJsonData = JSON.parse(JSON.stringify(newCommentsList));
    const { error } = await supabase.from("recipes").update({ comments_data: safeJsonData }).eq("id", activeCommentsPost.id);

    if (!error) {
      const updateMap = (pList: FeedPost[]) => pList.map(p => p.id === activeCommentsPost.id ? updatedPost : p);
      setMyPosts(updateMap); setSavedPosts(updateMap);
      if (focusedPost?.id === activeCommentsPost.id) setFocusedPost(updatedPost);
      setActiveCommentsPost(updatedPost); setCommentInput(""); setReplyingTo(null);
      showToast(replyingTo ? "Reply posted! 💬" : "Comment posted! 💬");
    } else { showToast("Failed to post comment."); }
    setIsSubmittingComment(false); 
  };

  const openCookMode = (post: FeedPost) => { setCookModePost(post); setPortions(1); setCurrentStep(-1); };

  // ─── ADD RECIPE HANDLERS ─────────────────────────────────
  const processRecipeImageFile = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    setIsCompressingRecipeImg(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image(); img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1000; 
        let width = img.width; let height = img.height;
        if (width > MAX_WIDTH) { height = Math.round((height * MAX_WIDTH) / width); width = MAX_WIDTH; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d"); ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setRecipeImageFile(canvas.toDataURL("image/jpeg", 0.8));
        setIsCompressingRecipeImg(false);
      };
    };
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processRecipeImageFile(e.target.files[0]);
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (imageInputMode === "upload" && e.dataTransfer.files?.[0]) processRecipeImageFile(e.dataTransfer.files[0]);
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
    setIsSavingRecipe(true);
    let finalImageUrl = undefined;

    if (imageInputMode === "link" && imageUrlLink.trim()) {
      finalImageUrl = imageUrlLink.trim();
    } else if (imageInputMode === "upload" && recipeImageFile) {
      try {
        const blob = base64ToBlob(recipeImageFile, "image/jpeg");
        const fileName = `recipe-${Date.now()}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from("recipe-images").upload(fileName, blob, { contentType: "image/jpeg", cacheControl: '3600' });
        if (!uploadError && uploadData) {
          const { data: publicUrlData } = supabase.storage.from("recipe-images").getPublicUrl(fileName);
          finalImageUrl = publicUrlData.publicUrl; 
        }
      } catch (err) { console.error("Image processing skipped:", err); }
    }

    const finalIngredients = newIngredients.filter(i => i.trim() !== "");
    const finalSteps = newSteps.filter(s => s.trim() !== "");
    const defaultGradient = newType === "Veg" ? "from-green-500 to-emerald-600" : "from-orange-500 to-red-600";

    const newRecipeData = {
      name: newName, time: newTime ? `${newTime} Min` : "30 Min", calories: newCalories ? parseInt(newCalories) : 400, type: newType, 
      category: newProtein && parseInt(newProtein) > 20 ? "High Protein" : "Quick Meal", emoji: newType === "Veg" ? "🥗" : "🥩", 
      gradient: defaultGradient, is_liked: false, ingredients: finalIngredients.length > 0 ? finalIngredients : ["Secret Ingredient"], 
      steps: finalSteps.length > 0 ? finalSteps : ["Mix and cook."], image_url: finalImageUrl, 
      macros: { protein: newProtein ? parseInt(newProtein) : 10, carbs: newCarbs ? parseInt(newCarbs) : 20, fats: newFats ? parseInt(newFats) : 10 }, 
      difficulty: newDifficulty, author_id: user?.id, author_name: profile?.full_name || "Chef"
    };

    const { data, error } = await supabase.from("recipes").insert([newRecipeData]).select();
    
    if (!error && data) {
      const addedPost = formatRecipe(data[0], fakeMode);
      setMyPosts([addedPost, ...myPosts]);
      setStats(prev => ({ ...prev, posts: prev.posts + 1 }));
      showToast("Recipe added successfully! 🎉");
    } else {
      showToast("Failed to add recipe. Please try again.");
    }

    setIsAddModalOpen(false); 
    setNewName(""); setNewTime(""); setNewCalories(""); setNewProtein(""); setNewCarbs(""); setNewFats("");
    setNewIngredients([""]); setNewSteps([""]); setRecipeImageFile(null); setImageUrlLink(""); setIsSavingRecipe(false);
  };

  // ─── PROFILE AVATAR HANDLERS ──────────────────────────────
  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsProcessingAvatar(true);
      const reader = new FileReader();
      reader.addEventListener('load', () => { setImageToCrop(reader.result as string); setIsProcessingAvatar(false); setZoom(1); });
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCrop = async () => {
    try {
      if (!imageToCrop || !croppedAreaPixels) return;
      setIsProcessingAvatar(true); showToast("Fixing & Compressing image... ✂️⏳");
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (croppedBlob) {
        if (pendingAvatarPreview) URL.revokeObjectURL(pendingAvatarPreview);
        setPendingAvatarPreview(URL.createObjectURL(croppedBlob));
        setPendingAvatarBlob(croppedBlob);
        showToast("Photo fixed! Click 'Save Changes' to upload. ✅");
      }
      setImageToCrop(null);
    } catch (e) { showToast("Failed to crop image."); } 
    finally { setIsProcessingAvatar(false); if (avatarInputRef.current) avatarInputRef.current.value = ""; }
  };

  const submitProfileSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingProfile(true); showToast("Saving your profile... ⏳");

    try {
        const cleanUsername = editUsername.toLowerCase().trim().replace(/\s+/g, '_');
        const { data: existing } = await supabase.from("profiles").select("id").eq("username", cleanUsername).neq("id", user.id).maybeSingle();
        if (existing) { showToast("Username is already taken! ❌"); setIsSavingProfile(false); return; }

        let finalAvatarUrl = profile?.avatar_url;
        if (pendingAvatarBlob) {
            setIsProcessingAvatar(true);
            const filePath = `${user.id}-${Date.now()}.jpg`;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, pendingAvatarBlob, { contentType: 'image/jpeg', upsert: true });
            if (uploadError) throw uploadError;
            finalAvatarUrl = supabase.storage.from('avatars').getPublicUrl(filePath).data.publicUrl;
        }

        const { error: updateError } = await supabase.from("profiles").update({ full_name: editName, username: cleanUsername, bio: editBio, avatar_url: finalAvatarUrl }).eq("id", user.id);
        if (updateError) throw updateError;

        setProfile((prev: any) => ({ ...prev, full_name: editName, username: cleanUsername, bio: editBio, avatar_url: finalAvatarUrl }));
        setPendingAvatarBlob(null); if (pendingAvatarPreview) URL.revokeObjectURL(pendingAvatarPreview); setPendingAvatarPreview(null);
        showToast("Profile Saved Successfully! ✨✅"); setIsEditOpen(false); 
    } catch (error: any) { showToast("Failed to save profile. ❌"); } 
    finally { setIsSavingProfile(false); setIsProcessingAvatar(false); }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login'); };

  const themeColors = {
    orange: { from: "from-orange-400", to: "to-red-500", text: "text-orange-500", bg: "bg-orange-500", glow: "shadow-[0_0_40px_#f9731666]", border: "border-orange-500", rawFrom: '#fb923c' },
    green: { from: "from-green-400", to: "to-emerald-500", text: "text-green-500", bg: "bg-green-500", glow: "shadow-[0_0_40px_#22c55e66]", border: "border-green-500", rawFrom: '#4ade80' },
    blue: { from: "from-blue-400", to: "to-indigo-500", text: "text-blue-500", bg: "bg-blue-500", glow: "shadow-[0_0_40px_#3b82f666]", border: "border-blue-500", rawFrom: '#60a5fa' }
  };
  const activeTheme = themeColors[theme];
  const initial = profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "C";

  const profileCompletion = Math.floor(((profile?.avatar_url ? 25 : 0) + (profile?.bio ? 25 : 0) + (profile?.full_name ? 25 : 0) + (stats.posts > 0 ? 25 : 0)));

  const badges = [];
  if (profile?.is_verified) badges.push({ icon: "🏆", label: "Master Chef", bg: "bg-yellow-500/10", border: "border-yellow-500/20", text: "text-yellow-500" });
  if (stats.posts >= 1) badges.push({ icon: "🍳", label: "First Dish", bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-500" });
  if (stats.followers > 50) badges.push({ icon: "🌟", label: "Rising Star", bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-500" });
  badges.push({ icon: "🔥", label: "3 Day Streak", bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-500" });
  badges.push({ icon: "🌱", label: "Early Adopter", bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-500" });

  const weeklyVisits = fakeMode ? Math.floor(stats.followers * 0.35 + 12) : 12;
  const displayedMyPosts = myPosts.filter(p => p.name.toLowerCase().includes(myRecipeSearch.toLowerCase()));

  // 🚀 REUSABLE FEED CARD COMPONENT
  const renderFeedCard = (post: FeedPost, isFocusedView = false) => (
    <div key={post.id} className={`flex flex-col w-full bg-white dark:bg-[#0b0b0e] ${!isFocusedView ? 'border-b-[8px] sm:border-b-0 border-slate-100 dark:border-[#121216] sm:bg-transparent' : 'border-b border-slate-100 dark:border-white/10'}`}>
      <div className={`relative bg-white dark:bg-[#0b0b0e] ${!isFocusedView ? 'border-y sm:border border-slate-200/80 dark:border-white/10 sm:rounded-[2.5rem] overflow-hidden shadow-none sm:shadow-md dark:shadow-2xl transition-all sm:hover:-translate-y-1.5 sm:hover:shadow-[0_20px_50px_#0000001a] sm:dark:hover:border-white/20' : 'rounded-none shadow-none border-none'} group/card flex flex-col`}>
        
        {/* Author Header */}
        <div className="py-3 px-4 sm:p-5 flex justify-between items-center bg-transparent border-b border-slate-100 dark:border-white/5 z-10">
          <div className="flex items-center gap-3 group outline-none">
            <div className="relative shrink-0 w-9 h-9">
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-orange-500 to-red-500 p-[2px] shadow">
                <div className="w-full h-full bg-white dark:bg-[#1c1c1e] rounded-full flex items-center justify-center text-xs font-black text-slate-900 dark:text-white uppercase transition-colors overflow-hidden">
                  {post.authorAvatar ? <img src={post.authorAvatar} className="w-full h-full object-cover" /> : post.authorName.charAt(0).toUpperCase()}
                </div>
              </div>
              {post.authorIsVerified && <div className="absolute bottom-0 right-0 z-20"><VerifiedBadge sizeClass="w-[14px] h-[14px]" noTooltip={true}/></div>}
            </div>
            <div className="flex flex-col">
              <div className="text-sm text-slate-900 dark:text-white font-bold transition-colors leading-tight flex items-center gap-1.5">{post.authorName}</div>
              <p className="text-[10px] text-slate-500 font-medium">Zestly Chef</p>
            </div>
          </div>
          {post.authorId === user?.id && (
             <button onClick={() => handleDeleteRecipe(post.id)} className="text-red-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 dark:hover:bg-white/5 transition-colors cursor-pointer outline-none">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
             </button>
          )}
        </div>

        {/* Media Block - Click to open Cook Mode */}
        <div onClick={() => openCookMode(post)} className={`w-full ${isFocusedView ? 'aspect-auto h-[400px] sm:h-[500px]' : 'aspect-square sm:aspect-auto sm:h-72'} relative flex items-center justify-center cursor-pointer sm:overflow-hidden outline-none [-webkit-tap-highlight-color:transparent] ${!post.imageUrl ? `bg-gradient-to-br ${post.gradient}` : 'bg-slate-100 dark:bg-black'}`}>
          {post.imageUrl ? <img src={post.imageUrl} className="w-full h-full object-cover sm:group-hover/card:scale-105 transition-transform duration-700" /> : <span className="text-8xl drop-shadow-2xl sm:group-hover/card:scale-110 transition-transform duration-500">{post.emoji}</span>}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
            <span className="bg-orange-500 text-white font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Cook Now</span>
          </div>
          <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              {formatNum(post.viewsCount)}
          </div>
        </div>

        <div className="pt-3 pb-5 px-4 sm:p-5 flex-1 flex flex-col justify-between bg-transparent transition-colors z-10">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <button onClick={() => toggleLike(post.id)} className="group transition-transform active:scale-125 cursor-pointer outline-none [-webkit-tap-highlight-color:transparent]">
                  <svg className={`w-7 h-7 transition-all duration-300 outline-none ${post.is_liked ? 'fill-red-500 text-red-500 scale-110' : 'text-slate-900 dark:text-white group-hover:text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                </button>
                <button onClick={() => { setActiveCommentsPost(post); setReplyingTo(null); }} className="group flex items-center gap-1.5 cursor-pointer transition-colors active:scale-95 outline-none [-webkit-tap-highlight-color:transparent]">
                  <svg className="w-7 h-7 text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                  {post.commentsCount > 0 && <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300">{post.commentsCount}</span>}
                </button>
                <button onClick={() => handleShare(post.name)} className="cursor-pointer active:scale-110 transition-transform outline-none [-webkit-tap-highlight-color:transparent]">
                  <svg className="w-7 h-7 text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
                </button>
              </div>
              <button onClick={() => toggleSave(post.id)} className={`outline-none active:scale-90 transition-all duration-300 ${savedRecipeIds.includes(post.id) ? 'text-orange-500' : 'text-slate-900 dark:text-white'}`}>
                <svg className="w-7 h-7" fill={savedRecipeIds.includes(post.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
              </button>
            </div>
            <div className="flex items-center gap-3 mb-1.5">
                <p className="font-bold text-sm text-slate-900 dark:text-white">{formatNum(post.likesCount)} likes</p>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <p className="font-bold text-sm text-slate-500 flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg> {formatNum(post.viewsCount)}</p>
            </div>
            <div className="text-sm text-slate-900 dark:text-white leading-relaxed line-clamp-2">
                <strong className="mr-1.5 font-bold cursor-pointer hover:underline inline-flex items-center gap-1">{post.authorName}</strong> 
                {post.name} - The ultimate {post.type} treat! 🥘✨
            </div>
            {post.commentsCount > 0 && (
              <p onClick={() => { setActiveCommentsPost(post); setReplyingTo(null); }} className="text-[13px] text-slate-500 mt-1.5 cursor-pointer font-medium hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                View all {post.commentsCount} comments
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) return <div className="flex items-center justify-center h-screen"><div className={`w-12 h-12 border-4 ${activeTheme.border} border-t-transparent rounded-full animate-spin`}></div></div>;

  return (
    <div className="animate-in fade-in duration-700 pb-24 w-full max-w-5xl mx-auto bg-slate-50 dark:bg-[#07070a] min-h-screen relative overflow-x-hidden selection:bg-orange-500/20 select-none">
      
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-[400px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] ${activeTheme.from}/10 via-transparent to-transparent pointer-events-none -z-10`}></div>

      {/* --- PREMIUM HEADER --- */}
      <div className="flex justify-between items-center px-6 py-4 sticky top-0 bg-slate-50/80 dark:bg-[#07070a]/80 backdrop-blur-xl z-40">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
          {profile?.username || "chef_zestly"} 
          {fakeMode ? ( <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#4ade80]" title="Zestly Growth Engine Active"></span>
          ) : ( <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-slate-400" title="Organic Mode"></span> )}
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
            <div className={`absolute w-[150%] h-[150%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-tr ${activeTheme.from} ${activeTheme.to} rounded-full blur-[40px] sm:blur-[60px] opacity-30 group-hover:opacity-50 transition-all duration-700 pointer-events-none`}></div>
            <div className={`relative z-10 w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr ${activeTheme.from} ${activeTheme.to} p-[4px] shadow-2xl transition-transform group-hover:scale-[1.03]`}>
              <div className="w-full h-full bg-white dark:bg-[#121216] rounded-full flex items-center justify-center text-4xl sm:text-5xl font-black text-slate-900 dark:text-white border-4 border-white dark:border-[#07070a] uppercase transition-colors overflow-hidden relative">
                {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Profile" /> : initial}
                {(isSavingProfile || isProcessingAvatar) && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>}
              </div>
            </div>
            <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 z-20 bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border-2 border-white dark:border-[#07070a] shadow-lg">PRO</div>
          </div>
          
          <div className="flex-1 w-full text-center sm:text-left mt-2 sm:mt-4 z-10 relative">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center justify-center sm:justify-start gap-2">
                <span className="truncate max-w-[80%]">{profile?.full_name || "Head Chef"}</span>
                {profile?.is_verified && <VerifiedBadge sizeClass="w-7 h-7 sm:w-8 sm:h-8" containerClass="ml-1" />}
            </h1>
            <p className={`${activeTheme.text} text-xs sm:text-sm font-bold mb-3 uppercase tracking-wider mt-1`}>Culinary Artist</p>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium whitespace-pre-wrap leading-relaxed max-w-lg mx-auto sm:mx-0 select-text">
              {profile?.bio || "Passionate Chef at Zestly 🍳\nTurning raw ingredients into pure magic!"}
            </p>
          </div>
        </div>

        {/* 🏆 Dynamic Badges */}
        <div className="flex gap-3 overflow-x-auto mt-4 sm:mt-2 pb-2 no-scrollbar">
            {badges.map((badge, i) => (
                <div key={i} className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${badge.bg} ${badge.border}`}>
                    <span className="text-sm">{badge.icon}</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${badge.text}`}>{badge.label}</span>
                </div>
            ))}
            <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-indigo-500/10 border-indigo-500/20">
                <span className="text-sm animate-pulse">👁️</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{weeklyVisits} Profile Visits</span>
            </div>
        </div>

        <div className="flex justify-between items-center bg-white/60 dark:bg-white/[0.03] backdrop-blur-md border border-slate-200/50 dark:border-white/10 rounded-[1.5rem] py-5 px-6 mt-6 shadow-sm dark:shadow-none">
          <div className="flex flex-col items-center flex-1"><span className="text-2xl font-black text-slate-900 dark:text-white">{formatNum(stats.posts)}</span><span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest mt-0.5">Posts</span></div>
          <div className="w-px h-10 bg-slate-200 dark:bg-white/10"></div>
          <div className="flex flex-col items-center flex-1"><span className="text-2xl font-black text-slate-900 dark:text-white">{formatNum(stats.followers)}</span><span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest mt-0.5">Followers</span></div>
          <div className="w-px h-10 bg-slate-200 dark:bg-white/10"></div>
          <div className="flex flex-col items-center flex-1"><span className="text-2xl font-black text-slate-900 dark:text-white">{formatNum(stats.following)}</span><span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest mt-0.5">Following</span></div>
        </div>

        {/* 📊 Profile Completion Meter */}
        <div className="mt-6 px-2">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Profile Strength</span>
                <span className={`text-xs font-black ${profileCompletion === 100 ? activeTheme.text : 'text-slate-400'}`}>{profileCompletion}% Complete</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ${profileCompletion === 100 ? activeTheme.bg : 'bg-slate-400'}`} style={{ width: `${profileCompletion}%` }}></div>
            </div>
        </div>

        <div className="flex flex-col gap-3 mt-6">
          <div className="flex gap-4 relative z-10">
              {/* 🚀 FIXED EDIT BUTTON TRIGER */}
              <button onClick={(e) => { e.preventDefault(); setIsEditOpen(true); }} className={`flex-1 bg-gradient-to-tr ${activeTheme.from} ${activeTheme.to} text-white font-extrabold py-3.5 rounded-2xl text-sm sm:text-base transition-all active:scale-95 outline-none shadow-md cursor-pointer pointer-events-auto`}>Edit Profile</button>
              <button onClick={(e) => { e.preventDefault(); setIsAddModalOpen(true); }} className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold py-3.5 rounded-2xl text-sm sm:text-base transition-all active:scale-95 outline-none shadow-md cursor-pointer flex items-center justify-center gap-1.5 pointer-events-auto"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg> Add Recipe</button>
          </div>
          <button onClick={() => setIsAnalyticsOpen(true)} className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-extrabold py-3.5 rounded-2xl text-sm transition-all active:scale-95 outline-none hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center gap-2 shadow-sm cursor-pointer relative z-10 pointer-events-auto">
            <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 24 24"><path d="M5 19h14v2H5v-2zm2-4h2v4H7v-4zm4-7h2v11h-2V8zm4-5h2v16h-2V3z"/></svg> Professional Dashboard
          </button>
        </div>
      </div>

      {/* --- PILL-STYLE SEGMENTED TABS --- */}
      <div className="px-6 mt-6 mb-4 max-w-4xl mx-auto w-full">
        <div className="flex bg-slate-200/50 dark:bg-[#1c1c1e] p-1.5 rounded-2xl gap-1">
          <button onClick={() => setActiveTab("posts")} className={`flex-1 py-3 flex justify-center items-center gap-2 rounded-xl transition-all duration-300 outline-none font-bold text-sm cursor-pointer ${activeTab === "posts" ? "bg-white dark:bg-[#2c2c2e] text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zm0 11h7v7h-7v-7zM3 14h7v7H3v-7z"/></svg> Recipes
          </button>
          <button onClick={() => setActiveTab("saved")} className={`flex-1 py-3 flex justify-center items-center gap-2 rounded-xl transition-all duration-300 outline-none font-bold text-sm cursor-pointer ${activeTab === "saved" ? "bg-white dark:bg-[#2c2c2e] text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg> Vault
          </button>
        </div>
      </div>

      {/* --- ATTRACTIVE POSTS GRID --- */}
      {activeTab === "posts" && (
        <div className="px-5 sm:px-6 max-w-4xl mx-auto w-full">
          {myPosts.length > 0 && (
              <div className="relative w-full mb-4">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input type="text" placeholder="Search my creations..." value={myRecipeSearch} onChange={e => setMyRecipeSearch(e.target.value)} className="w-full bg-slate-200/50 dark:bg-[#1c1c1e] border-none rounded-xl pl-11 pr-4 py-3 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-slate-400 cursor-text select-text" />
              </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
            {displayedMyPosts.length === 0 ? (
              <div className="col-span-full text-center py-24 bg-white dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 rounded-[2rem] mt-2">
                <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-tr ${activeTheme.from} ${activeTheme.to} opacity-20 mb-4`}></div>
                <p className="font-bold text-slate-900 dark:text-white text-lg">No Masterpieces Found</p>
                <p className="text-slate-500 text-sm mt-1">{myPosts.length > 0 ? "Try a different search term." : "Your created recipes will appear here."}</p>
              </div>
            ) : (
              displayedMyPosts.map(post => (
                <div key={post.id} onClick={() => setFocusedPost(post)} className="aspect-square relative cursor-pointer group bg-slate-100 dark:bg-[#121216] rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-lg transition-all outline-none">
                  {post.imageUrl ? <img src={post.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /> : <div className={`w-full h-full bg-gradient-to-br ${post.gradient || activeTheme.from} flex items-center justify-center group-hover:scale-110 transition-transform duration-700`}><span className="text-4xl sm:text-6xl drop-shadow-lg">{post.emoji || '🍲'}</span></div>}
                  <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none shadow-sm">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg> {formatNum(post.viewsCount)}
                  </div>
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 text-white font-black transition-all duration-300 pointer-events-none">
                    <span className="flex items-center gap-1.5 text-lg"><svg className="w-6 h-6 fill-white" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg> {formatNum(post.likesCount)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* --- SAVED VAULT SECTION --- */}
      {activeTab === "saved" && (
        <div className="px-5 sm:px-6 max-w-4xl mx-auto w-full">
          {savedPosts.length === 0 ? (
            <div className="text-center py-24 bg-white dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 rounded-[2rem] mt-2">
              <span className="text-4xl block mb-4 opacity-50">🔒</span>
              <p className="font-bold text-slate-900 dark:text-white text-lg">Private Vault</p>
              <p className="text-slate-500 text-sm mt-1">Only you can see what you've saved.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
              {savedPosts.map((post) => (
                <div key={post.id} onClick={() => setFocusedPost(post)} className="aspect-square relative cursor-pointer group bg-slate-100 dark:bg-[#121216] rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-lg transition-all">
                  {post.imageUrl ? <img src={post.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /> : <div className={`w-full h-full bg-gradient-to-br ${post.gradient || activeTheme.from} flex items-center justify-center group-hover:scale-110 transition-transform duration-700`}><span className="text-4xl sm:text-6xl drop-shadow-lg">{post.emoji || '🍲'}</span></div>}
                  <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-md text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none shadow-sm">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg> {formatNum(post.viewsCount)}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); toggleSave(post.id); }} className="absolute top-3 right-3 p-2.5 bg-black/50 hover:bg-red-500/80 backdrop-blur-md rounded-full text-white transition-all z-20 outline-none shadow-md cursor-pointer active:scale-90" title="Remove from Vault">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 text-white font-black transition-all duration-300 pointer-events-none">
                    <span className="flex items-center gap-1.5 text-lg"><svg className="w-6 h-6 fill-white" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg> {formatNum(post.likesCount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 🚀 FIXED FULL-SCREEN FOCUSED POST DETAIL */}
      {mounted && focusedPost && createPortal(
        <div className="fixed inset-0 z-[100000] bg-white dark:bg-[#0b0b0e] animate-in slide-in-from-bottom-full duration-300 select-none overflow-y-auto" onClick={() => setFocusedPost(null)}>
           <div className="w-full max-w-2xl mx-auto flex flex-col min-h-screen bg-white dark:bg-[#0b0b0e] shadow-2xl relative" onClick={e => e.stopPropagation()}>
             {/* Header */}
             <div className="sticky top-0 flex justify-between items-center p-4 border-b border-slate-100 dark:border-white/10 bg-white/90 dark:bg-[#0b0b0e]/90 backdrop-blur-xl z-[150] shrink-0">
               <div className="flex items-center gap-3">
                   <button onClick={() => setFocusedPost(null)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white cursor-pointer active:scale-95 transition-all outline-none">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                   </button>
                   <h3 className="font-black text-slate-900 dark:text-white text-lg">Recipe Details</h3>
               </div>
             </div>
             {/* Feed Card Render */}
             <div className="flex-1 pb-10">
               {renderFeedCard(focusedPost, true)}
             </div>
           </div>
        </div>, document.body
      )}

      {/* 🚀🔥 NEW INSTAGRAM STYLE COMMENTS MODAL (TOP Z-INDEX z-[110000]) */}
      {mounted && activeCommentsPost && createPortal(
        <div className="fixed inset-0 z-[110000] flex flex-col justify-end bg-black/60 dark:bg-black/80 backdrop-blur-sm sm:items-center sm:justify-center p-0 sm:p-4 transition-all select-none">
          <div className="bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-white/10 w-full sm:w-[500px] h-[85vh] sm:h-[650px] rounded-t-[2.5rem] sm:rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="shrink-0 flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-white/10 z-10">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Comments</h3>
              <button onClick={() => setActiveCommentsPost(null)} className="cursor-pointer text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 w-9 h-9 rounded-full flex items-center justify-center transition-colors outline-none">✕</button>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto no-scrollbar">
               {activeCommentsPost.commentsList.length === 0 ? (
                 <p className="text-center text-slate-500 mt-10">No comments yet. Be the first!</p>
               ) : (
                 <div className="flex flex-col gap-6">
                   {activeCommentsPost.commentsList.map((cmt) => (
                     <div key={cmt.id} className="flex gap-3 relative">
                       <div className="flex flex-col items-center gap-2">
                         <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-500 to-red-500 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden z-10 shadow-sm">
                           {cmt.avatar_url ? <img src={cmt.avatar_url} className="w-full h-full object-cover" /> : cmt.author.charAt(0).toUpperCase()}
                         </div>
                         {cmt.replies && cmt.replies.length > 0 && <div className="w-[2px] bg-slate-200 dark:bg-white/10 absolute top-10 bottom-4 left-[17px] z-0"></div>}
                       </div>
                       <div className="w-full pb-2">
                         <div className="bg-slate-50 dark:bg-white/5 p-3.5 rounded-2xl rounded-tl-none w-fit min-w-[120px] max-w-full">
                           <p className="font-bold text-xs text-slate-900 dark:text-white mb-1">{cmt.author} <span className="text-[10px] text-slate-400 font-normal ml-2">{timeAgo(cmt.created_at)}</span></p>
                           <p className="text-[13px] text-slate-700 dark:text-slate-300 break-words leading-relaxed select-text">{cmt.text}</p>
                         </div>
                         <button onClick={() => setReplyingTo({ commentId: cmt.id, author: cmt.author })} className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 mt-2 ml-2 transition-colors outline-none cursor-pointer">Reply</button>
                         {cmt.replies && cmt.replies.length > 0 && (
                           <div className="flex flex-col gap-4 mt-4">
                             {cmt.replies.map(reply => (
                               <div key={reply.id} className="flex gap-2.5 relative z-10">
                                 <div className="w-7 h-7 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-white text-[10px] font-bold shrink-0 overflow-hidden shadow-sm">{reply.avatar_url ? <img src={reply.avatar_url} className="w-full h-full object-cover" /> : reply.author.charAt(0).toUpperCase()}</div>
                                 <div className="w-full">
                                   <div className="bg-slate-50/80 dark:bg-white/[0.03] px-3.5 py-2.5 rounded-2xl rounded-tl-none w-fit min-w-[100px] max-w-full">
                                     <p className="font-bold text-[11px] text-slate-900 dark:text-white mb-0.5">{reply.author} <span className="text-[9px] text-slate-400 font-normal ml-1.5">{timeAgo(reply.created_at)}</span></p>
                                     <p className="text-[13px] text-slate-700 dark:text-slate-300 break-words leading-relaxed select-text">{reply.text.startsWith('@') ? <><span className="text-blue-500 font-medium mr-1">{reply.text.split(' ')[0]}</span><span>{reply.text.substring(reply.text.indexOf(' '))}</span></> : reply.text}</p>
                                   </div>
                                   <button onClick={() => setReplyingTo({ commentId: cmt.id, author: reply.author, isSubReply: true })} className="text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 mt-1.5 ml-2 transition-colors outline-none cursor-pointer">Reply</button>
                                 </div>
                               </div>
                             ))}
                           </div>
                         )}
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>

            {replyingTo && (
              <div className="shrink-0 px-6 py-2 bg-slate-100 dark:bg-[#252528] flex justify-between items-center border-t border-slate-200 dark:border-white/10">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Replying to {replyingTo.author}...</span>
                <button onClick={() => setReplyingTo(null)} className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer outline-none">Cancel</button>
              </div>
            )}

            <div className="shrink-0 p-4 border-t border-slate-100 dark:border-white/10 flex gap-3 items-center">
               <input type="text" placeholder={replyingTo ? "Write a reply..." : "Add a comment..."} value={commentInput} onChange={(e) => setCommentInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitComment()} className="flex-1 bg-slate-100 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-full px-5 py-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-orange-400 select-text" />
               <button onClick={submitComment} disabled={isSubmittingComment || !commentInput.trim()} className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:dark:bg-white/10 text-white w-12 h-12 rounded-full flex items-center justify-center transition-all shrink-0 group outline-none cursor-pointer">
                 {isSubmittingComment ? <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}
               </button>
            </div>
          </div>
        </div>, document.body
      )}

      {/* 🚀 FIXED MODAL: ADD RECIPE (UPLOAD LOGIC FROM RECIPESTAB) */}
      {mounted && isAddModalOpen && createPortal(
        <div className="fixed inset-0 z-[100000] bg-white dark:bg-[#07070a] flex flex-col animate-in slide-in-from-bottom-full duration-300 select-none">
          <div className="w-full max-w-4xl mx-auto flex flex-col h-full relative">
            <div className="shrink-0 flex justify-between items-center px-6 py-5 border-b border-slate-100 dark:border-white/10 sticky top-0 bg-white dark:bg-[#07070a] z-50 shadow-sm dark:shadow-none">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">Create Recipe</h3>
              <button disabled={isSavingRecipe} onClick={() => setIsAddModalOpen(false)} className="cursor-pointer text-slate-500 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 dark:text-white w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50 transition-colors outline-none">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 sm:px-10 no-scrollbar">
              <form onSubmit={handleAddRecipe} className="space-y-8 pb-10">
                <div className="flex flex-col gap-3">
                  <div className="flex bg-slate-100 dark:bg-white/5 p-1.5 rounded-2xl w-fit">
                    <button type="button" onClick={() => setImageInputMode("upload")} className={`cursor-pointer px-5 py-2.5 rounded-xl text-sm font-bold transition-all outline-none ${imageInputMode === 'upload' ? 'bg-white dark:bg-[#1c1c1e] shadow-sm text-orange-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Upload File</button>
                    <button type="button" onClick={() => setImageInputMode("link")} className={`cursor-pointer px-5 py-2.5 rounded-xl text-sm font-bold transition-all outline-none ${imageInputMode === 'link' ? 'bg-white dark:bg-[#1c1c1e] shadow-sm text-orange-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Paste Link</button>
                  </div>
                  {imageInputMode === "upload" ? (
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => !recipeImageFile && !isCompressingRecipeImg && recipeFileInputRef.current?.click()}
                      className={`relative w-full aspect-video sm:h-72 rounded-[2.5rem] border-2 border-dashed transition-all flex flex-col items-center justify-center group overflow-hidden outline-none ${isDragging ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10' : 'border-slate-300 dark:border-white/20 hover:border-orange-500 bg-slate-50 dark:bg-[#0c0c10] cursor-pointer'}`}
                    >
                      <input type="file" accept="image/*" onChange={handleImageChange} ref={recipeFileInputRef} disabled={isCompressingRecipeImg || isSavingRecipe} className="hidden" />
                      
                      {isCompressingRecipeImg ? (
                        <div className="flex flex-col items-center gap-3"><div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div><p className="text-orange-500 font-bold animate-pulse">Processing Image...</p></div>
                      ) : recipeImageFile ? (
                        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/60">
                          <div className="absolute inset-0 bg-cover bg-center blur-xl opacity-60 scale-110" style={{ backgroundImage: `url(${recipeImageFile})` }}></div>
                          <img src={recipeImageFile} className="relative z-10 w-full h-full object-contain drop-shadow-2xl p-1 rounded-xl" />
                          <button type="button" onClick={(e) => { e.stopPropagation(); setRecipeImageFile(null); }} className="absolute top-4 right-4 bg-black/70 hover:bg-red-500 text-white w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-lg z-20 cursor-pointer outline-none">✕</button>
                        </div>
                      ) : (
                        <><svg className={`w-12 h-12 mb-4 text-slate-400 transition-transform duration-300 ${isDragging ? 'scale-125 text-orange-500' : 'group-hover:-translate-y-1 group-hover:text-orange-500'}`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg><p className="text-slate-700 dark:text-white font-extrabold text-base">{isDragging ? 'Drop Image Here!' : 'Upload Recipe Photo'}</p><p className="text-slate-400 text-sm mt-2 font-medium">High quality images get more likes</p></>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <input type="url" placeholder="Paste image URL here..." value={imageUrlLink || ""} onChange={(e) => setImageUrlLink(e.target.value)} disabled={isSavingRecipe} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white outline-none focus:border-orange-500 transition-all cursor-text placeholder:text-slate-400 select-text" />
                      {imageUrlLink && <div className="relative w-full aspect-video sm:h-72 rounded-[2.5rem] border border-slate-200 dark:border-white/10 overflow-hidden bg-slate-50 dark:bg-[#0c0c10] flex items-center justify-center"><img src={imageUrlLink} onError={(e) => { (e.target as HTMLImageElement).src = ""; setImageUrlLink(""); showToast("Invalid image link!"); }} className="w-full h-full object-cover" /></div>}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <input type="text" placeholder="Recipe Name" value={newName || ""} onChange={(e) => setNewName(e.target.value)} disabled={isSavingRecipe} className="flex-1 w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white outline-none focus:border-orange-500 transition-all cursor-text disabled:opacity-50 placeholder:text-slate-400 select-text" required />
                  <div className="relative w-full sm:w-40 shrink-0">
                    <select value={newType || "Veg"} onChange={(e) => setNewType(e.target.value as any)} disabled={isSavingRecipe} className="w-full h-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-4 pr-10 py-4 text-slate-900 dark:text-white font-bold outline-none focus:border-orange-500 appearance-none disabled:opacity-50 cursor-pointer"><option value="Veg" className="bg-white dark:bg-[#0b0b0e]">🥬 Veg</option><option value="Non-Veg" className="bg-white dark:bg-[#0b0b0e]">🥩 Meat</option></select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <input type="number" placeholder="Mins" value={newTime || ""} onChange={(e) => setNewTime(e.target.value)} disabled={isSavingRecipe} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white outline-none focus:border-orange-500 transition-all placeholder:text-slate-400 cursor-text font-bold select-text" />
                  <input type="number" placeholder="Kcal" value={newCalories || ""} onChange={(e) => setNewCalories(e.target.value)} disabled={isSavingRecipe} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white outline-none focus:border-orange-500 transition-all placeholder:text-slate-400 cursor-text font-bold select-text" />
                  <div className="relative w-full col-span-2 sm:col-span-1">
                    <select value={newDifficulty || "Easy"} onChange={(e) => setNewDifficulty(e.target.value as any)} disabled={isSavingRecipe} className="w-full h-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-4 pr-10 py-4 text-slate-900 dark:text-white font-bold outline-none focus:border-orange-500 appearance-none cursor-pointer"><option value="Easy" className="bg-white dark:bg-black">🟢 Easy</option><option value="Medium" className="bg-white dark:bg-black">🟡 Med</option><option value="Hard" className="bg-white dark:bg-black">🔴 Hard</option></select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg></div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 p-4 sm:p-5 rounded-3xl">
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mb-4 uppercase tracking-wider">Macros (per serving)</p>
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <div className="flex items-center bg-white dark:bg-black/40 rounded-xl px-2 sm:px-4 py-3 border border-slate-200 dark:border-white/5 focus-within:border-orange-500 transition-colors shadow-sm dark:shadow-none"><span className="text-blue-500 font-bold text-xs sm:text-sm mr-2">P</span><input type="number" placeholder="0" value={newProtein || ""} onChange={(e) => setNewProtein(e.target.value)} className="w-full bg-transparent text-slate-900 dark:text-white font-bold outline-none text-sm sm:text-base placeholder:text-slate-400 cursor-text select-text" /></div>
                    <div className="flex items-center bg-white dark:bg-black/40 rounded-xl px-2 sm:px-4 py-3 border border-slate-200 dark:border-white/5 focus-within:border-orange-500 transition-colors shadow-sm dark:shadow-none"><span className="text-yellow-500 font-bold text-xs sm:text-sm mr-2">C</span><input type="number" placeholder="0" value={newCarbs || ""} onChange={(e) => setNewCarbs(e.target.value)} className="w-full bg-transparent text-slate-900 dark:text-white font-bold outline-none text-sm sm:text-base placeholder:text-slate-400 cursor-text select-text" /></div>
                    <div className="flex items-center bg-white dark:bg-black/40 rounded-xl px-2 sm:px-4 py-3 border border-slate-200 dark:border-white/5 focus-within:border-orange-500 transition-colors shadow-sm dark:shadow-none"><span className="text-red-500 font-bold text-xs sm:text-sm mr-2">F</span><input type="number" placeholder="0" value={newFats || ""} onChange={(e) => setNewFats(e.target.value)} className="w-full bg-transparent text-slate-900 dark:text-white font-bold outline-none text-sm sm:text-base placeholder:text-slate-400 cursor-text select-text" /></div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 p-4 sm:p-5 rounded-3xl space-y-3">
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Ingredients</p>
                  {newIngredients.map((ing, idx) => (
                    <div key={`ing-${idx}`} className="flex gap-2 items-center w-full">
                      <div className="w-5 text-center text-xs font-bold text-slate-400 shrink-0">{idx + 1}.</div>
                      <input type="text" placeholder="e.g. 2 Chopped Onions" value={ing || ""} onChange={(e) => handleIngredientChange(idx, e.target.value)} disabled={isSavingRecipe} className="flex-1 min-w-0 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 sm:px-5 py-3 sm:py-4 text-slate-900 dark:text-white font-medium outline-none focus:border-orange-500 transition-all cursor-text shadow-sm dark:shadow-none text-sm select-text" required />
                      {newIngredients.length > 1 && <button type="button" onClick={() => removeIngredientField(idx)} className="text-slate-400 hover:text-red-500 p-1.5 transition-colors cursor-pointer active:scale-95 outline-none shrink-0"><svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>}
                    </div>
                  ))}
                  <button type="button" onClick={addIngredientField} className="cursor-pointer text-orange-500 font-bold text-sm sm:text-base flex items-center gap-1.5 mt-2 ml-7 sm:ml-9 hover:underline outline-none"><svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg> Add Ingredient</button>
                </div>

                <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 p-4 sm:p-5 rounded-3xl space-y-3">
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Cooking Steps</p>
                  {newSteps.map((step, idx) => (
                    <div key={`step-${idx}`} className="flex gap-2 items-start w-full">
                      <div className="w-5 pt-3 sm:pt-4 text-center text-xs font-bold text-slate-400 shrink-0">{idx + 1}.</div>
                      <textarea placeholder="e.g. Heat oil in a pan..." value={step || ""} onChange={(e) => handleStepChange(idx, e.target.value)} disabled={isSavingRecipe} rows={2} className="flex-1 min-w-0 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 sm:px-5 py-3 sm:py-4 text-slate-900 dark:text-white font-medium outline-none focus:border-orange-500 transition-all resize-none cursor-text shadow-sm dark:shadow-none text-sm select-text" required></textarea>
                      {newSteps.length > 1 && <button type="button" onClick={() => removeStepField(idx)} className="text-slate-400 hover:text-red-500 p-1.5 mt-1 transition-colors cursor-pointer active:scale-95 outline-none shrink-0"><svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>}
                    </div>
                  ))}
                  <button type="button" onClick={addStepField} className="cursor-pointer text-orange-500 font-bold text-sm sm:text-base flex items-center gap-1.5 mt-2 ml-7 sm:ml-9 hover:underline outline-none"><svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg> Add Step</button>
                </div>
                
                <div className="pt-4">
                  <button type="submit" disabled={isSavingRecipe || isCompressingRecipeImg} className="cursor-pointer w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-black py-4 sm:py-5 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_8px_20px_#f973164d] flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed outline-none">
                    {isSavingRecipe ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Uploading Magic...</> : "Save to Cloud"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>, document.body
      )}

      {/* 🚀 MODAL: PROFESSIONAL DASHBOARD (ANALYTICS) */}
      {mounted && isAnalyticsOpen && createPortal(
        <div className="fixed inset-0 z-[100000] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4 animate-in fade-in duration-300" onClick={() => setIsAnalyticsOpen(false)}>
          <div className="bg-white dark:bg-[#121216] w-full sm:max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl border border-slate-200 dark:border-white/10 animate-in slide-in-from-bottom-full sm:zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    Professional Dashboard {fakeMode && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#4ade80]"></span>}
                </h3>
                <button onClick={() => setIsAnalyticsOpen(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-white/10 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer outline-none">✕</button>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-6 leading-relaxed">Insights from the last 30 days. Explore how your culinary magic is reaching the world!</p>
            <div className="space-y-3 mb-6">
                <div className="bg-slate-50 dark:bg-[#1c1c1e] border border-slate-100 dark:border-white/5 rounded-2xl p-4 flex justify-between items-center">
                    <div><p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Accounts Reached</p><p className="text-2xl font-black text-slate-900 dark:text-white">{formatNum(analytics.reach)}</p></div>
                    <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-full flex items-center justify-center text-xl">🚀</div>
                </div>
                <div className="flex gap-3">
                    <div className="flex-1 bg-slate-50 dark:bg-[#1c1c1e] border border-slate-100 dark:border-white/5 rounded-2xl p-4"><p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Content Likes</p><p className="text-xl font-black text-slate-900 dark:text-white">{formatNum(analytics.totalLikes)}</p><p className="text-[10px] text-green-500 font-bold mt-1">+14% vs last week</p></div>
                    <div className="flex-1 bg-slate-50 dark:bg-[#1c1c1e] border border-slate-100 dark:border-white/5 rounded-2xl p-4"><p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Profile Views</p><p className="text-xl font-black text-slate-900 dark:text-white">{formatNum(analytics.totalViews)}</p><p className="text-[10px] text-green-500 font-bold mt-1">+28% vs last week</p></div>
                </div>
                {topPerformingPost && (
                    <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl p-4 mt-3 flex items-center gap-4 relative overflow-hidden">
                        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-white/10 flex items-center justify-center">
                            {topPerformingPost.imageUrl ? <img src={topPerformingPost.imageUrl} className="w-full h-full object-cover" /> : <span className="text-2xl">{topPerformingPost.emoji}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest mb-0.5">Top Recipe 🌟</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{topPerformingPost.name}</p>
                            <p className="text-xs text-slate-500 font-medium">{formatNum(topPerformingPost.likesCount)} Likes • {formatNum(topPerformingPost.viewsCount)} Views</p>
                        </div>
                    </div>
                )}
            </div>
            <button onClick={() => setIsAnalyticsOpen(false)} className="w-full bg-slate-900 dark:bg-white text-white dark:text-black font-black py-4 rounded-xl shadow-lg active:scale-95 transition-transform cursor-pointer outline-none">Got it, Chef!</button>
          </div>
        </div>, document.body
      )}

      {/* 🚀 LEVEL 1: SLEEK SIDE MENU (DRAWER) */}
      {mounted && isMenuOpen && createPortal(
        <div className="fixed inset-0 z-[99998] flex justify-end bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-all" onClick={() => setIsMenuOpen(false)}>
          <div className="w-[80%] sm:w-[380px] h-full bg-white dark:bg-[#121216] shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col border-l border-slate-200 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 dark:border-white/5 relative z-10 bg-white dark:bg-[#121216]">
              <h3 className="font-black text-slate-900 dark:text-white text-xl">Menu</h3>
              <button onClick={() => setIsMenuOpen(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 rounded-full text-slate-900 dark:text-white transition-colors outline-none cursor-pointer">✕</button>
            </div>
            <div className="flex-1 flex flex-col py-3 overflow-y-auto no-scrollbar">
              <button onClick={() => { setIsMenuOpen(false); setIsSettingsOpen(true); }} className="flex items-center gap-5 px-6 py-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left outline-none group cursor-pointer">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#1c1c1e] flex items-center justify-center text-xl shadow-sm group-hover:scale-105 transition-transform">⚙️</div>
                <div><span className="block font-bold text-slate-900 dark:text-white text-base">Settings & Privacy</span><span className="block text-xs text-slate-500 font-medium mt-0.5">Theme, units, alerts & AI</span></div>
              </button>
              <button onClick={() => { setIsMenuOpen(false); showToast("QR Code generated! 🔲"); }} className="flex items-center gap-5 px-6 py-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left outline-none group cursor-pointer">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#1c1c1e] flex items-center justify-center text-xl shadow-sm group-hover:scale-105 transition-transform">🔲</div>
                <div><span className="block font-bold text-slate-900 dark:text-white text-base">My QR Code</span><span className="block text-xs text-slate-500 font-medium mt-0.5">Share your profile instantly</span></div>
              </button>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-white/5 mt-auto relative z-10 bg-white dark:bg-[#121216]">
              <button onClick={handleLogout} className="w-full font-black text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-500/10 py-4 rounded-2xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-all outline-none active:scale-95 cursor-pointer">Log Out</button>
            </div>
          </div>
        </div>, document.body
      )}

      {/* 🚀 LEVEL 2: FULL-SCREEN SETTINGS MODAL */}
      {mounted && isSettingsOpen && createPortal(
        <div className="fixed inset-0 z-[99999] bg-slate-50 dark:bg-[#07070a] flex flex-col animate-in slide-in-from-right duration-300">
          <div className="shrink-0 flex items-center px-4 py-4 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#07070a]/80 backdrop-blur-xl sticky top-0 z-10 gap-4">
            <button onClick={() => { setIsSettingsOpen(false); setIsMenuOpen(true); }} className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-slate-900 dark:text-white outline-none transition-colors cursor-pointer"><svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg></button>
            <h3 className="font-black text-slate-900 dark:text-white text-2xl tracking-tight">Settings & Privacy</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 no-scrollbar max-w-4xl mx-auto w-full">
            <div className="bg-white dark:bg-[#121216] rounded-[2rem] p-6 border border-orange-500/20 relative overflow-hidden group">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-orange-500 opacity-10 rounded-bl-[100px] pointer-events-none transition-all group-hover:scale-110`}></div>
                <h4 className="text-xs font-black text-orange-500 uppercase tracking-widest mb-6">Account Verification</h4>
                <div className="flex justify-between items-center relative z-10">
                    <div><span className="font-bold text-slate-900 dark:text-white text-base block mb-1">Master Chef Badge</span><span className="text-xs text-slate-500 font-medium">Get the coveted Gold Tick</span></div>
                    {profile?.is_verified ? ( <span className="text-orange-500 bg-orange-500/10 px-4 py-2 rounded-xl text-xs font-bold border border-orange-500/20 flex items-center gap-1 shadow-sm"><span className="text-sm">🏆</span> Verified</span>
                    ) : profile?.verification_status === 'pending' ? ( <span className="text-orange-400 bg-orange-500/10 px-4 py-2 rounded-xl text-xs font-bold border border-orange-500/20">Pending ⏳</span>
                    ) : ( <button onClick={requestVerification} disabled={isSavingProfile} className="bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-colors cursor-pointer active:scale-95 outline-none shadow-md">Apply Now</button> )}
                </div>
            </div>
            <div className="bg-white dark:bg-[#121216] rounded-[2rem] p-6 border border-slate-100 dark:border-white/5">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Visual & App Preferences</h4>
              <div className="flex justify-between items-center mb-6">
                <div><span className="font-bold text-slate-900 dark:text-white text-base block mb-1">Theme Color</span><span className="text-xs text-slate-500 font-medium">Personalize your UI</span></div>
                <div className="flex gap-2.5 bg-slate-50 dark:bg-[#1c1c1e] p-1.5 rounded-full border border-slate-100 dark:border-white/5">
                  <button onClick={() => setTheme("orange")} className={`w-8 h-8 rounded-full cursor-pointer bg-orange-500 border-2 ${theme === 'orange' ? 'border-slate-900 dark:border-white shadow-md scale-110' : 'border-transparent'} transition-all`}></button>
                  <button onClick={() => setTheme("green")} className={`w-8 h-8 rounded-full cursor-pointer bg-green-500 border-2 ${theme === 'green' ? 'border-slate-900 dark:border-white shadow-md scale-110' : 'border-transparent'} transition-all`}></button>
                  <button onClick={() => setTheme("blue")} className={`w-8 h-8 rounded-full cursor-pointer bg-blue-500 border-2 ${theme === 'blue' ? 'border-slate-900 dark:border-white shadow-md scale-110' : 'border-transparent'} transition-all`}></button>
                </div>
              </div>
              <div className="h-px w-full bg-slate-100 dark:bg-white/5 mb-6"></div>
              <div className="flex justify-between items-center">
                <div><span className="font-bold text-slate-900 dark:text-white text-base block mb-1">Measurement Units</span><span className="text-xs text-slate-500 font-medium">Switch between Metric & Imperial</span></div>
                <button onClick={() => setIsMetric(!isMetric)} className="bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-900 dark:text-white transition-colors cursor-pointer active:scale-95 outline-none">{isMetric ? "Metric (Kg/L)" : "Imperial (Lbs/Oz)"}</button>
              </div>
            </div>
            <div className="bg-white dark:bg-[#121216] rounded-[2rem] p-6 border border-slate-100 dark:border-white/5 relative overflow-hidden group">
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${activeTheme.from} ${activeTheme.to} opacity-10 rounded-bl-[100px] pointer-events-none transition-all group-hover:scale-110`}></div>
              <div className="flex gap-3 items-center mb-5 relative z-10">
                <div className={`w-10 h-10 shrink-0 rounded-[1rem] bg-gradient-to-tr ${activeTheme.from} ${activeTheme.to} flex items-center justify-center text-xl shadow-lg`}>🤖</div>
                <h4 className="font-black text-slate-900 dark:text-white text-lg">AI Chef Assistant</h4>
              </div>
              <div className="bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 p-4 rounded-2xl mb-4 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-inner relative z-10 select-text">
                {isTyping ? "Thinking of recipes..." : aiMessage}
              </div>
              <div className="flex gap-2.5 relative z-10">
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendChat()} placeholder="e.g., Substitute for eggs?" className="flex-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-3.5 rounded-2xl text-sm outline-none text-slate-900 dark:text-white focus:border-orange-500 transition-colors disabled:opacity-60 select-text" disabled={isTyping} />
                <button onClick={() => { if(!chatInput.trim())return; setChatInput(""); setAiMessage(chatInput); setIsTyping(true); setTimeout(() => { setIsTyping(false); setAiMessage(`I've noted "${chatInput}". Check the Global Feed for some magical ideas! ✨`); }, 1500); }} disabled={isTyping || !chatInput.trim()} className={`bg-gradient-to-tr ${activeTheme.from} ${activeTheme.to} text-white px-5 rounded-2xl font-black transition-transform active:scale-95 disabled:opacity-50 shadow-md flex items-center justify-center cursor-pointer outline-none`}><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" /></svg></button>
              </div>
            </div>
          </div>
        </div>, document.body
      )}

      {/* ======================================================= */}
      {/* 🚀 LEVEL 2: 🔥 SLEEK & FULL-SCREEN EDIT PROFILE MODAL */}
      {/* ======================================================= */}
      {mounted && isEditOpen && createPortal(
        <div className="fixed inset-0 z-[99998] bg-slate-50 dark:bg-[#07070a] flex flex-col transition-all overflow-hidden select-none">
          <div className="shrink-0 flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/90 dark:bg-[#07070a]/90 backdrop-blur-xl sticky top-0 z-50">
              <button onClick={() => { setIsEditOpen(false); setPendingAvatarBlob(null); if (pendingAvatarPreview) URL.revokeObjectURL(pendingAvatarPreview); setPendingAvatarPreview(null); }} className="text-sm font-bold text-slate-600 dark:text-slate-300 transition-colors outline-none cursor-pointer" disabled={isSavingProfile || isProcessingAvatar}>Cancel</button>
              <h3 className="font-black text-slate-900 dark:text-white text-xl tracking-tight">Edit Profile</h3>
              <button onClick={() => submitProfileSettings()} className={`text-sm font-black ${activeTheme.text} outline-none cursor-pointer disabled:opacity-50`} disabled={isSavingProfile || isProcessingAvatar}>Done</button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 sm:p-10 no-scrollbar">
            <form className="w-full max-w-lg mx-auto flex flex-col items-center pb-10" onSubmit={submitProfileSettings}>
               <div className="relative group cursor-pointer mb-8 shrink-0 flex items-center justify-center" onClick={() => avatarInputRef.current?.click()}>
                 <div className={`absolute w-[140%] h-[140%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-tr ${activeTheme.from} ${activeTheme.to} rounded-full blur-[35px] sm:blur-[50px] opacity-20 group-hover:opacity-35 transition-all duration-700 pointer-events-none`}></div>
                 <div className={`relative z-10 w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr ${activeTheme.from} ${activeTheme.to} p-[4px] shadow-2xl transition-transform group-hover:scale-[1.03]`}>
                   <div className="w-full h-full bg-white dark:bg-[#121216] rounded-full flex items-center justify-center text-5xl font-black text-slate-900 dark:text-white border-4 border-white dark:border-[#07070a] uppercase overflow-hidden relative">
                     {pendingAvatarPreview ? <img src={pendingAvatarPreview} className="w-full h-full object-cover" /> : profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : initial}
                     <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg></div>
                     {(isProcessingAvatar || isSavingProfile) && <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10"><svg className="animate-spin h-7 w-7 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>}
                   </div>
                 </div>
                 <div className={`absolute bottom-1 right-1 sm:bottom-2 sm:right-2 z-20 bg-white dark:bg-[#121216] ${activeTheme.text} w-9 h-9 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-100 dark:border-white/5 group-hover:scale-110 transition-transform`}><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg></div>
               </div>
               <input type="file" accept="image/jpeg, image/png, image/webp" className="hidden" ref={avatarInputRef} onChange={handleAvatarFileChange} disabled={isSavingProfile || isProcessingAvatar}/>
               <div className="w-full space-y-6">
                 <div className="flex flex-col gap-2.5">
                   <label className="text-xs text-slate-500 font-extrabold uppercase tracking-widest pl-1">Registered Email</label>
                   <div className="flex items-center gap-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 shadow-inner opacity-70">
                     <span className="text-slate-900 dark:text-white font-medium text-base truncate flex-1 select-text">{user?.email || profile?.email || "No Email"}</span>
                   </div>
                 </div>
                 <div className="flex flex-col gap-2.5">
                   <label className="text-xs text-slate-500 font-extrabold uppercase tracking-widest pl-1">Full Culinary Name</label>
                   <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 outline-none text-slate-900 dark:text-white font-bold text-lg focus:border-slate-300 dark:focus:border-white/20 transition-colors shadow-inner select-text" placeholder="Chef Name" disabled={isSavingProfile || isProcessingAvatar} />
                 </div>
                 <div className="flex flex-col gap-2.5">
                   <label className="text-xs text-slate-500 font-extrabold uppercase tracking-widest pl-1">Zestly Username</label>
                   <div className="relative">
                     <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold text-lg">@</span>
                     <input type="text" value={editUsername} onChange={e => setEditUsername(e.target.value)} className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-5 py-4 outline-none text-slate-900 dark:text-white font-bold text-lg lowercase focus:border-slate-300 dark:focus:border-white/20 transition-colors shadow-inner select-text" placeholder="username" disabled={isSavingProfile || isProcessingAvatar} />
                   </div>
                 </div>
                 <div className="flex flex-col gap-2.5 pb-2">
                   <label className="text-xs text-slate-500 font-extrabold uppercase tracking-widest pl-1">Culinary Bio & Passion</label>
                   <textarea rows={4} value={editBio} onChange={e => setEditBio(e.target.value)} className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 outline-none text-slate-900 dark:text-white font-medium resize-none focus:border-slate-300 dark:focus:border-white/20 transition-colors shadow-inner leading-relaxed select-text" placeholder="Share your cooking story..." disabled={isSavingProfile || isProcessingAvatar} />
                 </div>
               </div>
               
               <div className="w-full mt-10 sm:mt-12 sticky bottom-0 z-20 py-4 bg-slate-50/80 dark:bg-[#07070a]/80 backdrop-blur-sm sm:static sm:bg-transparent sm:backdrop-blur-none sm:p-0">
                    <button type="submit" disabled={isSavingProfile || isProcessingAvatar} className={`w-full bg-gradient-to-tr ${activeTheme.from} ${activeTheme.to} text-white font-black py-5 rounded-2xl text-lg transition-all cursor-pointer active:scale-95 outline-none shadow-lg ${activeTheme.glow} disabled:opacity-60 flex items-center justify-center gap-3`}>
                        {isSavingProfile ? <><svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Saving Culinary Magic...</> : isProcessingAvatar ? "Processing Image..." : "Save Profile Changes"}
                    </button>
               </div>
            </form>
          </div>
        </div>, document.body
      )}

      {/* ✂️🚀 MODAL LAYER 3: 🔥 PROFESSIONAL IMAGE CROPPER */}
      {mounted && imageToCrop && createPortal(
        <div className="fixed inset-0 z-[99999] bg-black flex flex-col animate-in fade-in duration-300 select-none">
          <div className="shrink-0 flex justify-between items-center px-6 py-5 bg-black/90 sm:bg-slate-900 backdrop-blur-md z-20"><button onClick={() => setImageToCrop(null)} className="text-sm font-bold text-slate-300 hover:text-white transition-colors outline-none cursor-pointer">Cancel</button><h3 className="font-black text-white text-lg shrink-0">Fix Profile Photo</h3><div className="w-10"></div></div>
          <div className="relative flex-1 bg-black sm:bg-slate-900 sm:m-10 sm:rounded-3xl overflow-hidden shadow-2xl border border-white/5 flex items-center justify-center">
            <Cropper image={imageToCrop} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} cropShape="round" showGrid={true} maxZoom={5} classes={{ containerClassName: "bg-black sm:bg-slate-900", mediaClassName: "", cropAreaClassName: `border-4 ${activeTheme.border}` }} />
          </div>
          <div className="shrink-0 p-6 pb-8 bg-gradient-to-t from-black via-black/90 to-transparent z-20 space-y-6">
              <div className="flex items-center gap-4 bg-slate-800/60 p-3 rounded-xl border border-white/5"><span className="text-xs text-slate-400">Zoom</span><input type="range" value={zoom} min={1} max={5} step={0.1} onChange={(e: any) => setZoom(Number(e.target.value))} className="w-full h-1.5 rounded-full appearance-none cursor-pointer outline-none" style={{ background: `linear-gradient(90deg, ${activeTheme.rawFrom} 0%, ${activeTheme.rawFrom} ${(zoom-1)/4*100}%, #334155 ${(zoom-1)/4*100}%, #334155 100%)` }} /></div>
              <button onClick={handleSaveCrop} disabled={isProcessingAvatar} className={`w-full bg-gradient-to-tr ${activeTheme.from} ${activeTheme.to} text-white font-black py-5 rounded-2xl cursor-pointer text-lg transition-all active:scale-95 shadow-lg flex items-center justify-center gap-3 disabled:opacity-60`}>
                {isProcessingAvatar ? "Compressing..." : "Save & Fix Photo ✂️"}
              </button>
          </div>
        </div>, document.body
      )}

      {/* 🚀 MODAL: FOCUSED POST DETAIL (z-[100000]) */}
      {mounted && focusedPost && createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200 select-none" onClick={() => setFocusedPost(null)}>
           <div className="bg-white dark:bg-[#0b0b0e] w-full max-w-md rounded-[2.5rem] overflow-hidden relative shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-white/10 bg-white dark:bg-[#0b0b0e] z-10 shrink-0">
               <h3 className="font-bold text-slate-900 dark:text-white ml-2">Recipe Details</h3>
               <button onClick={() => setFocusedPost(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white cursor-pointer active:scale-95 transition-all">✕</button>
             </div>
             <div className="overflow-y-auto no-scrollbar">
                <div className={`flex flex-col w-full bg-white dark:bg-[#0b0b0e] rounded-none`}>
                  <div className="py-3 px-4 sm:p-5 flex justify-between items-center bg-transparent border-b border-slate-100 dark:border-white/5 z-10">
                    <div className="flex items-center gap-3 group outline-none">
                      <div className="relative shrink-0 w-9 h-9">
                        <div className="w-full h-full rounded-full bg-gradient-to-tr from-orange-500 to-red-500 p-[2px] shadow">
                          <div className="w-full h-full bg-white dark:bg-[#1c1c1e] rounded-full flex items-center justify-center text-xs font-black text-slate-900 dark:text-white uppercase transition-colors overflow-hidden">
                            {focusedPost.authorAvatar ? <img src={focusedPost.authorAvatar} className="w-full h-full object-cover" /> : focusedPost.authorName.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        {focusedPost.authorIsVerified && <div className="absolute bottom-0 right-0 z-20"><VerifiedBadge sizeClass="w-[14px] h-[14px]" noTooltip={true}/></div>}
                      </div>
                      <div className="flex flex-col">
                        <div className="text-sm text-slate-900 dark:text-white font-bold transition-colors leading-tight flex items-center gap-1.5">{focusedPost.authorName}</div>
                        <p className="text-[10px] text-slate-500 font-medium">Zestly Chef</p>
                      </div>
                    </div>
                    {focusedPost.authorId === user?.id && (
                       <button onClick={() => handleDeleteRecipe(focusedPost.id)} className="text-red-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 dark:hover:bg-white/5 transition-colors cursor-pointer outline-none">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                       </button>
                    )}
                  </div>
                  <div onClick={() => openCookMode(focusedPost)} className={`w-full aspect-square relative flex items-center justify-center cursor-pointer overflow-hidden outline-none ${!focusedPost.imageUrl ? `bg-gradient-to-br ${focusedPost.gradient}` : 'bg-slate-100 dark:bg-black'}`}>
                    {focusedPost.imageUrl ? <img src={focusedPost.imageUrl} className="w-full h-full object-cover transition-transform duration-700" /> : <span className="text-8xl drop-shadow-2xl transition-transform duration-500">{focusedPost.emoji}</span>}
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="bg-orange-500 text-white font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Cook Now</span>
                    </div>
                  </div>
                  <div className="pt-3 pb-5 px-4 sm:p-5 flex-1 flex flex-col justify-between bg-transparent z-10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-4">
                        <button onClick={() => toggleLike(focusedPost.id)} className="transition-transform active:scale-125 cursor-pointer outline-none">
                          <svg className={`w-7 h-7 transition-all duration-300 ${focusedPost.is_liked ? 'fill-red-500 text-red-500 scale-110' : 'text-slate-900 dark:text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                        </button>
                        <button onClick={() => { setActiveCommentsPost(focusedPost); setReplyingTo(null); }} className="flex items-center gap-1.5 cursor-pointer transition-colors active:scale-95 outline-none">
                          <svg className="w-7 h-7 text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                          {focusedPost.commentsCount > 0 && <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300">{focusedPost.commentsCount}</span>}
                        </button>
                        <button onClick={() => handleShare(focusedPost.name)} className="cursor-pointer active:scale-110 transition-transform outline-none">
                          <svg className="w-7 h-7 text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
                        </button>
                      </div>
                      <button onClick={() => toggleSave(focusedPost.id)} className={`outline-none active:scale-90 transition-all duration-300 ${savedRecipeIds.includes(focusedPost.id) ? 'text-orange-500' : 'text-slate-900 dark:text-white'}`}>
                        <svg className="w-7 h-7" fill={savedRecipeIds.includes(focusedPost.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
                      </button>
                    </div>
                    <div className="flex items-center gap-3 mb-1.5">
                        <p className="font-bold text-sm text-slate-900 dark:text-white">{formatNum(focusedPost.likesCount)} likes</p>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <p className="font-bold text-sm text-slate-500 flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg> {formatNum(focusedPost.viewsCount)}</p>
                    </div>
                    <div className="text-sm text-slate-900 dark:text-white leading-relaxed line-clamp-2 select-text">
                        <strong className="mr-1.5 font-bold">{focusedPost.authorName}</strong> 
                        {focusedPost.name} - The ultimate {focusedPost.type} treat! 🥘✨
                    </div>
                    {focusedPost.commentsCount > 0 && (
                      <p onClick={() => { setActiveCommentsPost(focusedPost); setReplyingTo(null); }} className="text-[13px] text-slate-500 mt-1.5 cursor-pointer font-medium hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                        View all {focusedPost.commentsCount} comments
                      </p>
                    )}
                  </div>
                </div>
             </div>
           </div>
        </div>, document.body
      )}

      {/* 🚀🔥 NEW INSTAGRAM STYLE COMMENTS MODAL (TOP Z-INDEX z-[110000]) */}
      {mounted && activeCommentsPost && createPortal(
        <div className="fixed inset-0 z-[110000] flex flex-col justify-end bg-black/60 dark:bg-black/80 backdrop-blur-sm sm:items-center sm:justify-center p-0 sm:p-4 transition-all select-none">
          <div className="bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-white/10 w-full sm:w-[500px] h-[85vh] sm:h-[650px] rounded-t-[2.5rem] sm:rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="shrink-0 flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-white/10 z-10">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Comments</h3>
              <button onClick={() => setActiveCommentsPost(null)} className="cursor-pointer text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 w-9 h-9 rounded-full flex items-center justify-center transition-colors outline-none">✕</button>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto no-scrollbar">
               {activeCommentsPost.commentsList.length === 0 ? (
                 <p className="text-center text-slate-500 mt-10">No comments yet. Be the first!</p>
               ) : (
                 <div className="flex flex-col gap-6">
                   {activeCommentsPost.commentsList.map((cmt) => (
                     <div key={cmt.id} className="flex gap-3 relative">
                       <div className="flex flex-col items-center gap-2">
                         <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-500 to-red-500 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden z-10 shadow-sm">
                           {cmt.avatar_url ? <img src={cmt.avatar_url} className="w-full h-full object-cover" /> : cmt.author.charAt(0).toUpperCase()}
                         </div>
                         {cmt.replies && cmt.replies.length > 0 && <div className="w-[2px] bg-slate-200 dark:bg-white/10 absolute top-10 bottom-4 left-[17px] z-0"></div>}
                       </div>
                       <div className="w-full pb-2">
                         <div className="bg-slate-50 dark:bg-white/5 p-3.5 rounded-2xl rounded-tl-none w-fit min-w-[120px] max-w-full">
                           <p className="font-bold text-xs text-slate-900 dark:text-white mb-1">{cmt.author} <span className="text-[10px] text-slate-400 font-normal ml-2">{timeAgo(cmt.created_at)}</span></p>
                           <p className="text-[13px] text-slate-700 dark:text-slate-300 break-words leading-relaxed select-text">{cmt.text}</p>
                         </div>
                         <button onClick={() => setReplyingTo({ commentId: cmt.id, author: cmt.author })} className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 mt-2 ml-2 transition-colors outline-none cursor-pointer">Reply</button>
                         {cmt.replies && cmt.replies.length > 0 && (
                           <div className="flex flex-col gap-4 mt-4">
                             {cmt.replies.map(reply => (
                               <div key={reply.id} className="flex gap-2.5 relative z-10">
                                 <div className="w-7 h-7 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-white text-[10px] font-bold shrink-0 overflow-hidden shadow-sm">{reply.avatar_url ? <img src={reply.avatar_url} className="w-full h-full object-cover" /> : reply.author.charAt(0).toUpperCase()}</div>
                                 <div className="w-full">
                                   <div className="bg-slate-50/80 dark:bg-white/[0.03] px-3.5 py-2.5 rounded-2xl rounded-tl-none w-fit min-w-[100px] max-w-full">
                                     <p className="font-bold text-[11px] text-slate-900 dark:text-white mb-0.5">{reply.author} <span className="text-[9px] text-slate-400 font-normal ml-1.5">{timeAgo(reply.created_at)}</span></p>
                                     <p className="text-[13px] text-slate-700 dark:text-slate-300 break-words leading-relaxed select-text">{reply.text.startsWith('@') ? <><span className="text-blue-500 font-medium mr-1">{reply.text.split(' ')[0]}</span><span>{reply.text.substring(reply.text.indexOf(' '))}</span></> : reply.text}</p>
                                   </div>
                                   <button onClick={() => setReplyingTo({ commentId: cmt.id, author: reply.author, isSubReply: true })} className="text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 mt-1.5 ml-2 transition-colors outline-none cursor-pointer">Reply</button>
                                 </div>
                               </div>
                             ))}
                           </div>
                         )}
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>

            {replyingTo && (
              <div className="shrink-0 px-6 py-2 bg-slate-100 dark:bg-[#252528] flex justify-between items-center border-t border-slate-200 dark:border-white/10">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Replying to {replyingTo.author}...</span>
                <button onClick={() => setReplyingTo(null)} className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer outline-none">Cancel</button>
              </div>
            )}

            <div className="shrink-0 p-4 border-t border-slate-100 dark:border-white/10 flex gap-3 items-center">
               <input type="text" placeholder={replyingTo ? "Write a reply..." : "Add a comment..."} value={commentInput} onChange={(e) => setCommentInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitComment()} className="flex-1 bg-slate-100 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-full px-5 py-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-orange-400 select-text" />
               <button onClick={submitComment} disabled={isSubmittingComment || !commentInput.trim()} className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:dark:bg-white/10 text-white w-12 h-12 rounded-full flex items-center justify-center transition-all shrink-0 group outline-none cursor-pointer">
                 {isSubmittingComment ? <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}
               </button>
            </div>
          </div>
        </div>, document.body
      )}

      {/* 🚀 COOK MODE MODAL FOR PROFILE (z-[100000]) */}
      {mounted && cookModePost && createPortal(
        <div className="fixed inset-0 z-[100000] bg-white dark:bg-[#07070a] flex flex-col animate-in slide-in-from-bottom-full duration-500 select-none">
          <div className="w-full max-w-4xl mx-auto flex flex-col h-full relative">
            <div className="shrink-0 pt-10 pb-4 px-6 sm:px-10 bg-white dark:bg-[#07070a] border-b border-slate-100 dark:border-white/5 relative z-20">
              <button onClick={() => setCookModePost(null)} className="absolute top-8 right-6 sm:right-10 cursor-pointer bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/20 transition-colors outline-none [-webkit-tap-highlight-color:transparent]">✕</button>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6 pr-14 leading-tight select-text">{cookModePost.name}</h3>
              <div className="flex gap-1.5 mb-2">
                <div className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${currentStep === -1 ? 'bg-orange-500' : 'bg-slate-200 dark:bg-white/10'}`}></div>
                {cookModePost.steps.map((_: any, idx: number) => (
                  <div key={idx} className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${currentStep >= idx ? 'bg-orange-500' : 'bg-slate-200 dark:bg-white/10'}`}></div>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-10 no-scrollbar">
              {currentStep === -1 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-10">
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-500/10 dark:to-red-500/5 border border-orange-200 dark:border-orange-500/20 p-6 rounded-[2rem] flex justify-between items-center">
                    <div><span className="text-orange-600 dark:text-orange-400 font-extrabold text-base block">Serving Size</span></div>
                    <div className="flex items-center gap-5 bg-white dark:bg-black/40 p-2 rounded-2xl border border-orange-100 dark:border-white/5 shadow-sm dark:shadow-none">
                      <button onClick={() => setPortions(Math.max(1, portions - 1))} className="cursor-pointer w-12 h-12 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-900 dark:text-white font-black text-xl active:scale-95 transition-transform outline-none">-</button>
                      <span className="font-black text-slate-900 dark:text-white w-8 text-center text-xl">{portions}</span>
                      <button onClick={() => setPortions(portions + 1)} className="cursor-pointer w-12 h-12 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-900 dark:text-white font-black text-xl active:scale-95 transition-transform outline-none">+</button>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-slate-900 dark:text-white font-black text-xl mb-5">Ingredients</h4>
                    <ul className="grid grid-cols-1 gap-4">
                      {cookModePost.ingredients.map((ing: string, i: number) => (
                        <li key={i} className="flex items-center gap-5 bg-slate-50 dark:bg-white/[0.02] p-5 rounded-2xl border border-slate-100 dark:border-white/5">
                          <span className="text-slate-700 dark:text-white font-bold text-lg select-text">{ing} <span className="text-orange-500 dark:text-orange-400 ml-2">(x{portions})</span></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {currentStep >= 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-10 animate-in zoom-in-95 duration-500">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-5xl font-black text-white shadow-[0_8px_30px_#f9731666]">{currentStep + 1}</div>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-white px-4 leading-relaxed select-text">{cookModePost.steps[currentStep]}</h2>
                </div>
              )}
            </div>
            <div className="shrink-0 p-6 sm:px-10 pb-8 bg-gradient-to-t from-white dark:from-[#07070a] to-transparent relative z-20">
              {currentStep === -1 ? (
                <button onClick={() => setCurrentStep(0)} className="cursor-pointer w-full bg-slate-900 dark:bg-white text-white dark:text-black font-black text-xl py-5 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all outline-none shadow-[0_8px_30px_#00000033] dark:shadow-[0_8px_30px_#ffffff33]">Let's Start Cooking</button>
              ) : (
                <div className="flex gap-4">
                  <button onClick={() => setCurrentStep(currentStep - 1)} className="cursor-pointer w-1/3 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white font-extrabold text-lg py-5 rounded-2xl transition-colors active:scale-95 outline-none">Back</button>
                  <button onClick={() => { if (currentStep < cookModePost.steps.length - 1) setCurrentStep(currentStep + 1); else setCookModePost(null); }} className={`cursor-pointer w-2/3 text-white font-extrabold text-lg py-5 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg outline-none ${currentStep === cookModePost.steps.length - 1 ? 'bg-green-500 hover:bg-green-600 shadow-[0_8px_20px_#22c55e66]' : 'bg-orange-500 hover:bg-orange-600 shadow-[0_8px_20px_#f9731666]'}`}>
                    {currentStep === cookModePost.steps.length - 1 ? "Finish Meal 🍽️" : "Next Step"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>, document.body
      )}

      {/* 🚀 CUSTOM CONFIRM MODAL (GENERIC) */}
      {mounted && confirmDialog.isOpen && createPortal(
        <div className="fixed inset-0 z-[120000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200 select-none" onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}>
          <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border border-slate-200 dark:border-white/10 text-center" onClick={e => e.stopPropagation()}>
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl mb-4 ${confirmDialog.type === 'danger' ? 'bg-red-100 dark:bg-red-500/20 text-red-500' : 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-500'}`}>
                {confirmDialog.type === 'danger' ? '🗑️' : '⚠️'}
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{confirmDialog.title}</h3>
            <p className="text-sm text-slate-500 mb-6">{confirmDialog.desc}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} disabled={confirmDialog.isLoading} className="flex-1 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white font-bold py-3.5 rounded-xl transition-all outline-none cursor-pointer disabled:opacity-50">Cancel</button>
              <button onClick={executeConfirm} disabled={confirmDialog.isLoading} className={`flex-1 font-bold py-3.5 rounded-xl transition-all outline-none cursor-pointer active:scale-95 text-white disabled:opacity-50 flex items-center justify-center ${confirmDialog.type === 'danger' ? 'bg-red-500 hover:bg-red-600 shadow-[0_4px_15px_#ef44444d]' : 'bg-yellow-500 hover:bg-yellow-600 shadow-[0_4px_15px_rgba(234,179,8,0.3)]'}`}>
                  {confirmDialog.isLoading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : (confirmDialog.type === 'danger' ? 'Yes, Delete' : 'Confirm')}
              </button>
            </div>
          </div>
        </div>, document.body
      )}

      {/* TOASTS */}
      {mounted && toast.isOpen && createPortal(
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[130000] pointer-events-none animate-in slide-in-from-top-4 select-none">
          <div className="bg-slate-900 dark:bg-[#1c1c1e] text-white px-6 py-3.5 rounded-full shadow-lg text-sm font-bold border border-slate-700 dark:border-white/10 whitespace-nowrap">{toast.message}</div>
        </div>, document.body
      )}
    </div>
  );
}
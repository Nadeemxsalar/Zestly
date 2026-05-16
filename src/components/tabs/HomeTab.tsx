"use client";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

interface HomeTabProps {
  user: any;
}

interface CommentData {
  author: string;
  text: string;
}

interface FeedPost {
  id: string;
  name: string;
  type: string;
  emoji: string;
  gradient: string;
  is_liked: boolean;
  imageUrl?: string;
  authorName: string;
  authorId?: string;
  likesCount: number;
  commentsCount: number;
  cuisine: string;
  commentsList: CommentData[];
  ingredients: string[];
  steps: string[];
  time: string;
  calories: number;
  difficulty: string;
}

export default function HomeTab({ user }: HomeTabProps) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [trendingChefs, setTrendingChefs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: "" });
  const [toast, setToast] = useState({ isOpen: false, message: "" });

  const [activeCommentsPost, setActiveCommentsPost] = useState<FeedPost | null>(null);
  const [commentInput, setCommentInput] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false); 

  const [cookModePost, setCookModePost] = useState<FeedPost | null>(null);
  const [portions, setPortions] = useState(1);
  const [currentStep, setCurrentStep] = useState(-1);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"all" | "recipes" | "chefs">("all");
  const [isSearchActive, setIsSearchActive] = useState(false); 
  const [searchedChefs, setSearchedChefs] = useState<any[]>([]);
  
  const [viewingChef, setViewingChef] = useState<any | null>(null);
  const [viewingChefRecipes, setViewingChefRecipes] = useState<FeedPost[]>([]);
  const [isFollowingChef, setIsFollowingChef] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const [activeCuisine, setActiveCuisine] = useState<string>("All"); 
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const cuisinesList = [
    { name: "All", icon: "🌍" },
    { name: "Indian", icon: "🇮🇳" },
    { name: "Italian", icon: "🇮🇹" },
    { name: "Chinese", icon: "🇨🇳" },
    { name: "Desserts", icon: "🍰" },
    { name: "Mexican", icon: "🇲🇽" }
  ];

  useEffect(() => {
    setMounted(true);
    syncMyProfile();
    fetchFeedAndChefs();
  }, [user]);

  useEffect(() => {
    const fetchSearchedChefs = async () => {
      if ((searchMode === "chefs" || searchMode === "all") && searchQuery.trim().length > 0) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .ilike("full_name", `%${searchQuery}%`)
          .limit(20);
        if (data) setSearchedChefs(data);
      } else {
        setSearchedChefs([]);
      }
    };
    
    const delayDebounceFn = setTimeout(() => {
      fetchSearchedChefs();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, searchMode]);

  const syncMyProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("id, username").eq("id", user.id).single();
    if (!data) {
      const rawName = user.user_metadata?.full_name || "Chef Zestly";
      const baseUsername = user.email ? user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') : "zestly";
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const finalUsername = user.user_metadata?.username || `${baseUsername}_${randomDigits}`;

      await supabase.from("profiles").insert({
        id: user.id,
        full_name: rawName,
        username: finalUsername, 
        bio: "Passionate Chef at Zestly 🍳"
      });
    }
  };

  const fetchFeedAndChefs = async () => {
    const { data: recipesData, error } = await supabase
      .from("recipes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching recipes:", error);

    if (!error && recipesData) {
      const formattedPosts: FeedPost[] = recipesData.map((item, index) => {
        const mockCuisines = ["Indian", "Italian", "Mexican", "Chinese", "Desserts"];
        const assignedCuisine = mockCuisines[index % mockCuisines.length];

        return {
          id: item.id,
          name: item.name,
          type: item.type || "Veg",
          emoji: item.emoji || "🍲",
          gradient: item.gradient || "from-orange-500 to-red-600",
          is_liked: item.is_liked || false,
          imageUrl: item.image_url,
          authorName: item.author_name || "Chef Zestly", 
          authorId: item.author_id || item.user_id,
          likesCount: item.likes_count || 0,
          commentsList: item.comments_data || [], 
          commentsCount: item.comments_data ? item.comments_data.length : 0,
          cuisine: assignedCuisine,
          ingredients: item.ingredients || ["Secret Magic Ingredient"],
          steps: item.steps || ["Mix everything.", "Cook well and serve hot!"],
          time: item.time || "30 Min",
          calories: item.calories || 400,
          difficulty: item.difficulty || "Medium"
        };
      });
      setPosts(formattedPosts);
    }

    const { data: profilesData } = await supabase.from("profiles").select("*").limit(10);
    if (profilesData && profilesData.length > 0) {
      setTrendingChefs(profilesData);
    } else {
      setTrendingChefs([
        { id: "mock1", full_name: "Chef Zestly", followers: 12500 }, 
        { id: "mock2", full_name: "Chef Rahul", followers: 9800 }
      ]);
    }
    setIsLoading(false);
  };

  const showAlert = (message: string) => setAlertModal({ isOpen: true, message });
  const showToast = (message: string) => {
    setToast({ isOpen: true, message });
    setTimeout(() => setToast({ isOpen: false, message: "" }), 3000);
  };

  const checkAuth = () => {
    if (!user) {
      showAlert("Chef, you need to log in to interact! 👨‍🍳");
      setTimeout(() => router.push("/login"), 1500); 
      return false;
    }
    return true;
  };

  const openChefProfile = async (chefId: string, fallbackName: string) => {
    if (!checkAuth()) return;
    if (chefId.startsWith("mock")) {
      showToast("This is a demo profile! Create real recipes to see real profiles. ✨");
      return;
    }

    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", chefId).single();
    const { count: followersCount } = await supabase.from("follows").select("*", { count: 'exact', head: true }).eq("following_id", chefId);
    const { count: followingCount } = await supabase.from("follows").select("*", { count: 'exact', head: true }).eq("follower_id", chefId);
    const { data: followCheck } = await supabase.from("follows").select("id").match({ follower_id: user.id, following_id: chefId }).single();
    const chefPosts = posts.filter(p => p.authorId === chefId);
    
    setViewingChefRecipes(chefPosts);
    setIsFollowingChef(!!followCheck);
    setViewingChef({
      id: chefId,
      full_name: profileData?.full_name || fallbackName,
      username: profileData?.username || `zestly_${chefId.substring(0, 4)}`,
      bio: profileData?.bio || "Passionate Chef at Zestly 🍳",
      followersCount: followersCount || 0,
      followingCount: followingCount || 0,
      postsCount: chefPosts.length
    });
  };

  const handleFollowToggle = async () => {
    if (!checkAuth() || !viewingChef) return;
    if (viewingChef.id === user.id) {
      showToast("You can't follow yourself! 😅");
      return;
    }

    setIsFollowLoading(true);
    const wasFollowing = isFollowingChef;
    const targetId = viewingChef.id;
    const myId = user.id;

    setIsFollowingChef(!wasFollowing);
    setViewingChef((prev: any) => ({
      ...prev,
      followersCount: wasFollowing ? prev.followersCount - 1 : prev.followersCount + 1
    }));

    if (wasFollowing) {
      await supabase.from("follows").delete().match({ follower_id: myId, following_id: targetId });
    } else {
      await supabase.from("follows").insert({ follower_id: myId, following_id: targetId });
      
      await supabase.from("notifications").insert({
        user_id: targetId,
        actor_id: myId,
        type: 'follow'
      });
    }
    setIsFollowLoading(false);
  };

  const toggleLike = async (id: string) => {
    if (!checkAuth()) return;
    const post = posts.find(p => p.id === id);
    if (!post) return;

    const isNowLiked = !post.is_liked;
    const newLikesCount = isNowLiked ? post.likesCount + 1 : Math.max(0, post.likesCount - 1);

    setPosts(posts.map(p => p.id === id ? { ...p, is_liked: isNowLiked, likesCount: newLikesCount } : p));
    
    const { error } = await supabase.from("recipes").update({ 
      is_liked: isNowLiked, 
      likes_count: newLikesCount 
    }).eq("id", id);

    if (error) showToast("Failed to save like!");

    if (isNowLiked && post.authorId && post.authorId !== user.id) {
      await supabase.from("notifications").insert({
        user_id: post.authorId,
        actor_id: user.id,
        type: 'like',
        recipe_id: post.id
      });
    }
  };

  const handleShare = (postName: string) => {
    navigator.clipboard.writeText(`Zestly Recipe: ${postName}`);
    showToast(`Link for ${postName} copied! 🚀`);
  };

  const openComments = (post: FeedPost) => {
    if (!checkAuth()) return;
    setActiveCommentsPost(post);
  };

  const submitComment = async () => {
    if (!checkAuth() || !activeCommentsPost) return;
    const text = commentInput.trim();
    if (!text) return;

    setIsSubmittingComment(true); 
    const currentUserName = user?.user_metadata?.full_name?.split(" ")[0] || "Zestly"; 
    const newComment = { author: currentUserName, text: text };
    const newCommentsList = [...activeCommentsPost.commentsList, newComment];

    const updatedPost = { ...activeCommentsPost, commentsCount: newCommentsList.length, commentsList: newCommentsList };
    
    const { error } = await supabase.from("recipes").update({ comments_data: newCommentsList }).eq("id", activeCommentsPost.id);

    if (!error) {
      setPosts(posts.map(p => p.id === activeCommentsPost.id ? updatedPost : p));
      setActiveCommentsPost(updatedPost);
      setCommentInput("");
      showToast("Comment posted! 💬");
    } else {
      showToast("Failed to post comment. Check DB!");
    }
    setIsSubmittingComment(false); 
  };

  const openCookMode = (post: FeedPost) => {
    if (!checkAuth()) return;
    setCookModePost(post);
    setPortions(1);
    setCurrentStep(-1);
  };

  const filteredPosts = useMemo(() => {
    let result = posts;
    if (activeCuisine !== "All") result = result.filter(post => post.cuisine === activeCuisine);
    if (searchQuery && (searchMode === "recipes" || searchMode === "all")) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(post => post.name.toLowerCase().includes(lowerQuery) || post.type.toLowerCase().includes(lowerQuery));
    }
    return result;
  }, [posts, searchQuery, activeCuisine, searchMode]);

  const featuredPost = posts.length > 0 ? posts[0] : null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6 pb-24 relative max-w-full overflow-x-hidden cursor-default selection:bg-orange-500/10 w-full flex flex-col items-center">
      
      {/* SEARCH BAR WITH CANCEL BUTTON */}
      <div className="px-4 sm:px-1 pt-6 w-full max-w-5xl flex items-center gap-3">
        <div className="relative bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-white/5 p-1 rounded-full flex-1 flex items-center shadow-sm">
          <div className="pl-4 pr-2 text-slate-400 dark:text-slate-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onFocus={() => setIsSearchActive(true)}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chefs or recipes..."
            className="flex-1 w-full bg-transparent text-slate-900 dark:text-white font-medium px-2 py-3 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 cursor-text"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="p-3 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer active:scale-90 outline-none focus:outline-none [-webkit-tap-highlight-color:transparent]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          )}
        </div>
        {isSearchActive && (
          <button 
            onClick={() => { setIsSearchActive(false); setSearchQuery(""); }} 
            className="text-slate-900 dark:text-white font-bold text-sm px-2 cursor-pointer active:scale-95 outline-none [-webkit-tap-highlight-color:transparent]"
          >
            Cancel
          </button>
        )}
      </div>

      {/* 🚀 TRENDING CHEFS - MOVED DIRECTLY BELOW SEARCH BAR */}
      {!isSearchActive && trendingChefs.length > 0 && (
        <div className="w-full max-w-5xl pt-2">
          <div className="flex items-center justify-between mb-2 px-5 sm:px-1">
            <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Trending Chefs</h3>
          </div>
          <div className="flex gap-4 overflow-x-auto py-3 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {trendingChefs.map((chef, i, arr) => (
              <div key={i} onClick={() => openChefProfile(chef.id, chef.full_name)} className={`flex flex-col items-center shrink-0 snap-start cursor-pointer group outline-none focus:outline-none [-webkit-tap-highlight-color:transparent] ${i === 0 ? "ml-5 sm:ml-1" : ""} ${i === arr.length - 1 ? "mr-5 sm:mr-1" : ""}`}>
                <div className="relative w-16 h-16 sm:w-[76px] sm:h-[76px] rounded-full p-[3px] bg-linear-to-tr from-orange-500 via-red-500 to-purple-500 group-hover:scale-105 group-active:scale-95 transition-all duration-300 shadow-md mb-2">
                  <div className="w-full h-full bg-white dark:bg-[#1c1c1e] rounded-full flex items-center justify-center text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white border-[3px] border-white dark:border-[#07070a] transition-colors">
                    {chef.full_name.charAt(0)}
                  </div>
                  <div className="absolute bottom-0 right-0 bg-orange-500 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-white dark:border-[#07070a] flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  </div>
                </div>
                <span className="text-[11px] sm:text-sm font-bold text-slate-900 dark:text-white transition-colors">{chef.full_name.split(" ")[0]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INSTAGRAM STYLE TABS FOR SEARCH */}
      {isSearchActive && (
        <div className="w-full max-w-5xl px-4 sm:px-1 mt-2">
          <div className="flex gap-6 sm:gap-8 border-b border-slate-200 dark:border-white/10 px-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <button onClick={() => setSearchMode('all')} className={`pb-3 text-sm font-bold transition-colors whitespace-nowrap outline-none [-webkit-tap-highlight-color:transparent] ${searchMode === 'all' ? 'border-b-2 border-slate-900 dark:border-white text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>All</button>
            <button onClick={() => setSearchMode('recipes')} className={`pb-3 text-sm font-bold transition-colors whitespace-nowrap outline-none [-webkit-tap-highlight-color:transparent] ${searchMode === 'recipes' ? 'border-b-2 border-slate-900 dark:border-white text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>Recipes</button>
            <button onClick={() => setSearchMode('chefs')} className={`pb-3 text-sm font-bold transition-colors whitespace-nowrap outline-none [-webkit-tap-highlight-color:transparent] ${searchMode === 'chefs' ? 'border-b-2 border-slate-900 dark:border-white text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>Chefs</button>
          </div>
        </div>
      )}

      {/* SEARCH ACTIVE VIEW */}
      {isSearchActive ? (
        <div className="w-full max-w-5xl px-4 sm:px-1 flex-1">
          {!searchQuery ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-50">
              <span className="text-4xl mb-3">🔍</span>
              <p className="font-bold text-slate-500">Type something to search</p>
            </div>
          ) : searchMode === "chefs" ? (
            searchedChefs.length === 0 ? (
              <p className="text-slate-500 text-sm font-medium mt-4">No chefs found matching "{searchQuery}"</p>
            ) : (
              <div className="flex flex-col gap-4 mt-4">
                {searchedChefs.map((chef, i) => (
                  <div key={i} onClick={() => openChefProfile(chef.id, chef.full_name)} className="flex items-center gap-4 bg-white dark:bg-[#1c1c1e] p-4 rounded-[1.5rem] border border-slate-200 dark:border-white/5 cursor-pointer shadow-sm active:scale-95 transition-all">
                    <div className="w-14 h-14 rounded-full bg-linear-to-tr from-orange-500 to-red-500 flex items-center justify-center text-white text-xl font-bold">{chef.full_name.charAt(0)}</div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-base">{chef.full_name}</h4>
                      <p className="text-xs text-slate-500 font-medium">@{chef.username || `zestly_${chef.id.substring(0, 4)}`} • View Profile</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : searchMode === "recipes" ? (
            filteredPosts.length === 0 ? (
              <p className="text-slate-500 text-sm font-medium mt-4">No recipes found matching "{searchQuery}"</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 mt-4">
                {filteredPosts.map((post) => (
                  <div key={post.id} onClick={() => openCookMode(post)} className="aspect-square relative cursor-pointer group outline-none [-webkit-tap-highlight-color:transparent] overflow-hidden">
                    {post.imageUrl ? <img src={post.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className={`w-full h-full bg-linear-to-br ${post.gradient} flex items-center justify-center`}><span className="text-3xl sm:text-5xl">{post.emoji}</span></div>}
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="flex flex-col gap-8 mt-4">
              {searchedChefs.length === 0 && filteredPosts.length === 0 ? (
                <p className="text-slate-500 text-sm font-medium mt-4">No results found matching "{searchQuery}"</p>
              ) : (
                <>
                  {searchedChefs.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Top Chefs</h4>
                      <div className="flex flex-col gap-3">
                        {searchedChefs.slice(0, 3).map((chef, i) => (
                          <div key={i} onClick={() => openChefProfile(chef.id, chef.full_name)} className="flex items-center gap-4 bg-white dark:bg-[#1c1c1e] p-3 rounded-[1.2rem] border border-slate-200 dark:border-white/5 cursor-pointer shadow-sm active:scale-95 transition-all">
                            <div className="w-12 h-12 rounded-full bg-linear-to-tr from-orange-500 to-red-500 flex items-center justify-center text-white text-lg font-bold">{chef.full_name.charAt(0)}</div>
                            <div>
                              <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">{chef.full_name}</h4>
                              <p className="text-xs text-slate-500 font-medium">@{chef.username || `zestly_${chef.id.substring(0, 4)}`}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredPosts.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Top Recipes</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                        {filteredPosts.map((post) => (
                          <div key={post.id} onClick={() => openCookMode(post)} className="aspect-square relative cursor-pointer group outline-none [-webkit-tap-highlight-color:transparent] overflow-hidden">
                            {post.imageUrl ? <img src={post.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className={`w-full h-full bg-linear-to-br ${post.gradient} flex items-center justify-center`}><span className="text-3xl sm:text-5xl">{post.emoji}</span></div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        /* NORMAL FEED VIEW */
        <>
          <div className="w-full max-w-5xl">
            <div className="flex items-center justify-between mb-2 px-5 sm:px-1">
              <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Explore Cuisine</h3>
            </div>
            <div className="flex gap-3 overflow-x-auto py-2 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {cuisinesList.map((cuisine, index, arr) => (
                <button 
                  key={index}
                  onClick={() => setActiveCuisine(cuisine.name)}
                  className={`shrink-0 snap-start flex items-center gap-2 px-5 py-3.5 rounded-full font-bold text-sm transition-all duration-300 cursor-pointer border outline-none focus:outline-none [-webkit-tap-highlight-color:transparent] 
                    ${index === 0 ? "ml-5 sm:ml-1" : ""} 
                    ${index === arr.length - 1 ? "mr-5 sm:mr-1" : ""} 
                    ${activeCuisine === cuisine.name ? "bg-orange-500 text-white border-orange-500 shadow-[0_4px_15px_rgba(249,115,22,0.4)] scale-[1.02]" : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 dark:bg-[#1c1c1e] dark:text-slate-300 dark:border-transparent dark:hover:bg-white/10"}`}
                >
                  <span className="text-lg drop-shadow-sm">{cuisine.icon}</span> {cuisine.name}
                </button>
              ))}
            </div>
          </div>

          {!searchQuery && activeCuisine === "All" && featuredPost && (
            <div className="px-4 sm:px-1 w-full max-w-5xl">
              <div onClick={() => openCookMode(featuredPost)} className="relative w-full h-[22rem] sm:h-80 rounded-[2rem] overflow-hidden group cursor-pointer shadow-lg outline-none [-webkit-tap-highlight-color:transparent] border border-slate-200 dark:border-white/5">
                {featuredPost.imageUrl ? (
                  <img src={featuredPost.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className={`w-full h-full bg-linear-to-br ${featuredPost.gradient} flex items-center justify-center`}><span className="text-8xl">{featuredPost.emoji}</span></div>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent p-6 flex flex-col justify-end">
                  <div className="bg-orange-500/20 backdrop-blur-md text-orange-400 border border-orange-500/30 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full w-fit mb-3 flex items-center gap-1.5">🔥 Trending</div>
                  <h3 className="text-3xl font-black text-white leading-tight mb-2 drop-shadow-md">{featuredPost.name}</h3>
                  <div className="flex gap-5 mt-4 text-xs font-bold text-slate-300">
                     <span className="flex items-center gap-1.5 text-yellow-400"><span className="text-base">⭐</span> 4.8</span>
                     <span className="flex items-center gap-1.5"><span className="text-base">⏱️</span> {featuredPost.time}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 w-full max-w-5xl">
            <div className="flex justify-between items-end mb-5 px-5 sm:px-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{activeCuisine === "All" ? "Global Feed" : `${activeCuisine} Cuisine`}</h3>
            </div>
            
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 cursor-wait text-center"><div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-16 px-6 border-2 border-dashed border-slate-300 dark:border-white/10 rounded-[2.5rem] bg-white dark:bg-white/[0.01] mx-4"><p className="text-slate-500 dark:text-slate-400 font-medium text-sm">No recipes found!</p></div>
            ) : (
              <div className="flex flex-col gap-6 sm:grid sm:grid-cols-2 sm:gap-7 pb-4">
                {filteredPosts.map((post, index) => (
                  <div key={post.id} className="flex flex-col w-full px-2 sm:px-0">
                    {/* 🚀 Mobile UI Premium Card Update */}
                    <div className="relative bg-white dark:bg-[#0b0b0e] border border-slate-200/80 dark:border-white/10 rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-md dark:shadow-2xl transition-all sm:hover:-translate-y-1.5 sm:hover:shadow-[0_20px_50px_#0000001a] sm:dark:hover:border-white/20 group/card flex flex-col mx-2 sm:mx-0">
                      
                      <div className="py-3 px-4 sm:p-5 flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
                        <div onClick={() => openChefProfile(post.authorId || "mock", post.authorName)} className="flex items-center gap-3 cursor-pointer group outline-none focus:outline-none [-webkit-tap-highlight-color:transparent]">
                          <div className="w-10 h-10 rounded-full bg-linear-to-tr from-orange-500 to-red-500 p-[2px] shadow">
                            <div className="w-full h-full bg-white dark:bg-[#1c1c1e] rounded-full flex items-center justify-center text-sm font-black text-slate-900 dark:text-white uppercase transition-colors">{post.authorName.charAt(0)}</div>
                          </div>
                          <div className="flex flex-col">
                            <p className="text-sm text-slate-900 dark:text-white font-bold transition-colors leading-tight group-hover:underline">{post.authorName}</p>
                            <p className="text-[10px] text-slate-500 font-medium">Zestly Chef</p>
                          </div>
                        </div>
                      </div>

                      <div className={`w-full h-[22rem] sm:h-72 relative flex items-center justify-center cursor-pointer sm:overflow-hidden outline-none focus:outline-none [-webkit-tap-highlight-color:transparent] ${!post.imageUrl ? `bg-linear-to-br ${post.gradient}` : 'bg-slate-100 dark:bg-black'}`}>
                        {post.imageUrl ? <img src={post.imageUrl} className="w-full h-full object-cover sm:group-hover/card:scale-105 transition-transform duration-700" /> : <span className="text-8xl drop-shadow-2xl sm:group-hover/card:scale-110 transition-transform duration-500">{post.emoji}</span>}
                      </div>

                      <div className="pt-3 pb-5 px-4 sm:p-6 flex-1 flex flex-col justify-between bg-transparent transition-colors z-10">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-4">
                              <button onClick={() => toggleLike(post.id)} className="group transition-transform active:scale-125 cursor-pointer outline-none focus:outline-none [-webkit-tap-highlight-color:transparent]">
                                <svg className={`w-7 h-7 transition-all duration-300 outline-none focus:outline-none ${post.is_liked ? 'fill-red-500 text-red-500 scale-110' : 'text-slate-900 dark:text-white group-hover:text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                              </button>
                              
                              {/* 🚀 Comment Button with Instagram style count */}
                              <button onClick={() => openComments(post)} className="group flex items-center gap-1.5 cursor-pointer transition-colors active:scale-95 outline-none focus:outline-none [-webkit-tap-highlight-color:transparent]">
                                <svg className="w-7 h-7 text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                                {post.commentsCount > 0 && <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300">{post.commentsCount}</span>}
                              </button>

                              <button onClick={() => handleShare(post.name)} className="cursor-pointer active:scale-110 transition-transform outline-none focus:outline-none [-webkit-tap-highlight-color:transparent]">
                                <svg className="w-7 h-7 text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
                              </button>
                            </div>
                          </div>
                          
                          <p className="font-bold text-sm text-slate-900 dark:text-white mb-1.5">{post.likesCount} likes</p>
                          <p className="text-sm text-slate-900 dark:text-white leading-relaxed line-clamp-2"><strong className="mr-1.5 font-bold">{post.authorName}</strong> Check out this amazing recipe! 🥘✨</p>
                          
                          {/* 🚀 View All Comments Text (Insta Style) */}
                          {post.commentsCount > 0 && (
                            <p onClick={() => openComments(post)} className="text-[13px] text-slate-500 mt-1 cursor-pointer font-medium hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                              View all {post.commentsCount} comments
                            </p>
                          )}

                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* MODAL: INSTAGRAM STYLE CHEF PROFILE */}
      {mounted && viewingChef && createPortal(
        <div className="fixed inset-0 z-[99999] bg-slate-50 dark:bg-[#07070a] flex flex-col animate-in slide-in-from-bottom-full duration-500">
          <div className="w-full max-w-4xl mx-auto flex flex-col h-full relative bg-white dark:bg-[#07070a] shadow-2xl">
            
            <div className="shrink-0 flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-white/5 sticky top-0 bg-white dark:bg-[#07070a] z-50">
              <button onClick={() => setViewingChef(null)} className="cursor-pointer text-slate-600 dark:text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 transition-colors outline-none [-webkit-tap-highlight-color:transparent]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
              </button>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">{viewingChef.username || viewingChef.full_name.toLowerCase().replace(" ", "_")}</h3>
              <div className="w-10 h-10"></div> 
            </div>
            
            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-10">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-linear-to-tr from-orange-500 to-red-500 p-1 shrink-0">
                  <div className="w-full h-full bg-white dark:bg-[#1c1c1e] rounded-full flex items-center justify-center text-4xl sm:text-5xl font-black text-slate-900 dark:text-white uppercase">
                    {viewingChef.full_name.charAt(0)}
                  </div>
                </div>
                
                <div className="flex-1 w-full">
                  <div className="flex justify-around sm:justify-start sm:gap-12 mb-5 text-center sm:text-left">
                    <div className="flex flex-col"><span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{viewingChef.postsCount}</span><span className="text-xs text-slate-500 font-bold">Posts</span></div>
                    <div className="flex flex-col"><span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{viewingChef.followersCount}</span><span className="text-xs text-slate-500 font-bold">Followers</span></div>
                    <div className="flex flex-col"><span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{viewingChef.followingCount}</span><span className="text-xs text-slate-500 font-bold">Following</span></div>
                  </div>

                  <div className="mb-5">
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-base">{viewingChef.full_name}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium whitespace-pre-wrap leading-relaxed">{viewingChef.bio}</p>
                  </div>

                  {viewingChef.id !== user?.id && (
                    <button 
                      onClick={handleFollowToggle} 
                      disabled={isFollowLoading}
                      className={`cursor-pointer w-full sm:w-auto px-10 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center transition-all active:scale-95 outline-none [-webkit-tap-highlight-color:transparent] ${isFollowingChef ? 'bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20' : 'bg-orange-500 text-white hover:bg-orange-600 shadow-[0_4px_15px_#f973164d]'}`}
                    >
                      {isFollowLoading ? (
                        <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      ) : isFollowingChef ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-center border-t border-slate-200 dark:border-white/5">
                <div className="w-1/2 border-t-2 border-slate-900 dark:border-white py-3 flex justify-center text-slate-900 dark:text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-0.5 sm:gap-1 pb-10">
                {viewingChefRecipes.length === 0 ? (
                  <div className="col-span-3 text-center py-20 text-slate-500 font-medium text-sm">No recipes yet.</div>
                ) : (
                  viewingChefRecipes.map((post) => (
                    <div key={post.id} onClick={() => {setViewingChef(null); openCookMode(post);}} className="aspect-square relative cursor-pointer group outline-none [-webkit-tap-highlight-color:transparent] overflow-hidden">
                      {post.imageUrl ? (
                        <img src={post.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className={`w-full h-full bg-linear-to-br ${post.gradient} flex items-center justify-center`}><span className="text-3xl sm:text-5xl">{post.emoji}</span></div>
                      )}
                    </div>
                  ))
                )}
              </div>

            </div>
          </div>
        </div>,
        document.body
      )}

      {/* PORTALS FOR OTHER MODALS (Comments, Alerts, Toasts) */}
      {mounted && activeCommentsPost && createPortal(
        <div className="fixed inset-0 z-[99999] flex flex-col justify-end bg-black/60 dark:bg-black/80 backdrop-blur-sm sm:items-center sm:justify-center p-0 sm:p-4 transition-all">
          <div className="bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-white/10 w-full sm:w-[500px] h-[85vh] sm:h-[650px] rounded-t-[2.5rem] sm:rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl">
            <div className="shrink-0 flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-white/10 z-10">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Comments</h3>
              <button onClick={() => setActiveCommentsPost(null)} className="cursor-pointer text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 w-9 h-9 rounded-full flex items-center justify-center transition-colors">✕</button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
               {activeCommentsPost.commentsList.length === 0 ? (
                 <p className="text-center text-slate-500 mt-10">No comments yet. Be the first!</p>
               ) : (
                 <div className="flex flex-col gap-4">
                   {activeCommentsPost.commentsList.map((cmt, idx) => (
                     <div key={idx} className="flex gap-3">
                       <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">{cmt.author.charAt(0)}</div>
                       <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-2xl rounded-tl-none w-full">
                         <p className="font-bold text-xs text-slate-900 dark:text-white mb-1">{cmt.author}</p>
                         <p className="text-sm text-slate-700 dark:text-slate-300">{cmt.text}</p>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
            <div className="shrink-0 p-4 border-t border-slate-100 dark:border-white/10 flex gap-3 items-center">
               <input 
                 type="text" 
                 placeholder="Add a comment..." 
                 value={commentInput} 
                 onChange={(e) => setCommentInput(e.target.value)} 
                 className="flex-1 bg-slate-100 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-full px-5 py-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-orange-400" 
               />
               
               {/* 🚀 UX Update: Animated Paper Plane Send Icon */}
               <button 
                 onClick={submitComment} 
                 disabled={isSubmittingComment || !commentInput.trim()}
                 className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:dark:bg-white/10 text-white w-12 h-12 rounded-full flex items-center justify-center transition-all shrink-0 group outline-none cursor-pointer"
               >
                 {isSubmittingComment ? (
                   <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                 ) : (
                   <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                   </svg>
                 )}
               </button>
            </div>
          </div>
        </div>, document.body
      )}

      {mounted && cookModePost && createPortal(
        <div className="fixed inset-0 z-[99999] bg-white dark:bg-[#07070a] flex flex-col transition-all">
          <div className="w-full max-w-4xl mx-auto flex flex-col h-full relative">
            <div className="shrink-0 pt-10 pb-4 px-6 sm:px-10 border-b border-slate-100 dark:border-white/5 relative z-20">
              <button onClick={() => setCookModePost(null)} className="absolute top-8 right-6 cursor-pointer bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-200">✕</button>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6 pr-14 leading-tight">{cookModePost.name}</h3>
            </div>
          </div>
        </div>, document.body
      )}

      {mounted && toast.isOpen && createPortal(
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[99999] pointer-events-none">
          <div className="bg-slate-900 dark:bg-[#1c1c1e] text-white px-6 py-3.5 rounded-full shadow-lg text-sm font-bold border border-slate-700 dark:border-white/10">{toast.message}</div>
        </div>, document.body
      )}
    </div>
  );
}
"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

// ─── TYPES ────────────────────────────────────────────────
interface HomeTabProps {
  user: any;
}

interface CommentReply {
  id: string;
  author: string;
  avatar_url?: string;
  text: string;
  created_at?: string;
}

interface CommentData {
  id: string;
  author: string;
  avatar_url?: string;
  text: string;
  replies: CommentReply[];
  created_at?: string;
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
  authorAvatar?: string;
  authorIsVerified: boolean; 
  realLikesCount: number; 
  realViewsCount: number; 
  likesCount: number;     
  viewsCount: number;     
  commentsCount: number;
  cuisine: string;
  commentsList: CommentData[];
  ingredients: string[];
  steps: string[];
  time: string;
  calories: number;
  difficulty: string;
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

const formatNum = (n: number) => {
  if (!n) return "0";
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
};

// 🚀 ULTRA-REALISTIC INSTAGRAM-LEVEL VIRAL ENGINE
const getHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
  }
  return Math.abs(hash);
};

const calculateFakeFollowers = (id: string, createdAt: string, isFakeOn: boolean) => {
    if (!isFakeOn || !id || !createdAt) return 0;
    
    const now = Date.now();
    const createdTime = new Date(createdAt).getTime();
    if (createdTime > now) return 0;

    const ageInMinutes = Math.floor((now - createdTime) / 60000);

    // 🛑 STRICT LOCK: 180 mins (3 hours)
    const delayMinutes = 180; 
    if (ageInMinutes <= delayMinutes) return 0; 

    const activeHours = (ageInMinutes - delayMinutes) / 60;
    const hash = getHash(id);
    const tier = hash % 100;
    
    let maxCap, speedFactor;

    // 🧠 Instagram-Style Multi-Tier Scalability
    if (tier < 60) {
        maxCap = 50 + (hash % 450);
        speedFactor = 24 * 15; 
    } else if (tier < 90) {
        maxCap = 1000 + (hash % 9000);
        speedFactor = 24 * 30;
    } else {
        maxCap = 15000 + (hash % 85000);
        speedFactor = 24 * 45;
    }

    const variance = 1 + ((hash % 10) / 100); 
    const followers = Math.floor(maxCap * (1 - Math.exp(-(activeHours * variance) / speedFactor)));
    
    return followers > 0 ? followers : 0;
};

const calculateFakeLikes = (id: string, createdAt: string, isFakeOn: boolean) => {
    if (!isFakeOn || !id || !createdAt) return 0;
    
    const now = Date.now();
    const createdTime = new Date(createdAt).getTime();
    if (createdTime > now) return 0;

    const ageInMinutes = Math.floor((now - createdTime) / 60000);

    // 🛑 STRICT LOCK: 120 mins (2 hours)
    const delayMinutes = 120;
    if (ageInMinutes <= delayMinutes) return 0;

    const activeHours = (ageInMinutes - delayMinutes) / 60;
    const hash = getHash(id);
    const tier = hash % 100;
    
    let maxCap, speedFactor;

    // 🧠 Post Virality Tiers
    if (tier < 50) {
        maxCap = 20 + (hash % 180);
        speedFactor = 12; 
    } else if (tier < 85) {
        maxCap = 300 + (hash % 2700);
        speedFactor = 24; 
    } else {
        maxCap = 5000 + (hash % 45000);
        speedFactor = 48; 
    }

    const surge = (tier >= 85 && activeHours < 48) ? 1.5 : 1;
    const likes = Math.floor(maxCap * (1 - Math.exp(-(activeHours * surge) / speedFactor)));

    return likes > 0 ? likes : 0;
};


// 🚀 REUSABLE VERIFIED BADGE COMPONENT (FIXED POSITIONING)
const VerifiedBadge = ({ sizeClass = "w-5 h-5", noTooltip = false, containerClass = "" }: { sizeClass?: string, noTooltip?: boolean, containerClass?: string }) => (
    <div className={`relative flex items-center justify-center group shrink-0 cursor-pointer ${containerClass}`} title={noTooltip ? "" : "Official Verified Creator"}>
        {/* 🔥 Soft Animated Glow */}
        <div className="absolute inset-0 bg-orange-500 rounded-full blur-[6px] opacity-40 animate-pulse pointer-events-none"></div>
        {/* ✨ Floating Light Ring */}
        <div className="absolute inset-0 rounded-full border border-orange-300/30 scale-110 animate-ping pointer-events-none"></div>
        {/* ✅ Exact Instagram-Type Rosette Badge */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={`${sizeClass} relative z-10 drop-shadow-[0_4px_12px_rgba(249,115,22,0.55)] transition-all duration-300 group-hover:scale-110`}>
            <defs>
                <linearGradient id="zestly-premium-badge" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fde68a" />
                    <stop offset="35%" stopColor="#f59e0b" />
                    <stop offset="70%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#ea580c" />
                </linearGradient>
            </defs>
            <path fill="url(#zestly-premium-badge)" d="M12 0.8L14.6 2.1L17.5 1.4L18.8 4L21.4 5.2L20.7 8.1L23.2 10.5L20.7 12.9L21.4 15.8L18.8 17L17.5 19.6L14.6 18.9L12 21.2L9.4 18.9L6.5 19.6L5.2 17L2.6 15.8L3.3 12.9L0.8 10.5L3.3 8.1L2.6 5.2L5.2 4L6.5 1.4L9.4 2.1Z"/>
            <path fill="rgba(255,255,255,0.22)" d="M12 2.2C15.5 2.2 18 4.2 19.2 7.2C17.2 5.7 14.8 4.8 12 4.8C9.2 4.8 6.8 5.7 4.8 7.2C6 4.2 8.5 2.2 12 2.2Z"/>
            <path fill="#fff" d="M10.2 15.7L6.9 12.4L8.4 10.9L10.2 12.7L15.8 7.1L17.3 8.6L10.2 15.7Z"/>
        </svg>
        {!noTooltip && (
            <div className="absolute bottom-full mb-2.5 whitespace-nowrap bg-orange-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all shadow-xl pointer-events-none border border-orange-400 z-50">
                OFFICIAL CREATOR 🏆
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-orange-600"></div>
            </div>
        )}
    </div>
);

// ─── COMPONENT ────────────────────────────────────────────
export default function HomeTab({ user }: HomeTabProps) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [trendingChefs, setTrendingChefs] = useState<any[]>([]);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [savedRecipeIds, setSavedRecipeIds] = useState<string[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  
  // 🚀 PAGINATION & INFINITE SCROLL STATES
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const POSTS_PER_PAGE = 6;

  // 🚀 ZESTLY GROWTH ALGORITHM STATE
  const [fakeMode, setFakeMode] = useState(false);

  const [alertModal, setAlertModal] = useState({ isOpen: false, message: "" });
  const [toast, setToast] = useState({ isOpen: false, message: "" });

  const [activeCommentsPost, setActiveCommentsPost] = useState<FeedPost | null>(null);
  const [commentInput, setCommentInput] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false); 
  const [replyingTo, setReplyingTo] = useState<{ commentId: string, author: string, isSubReply?: boolean } | null>(null);

  const [cookModePost, setCookModePost] = useState<FeedPost | null>(null);
  const [portions, setPortions] = useState(1);
  const [currentStep, setCurrentStep] = useState(-1);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"all" | "recipes" | "chefs">("all");
  const [isSearchActive, setIsSearchActive] = useState(false); 
  const [searchedChefs, setSearchedChefs] = useState<any[]>([]);
  const [searchedRecipes, setSearchedRecipes] = useState<FeedPost[]>([]);
  
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
    fetchInitialFeedAndChefs();
  }, [user]);

  // 🚀 THE ILLUSION ENGINE: Live Ticking Engagement
  useEffect(() => {
    if (!fakeMode) return;
    
    const interval = setInterval(() => {
      setPosts(currentPosts => {
        if (currentPosts.length === 0) return currentPosts;
        const newPosts = [...currentPosts];
        const randomIdx = Math.floor(Math.random() * newPosts.length);
        const postToBoost = newPosts[randomIdx];
        
        newPosts[randomIdx] = {
          ...postToBoost,
          viewsCount: postToBoost.viewsCount + Math.floor(Math.random() * 8) + 2, 
          likesCount: Math.random() > 0.6 ? postToBoost.likesCount + 1 : postToBoost.likesCount
        };
        return newPosts;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [fakeMode]);

  // 🚀 SERVER-SIDE SEARCH
  useEffect(() => {
    const fetchSearchedData = async () => {
      if (searchQuery.trim().length > 0) {
        if (searchMode === "chefs" || searchMode === "all") {
          const { data } = await supabase.from("profiles").select("*").ilike("full_name", `%${searchQuery}%`).limit(20);
          if (data) setSearchedChefs(data);
        }
        if (searchMode === "recipes" || searchMode === "all") {
           const { data } = await supabase.from("recipes").select("*").ilike("name", `%${searchQuery}%`).limit(20);
           if (data) {
              const formatted = await formatRecipesData(data, 0, fakeMode);
              setSearchedRecipes(formatted);
           }
        }
      } else {
        setSearchedChefs([]);
        setSearchedRecipes([]);
      }
    };
    
    const delayDebounceFn = setTimeout(() => { fetchSearchedData(); }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, searchMode, fakeMode]);

  // 🚀 INTERSECTION OBSERVER FOR INFINITE SCROLL
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetchingMore && !isLoading && !searchQuery && activeCuisine === "All") {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) observer.observe(observerTarget.current);
    
    return () => observer.disconnect();
  }, [hasMore, isFetchingMore, isLoading, searchQuery, activeCuisine, page]);

  const syncMyProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    
    if (!data) {
      const rawName = user.user_metadata?.full_name || "Chef Zestly";
      const baseUsername = user.email ? user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') : "zestly";
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const finalUsername = user.user_metadata?.username || `${baseUsername}_${randomDigits}`;

      await supabase.from("profiles").upsert({
        id: user.id,
        full_name: rawName,
        username: finalUsername, 
        bio: "Passionate Chef at Zestly 🍳"
      });
      
      const { data: newProfile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (newProfile) {
        setMyProfile(newProfile);
        setSavedRecipeIds(newProfile.saved_recipes || []);
      }
    } else {
      setMyProfile(data);
      setSavedRecipeIds(data.saved_recipes || []);
    }
  };

  // 🚀 CORE FORMATTING LOGIC
  const formatRecipesData = async (recipesData: any[], startIndex: number, isFakeOn: boolean) => {
    const authorIds = [...new Set(recipesData.map(r => r.author_id).filter(Boolean))];
    const { data: profiles } = await supabase.from("profiles").select("*").in("id", authorIds);
    const profileMap = new Map();
    profiles?.forEach(p => profileMap.set(p.id, p));

    return recipesData.map((item, localIndex) => {
      const index = startIndex + localIndex;
      const mockCuisines = ["Indian", "Italian", "Mexican", "Chinese", "Desserts"];
      const assignedCuisine = mockCuisines[index % mockCuisines.length];

      const safeComments: CommentData[] = (item.comments_data || []).map((c: any, i: number) => ({
        id: c.id || `legacy_${i}_${Date.now()}`,
        author: c.author || "Chef",
        avatar_url: c.avatar_url || null,
        text: c.text || "",
        replies: c.replies || [],
        created_at: c.created_at || new Date().toISOString()
      }));

      const totalComments = safeComments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);
      const authorProfile = profileMap.get(item.author_id);
      
      const realLikes = item.likes_count || 0;
      const realViews = item.views_count || Math.floor(Math.random() * 20); 

      let displayLikes = realLikes;
      let displayViews = realViews;

      // 🛑 BUG FIXED: Now properly using the Instagram Engine!
      if (isFakeOn) {
          const engineLikes = calculateFakeLikes(item.id, item.created_at, isFakeOn);
          displayLikes = realLikes + engineLikes;
          displayViews = realViews + (engineLikes > 0 ? engineLikes * (Math.floor(Math.random() * 4) + 6) : 0);
      }

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
        authorAvatar: authorProfile?.avatar_url || null, 
        authorIsVerified: authorProfile?.is_verified || false, 
        realLikesCount: realLikes,
        realViewsCount: realViews,
        likesCount: displayLikes,
        viewsCount: displayViews,
        commentsList: safeComments, 
        commentsCount: totalComments,
        cuisine: assignedCuisine,
        ingredients: item.ingredients || ["Secret Magic Ingredient"],
        steps: item.steps || ["Mix everything.", "Cook well and serve hot!"],
        time: item.time || "30 Min",
        calories: item.calories || 400,
        difficulty: item.difficulty || "Medium"
      };
    });
  };

  // 🚀 INITIAL FETCH
  const fetchInitialFeedAndChefs = async () => {
    setIsLoading(true);
    const { data: settingsData } = await supabase.from("app_settings").select("fake_engagement_enabled").eq("id", 1).single();
    const isFakeOn = settingsData ? settingsData.fake_engagement_enabled : false;
    setFakeMode(isFakeOn);

    const { data: profilesData } = await supabase.from("profiles").select("*").order("bonus_followers", { ascending: false }).limit(10);
    
    // 🛑 BUG FIXED: No more hardcoded 1200 followers! Now using the engine.
    if (profilesData && profilesData.length > 0) {
      const formattedChefs = profilesData.map(p => ({
          ...p,
          followers: isFakeOn ? (p.followers_count || 0) + (p.bonus_followers || 0) + calculateFakeFollowers(p.id, p.created_at, isFakeOn) : (p.followers_count || 0),
          is_verified: p.is_verified || false
      })).sort((a, b) => b.followers - a.followers);
      setTrendingChefs(formattedChefs);
    } else {
      setTrendingChefs([{ id: "mock1", full_name: "Chef Zestly", followers: 12500, is_verified: true }]);
    }

    const { data: recipesData } = await supabase
      .from("recipes")
      .select("*")
      .order("created_at", { ascending: false })
      .range(0, POSTS_PER_PAGE - 1);

    if (recipesData) {
      const formatted = await formatRecipesData(recipesData, 0, isFakeOn);
      setPosts(formatted);
      setPage(1);
      if (recipesData.length < POSTS_PER_PAGE) setHasMore(false);
    }
    setIsLoading(false);
  };

  // 🚀 LOAD MORE POSTS (INFINITE SCROLL)
  const loadMorePosts = async () => {
    if (isFetchingMore || !hasMore || isLoading) return;
    setIsFetchingMore(true);

    const from = page * POSTS_PER_PAGE;
    const to = from + POSTS_PER_PAGE - 1;

    const { data: recipesData } = await supabase
      .from("recipes")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (recipesData && recipesData.length > 0) {
      const formatted = await formatRecipesData(recipesData, page * POSTS_PER_PAGE, fakeMode);
      
      setPosts(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newUniquePosts = formatted.filter(p => !existingIds.has(p.id));
        return [...prev, ...newUniquePosts];
      });

      setPage(p => p + 1);
      if (recipesData.length < POSTS_PER_PAGE) setHasMore(false);
    } else {
      setHasMore(false);
    }
    setIsFetchingMore(false);
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

  const toggleSave = async (recipeId: string) => {
    if (!checkAuth()) return;
    const isAlreadySaved = savedRecipeIds.includes(recipeId);
    
    const updatedSavedIds = isAlreadySaved 
      ? savedRecipeIds.filter(id => id !== recipeId) 
      : [...savedRecipeIds, recipeId];
      
    setSavedRecipeIds(updatedSavedIds);
    showToast(isAlreadySaved ? "Removed from Vault 🔓" : "Saved to Private Vault 🔒✨");

    await supabase.from("profiles").update({ saved_recipes: updatedSavedIds }).eq("id", user.id);
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
    
    const { data: cPosts } = await supabase.from("recipes").select("*").eq("author_id", chefId);
    const formattedChefPosts = cPosts ? await formatRecipesData(cPosts, 0, fakeMode) : [];
    
    const realF = followersCount || 0;
    const bonusF = profileData?.bonus_followers || 0;
    
    // 🛑 BUG FIXED: Now properly scaling followers instead of flat + 1200
    const engineF = calculateFakeFollowers(chefId, profileData?.created_at, fakeMode);
    const finalFollowers = fakeMode ? realF + bonusF + engineF : realF;

    setViewingChefRecipes(formattedChefPosts);
    setIsFollowingChef(!!followCheck);
    setViewingChef({
      id: chefId,
      full_name: profileData?.full_name || fallbackName,
      username: profileData?.username || `zestly_${chefId.substring(0, 4)}`,
      bio: profileData?.bio || "Passionate Chef at Zestly 🍳",
      avatar_url: profileData?.avatar_url || null,
      followersCount: finalFollowers,
      followingCount: followingCount || 0,
      postsCount: formattedChefPosts.length,
      is_verified: profileData?.is_verified || false 
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
    const post = posts.find(p => p.id === id) || searchedRecipes.find(p => p.id === id);
    if (!post) return;

    const isNowLiked = !post.is_liked;
    
    const newRealLikesCount = isNowLiked ? post.realLikesCount + 1 : Math.max(0, post.realLikesCount - 1);
    const newDisplayLikes = isNowLiked ? post.likesCount + 1 : Math.max(0, post.likesCount - 1);

    const updateMap = (pList: FeedPost[]) => pList.map(p => p.id === id ? { ...p, is_liked: isNowLiked, realLikesCount: newRealLikesCount, likesCount: newDisplayLikes } : p);
    
    setPosts(updateMap);
    setSearchedRecipes(updateMap);
    
    const { error } = await supabase.from("recipes").update({ 
      is_liked: isNowLiked, 
      likes_count: newRealLikesCount 
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

  const recordView = async (post: FeedPost) => {
      const updateMap = (pList: FeedPost[]) => pList.map(p => p.id === post.id ? { ...p, viewsCount: p.viewsCount + 1, realViewsCount: p.realViewsCount + 1 } : p);
      setPosts(updateMap);
      setSearchedRecipes(updateMap);
      await supabase.from("recipes").update({ views_count: post.realViewsCount + 1 }).eq("id", post.id);
  };

  const handleShare = async (postName: string) => {
    const shareUrl = window.location.href;
    const shareTitle = `Zestly Recipe: ${postName}`;
    const shareText = `Look at this amazing ${postName} recipe I found on Zestly! 🥘✨\n\n`;

    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
        showToast("Shared successfully! 🚀");
        return;
      } catch (err) {
        console.log("Share sheet cancelled.");
      }
    }
    navigator.clipboard.writeText(`${shareText}${shareUrl}`);
    showToast(`Link copied to clipboard! 📋`);
  };

  const openComments = (post: FeedPost) => {
    if (!checkAuth()) return;
    setActiveCommentsPost(post);
    setReplyingTo(null);
  };

  const submitComment = async () => {
    if (!checkAuth() || !activeCommentsPost) return;
    const text = commentInput.trim();
    if (!text) return;

    setIsSubmittingComment(true); 
    const currentUserName = myProfile?.full_name?.split(" ")[0] || user?.user_metadata?.full_name?.split(" ")[0] || "Chef"; 
    
    const finalText = replyingTo?.isSubReply && !text.startsWith(`@${replyingTo.author}`) 
      ? `@${replyingTo.author} ${text}` 
      : text;

    const newEntry = {
      id: Date.now().toString(),
      author: currentUserName,
      avatar_url: myProfile?.avatar_url || null,
      text: finalText,
      created_at: new Date().toISOString(),
      replies: []
    };

    let newCommentsList = [...activeCommentsPost.commentsList];

    if (replyingTo) {
      newCommentsList = newCommentsList.map(cmt => {
        if (cmt.id === replyingTo.commentId) {
          return { ...cmt, replies: [...(cmt.replies || []), newEntry] };
        }
        return cmt;
      });
    } else {
      newCommentsList.push(newEntry);
    }

    const totalComments = newCommentsList.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);
    const updatedPost = { ...activeCommentsPost, commentsCount: totalComments, commentsList: newCommentsList };
    
    const safeJsonData = JSON.parse(JSON.stringify(newCommentsList));
    const { error } = await supabase.from("recipes").update({ comments_data: safeJsonData }).eq("id", activeCommentsPost.id);

    if (!error) {
      const updateMap = (pList: FeedPost[]) => pList.map(p => p.id === activeCommentsPost.id ? updatedPost : p);
      setPosts(updateMap);
      setSearchedRecipes(updateMap);
      setActiveCommentsPost(updatedPost);
      setCommentInput("");
      setReplyingTo(null);
      showToast(replyingTo ? "Reply posted! 💬" : "Comment posted! 💬");
    } else {
      showToast("Failed to post comment. Check DB!");
    }
    setIsSubmittingComment(false); 
  };

  const openCookMode = (post: FeedPost) => {
    if (!checkAuth()) return;
    recordView(post); 
    setCookModePost(post);
    setPortions(1);
    setCurrentStep(-1);
  };

  const displayPosts = useMemo(() => {
    if (searchQuery && (searchMode === "recipes" || searchMode === "all")) {
        return searchedRecipes;
    }
    let result = posts;
    if (activeCuisine !== "All") result = result.filter(post => post.cuisine === activeCuisine);
    return result;
  }, [posts, searchedRecipes, searchQuery, activeCuisine, searchMode]);

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

      {/* TRENDING CHEFS */}
      {!isSearchActive && trendingChefs.length > 0 && (
        <div className="w-full max-w-5xl pt-2">
          <div className="flex items-center justify-between mb-2 px-5 sm:px-1">
            <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                Trending Chefs {fakeMode && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>}
            </h3>
          </div>
          <div className="flex gap-4 overflow-x-auto py-3 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {trendingChefs.map((chef, i, arr) => (
              <div key={i} onClick={() => openChefProfile(chef.id, chef.full_name)} className={`flex flex-col items-center shrink-0 snap-start cursor-pointer group outline-none focus:outline-none [-webkit-tap-highlight-color:transparent] ${i === 0 ? "ml-5 sm:ml-1" : ""} ${i === arr.length - 1 ? "mr-5 sm:mr-1" : ""}`}>
                <div className="relative w-16 h-16 sm:w-[76px] sm:h-[76px] shrink-0">
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-orange-500 via-red-500 to-purple-500 p-[3px] group-hover:scale-105 group-active:scale-95 transition-all duration-300 shadow-md">
                    <div className="w-full h-full bg-white dark:bg-[#1c1c1e] rounded-full flex items-center justify-center text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white border-[3px] border-white dark:border-[#07070a] transition-colors overflow-hidden">
                      {chef.avatar_url ? (
                        <img src={chef.avatar_url} className="w-full h-full object-cover" alt={chef.full_name} />
                      ) : (
                        chef.full_name.charAt(0).toUpperCase()
                      )}
                    </div>
                  </div>
                  {/* 🚀 BADGE INTEGRATION IN TRENDING LIST ON DP */}
                  {chef.is_verified && (
                      <div className="absolute bottom-0 right-0 z-20">
                          <VerifiedBadge sizeClass="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px]" noTooltip={true} />
                      </div>
                  )}
                </div>
                <span className="text-[11px] sm:text-sm font-bold text-slate-900 dark:text-white transition-colors truncate max-w-[70px] mt-2">{chef.full_name.split(" ")[0]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEARCH TABS */}
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
                    <div className="relative shrink-0 w-14 h-14">
                      <div className="w-full h-full rounded-full bg-gradient-to-tr from-orange-500 to-red-500 flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                        {chef.avatar_url ? <img src={chef.avatar_url} className="w-full h-full object-cover" /> : chef.full_name.charAt(0).toUpperCase()}
                      </div>
                      {/* 🚀 BADGE INTEGRATION ON DP IN SEARCH */}
                      {chef.is_verified && (
                          <div className="absolute bottom-0 right-0 z-20">
                              <VerifiedBadge sizeClass="w-[18px] h-[18px]" noTooltip={true}/>
                          </div>
                      )}
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 dark:text-white text-base">
                          {chef.full_name}
                      </div>
                      <p className="text-xs text-slate-500 font-medium">@{chef.username || `zestly_${chef.id.substring(0, 4)}`} • View Profile</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : searchMode === "recipes" ? (
            displayPosts.length === 0 ? (
              <p className="text-slate-500 text-sm font-medium mt-4">No recipes found matching "{searchQuery}"</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 mt-4">
                {displayPosts.map((post) => (
                  <div key={post.id} onClick={() => openCookMode(post)} className="aspect-square relative cursor-pointer group outline-none [-webkit-tap-highlight-color:transparent] overflow-hidden">
                    {post.imageUrl ? <img src={post.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className={`w-full h-full bg-gradient-to-br ${post.gradient} flex items-center justify-center`}><span className="text-3xl sm:text-5xl">{post.emoji}</span></div>}
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="flex flex-col gap-8 mt-4">
              {searchedChefs.length === 0 && displayPosts.length === 0 ? (
                <p className="text-slate-500 text-sm font-medium mt-4">No results found matching "{searchQuery}"</p>
              ) : (
                <>
                  {searchedChefs.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Top Chefs</h4>
                      <div className="flex flex-col gap-3">
                        {searchedChefs.slice(0, 3).map((chef, i) => (
                          <div key={i} onClick={() => openChefProfile(chef.id, chef.full_name)} className="flex items-center gap-4 bg-white dark:bg-[#1c1c1e] p-3 rounded-[1.2rem] border border-slate-200 dark:border-white/5 cursor-pointer shadow-sm active:scale-95 transition-all">
                            <div className="relative shrink-0 w-12 h-12">
                              <div className="w-full h-full rounded-full bg-gradient-to-tr from-orange-500 to-red-500 flex items-center justify-center text-white text-lg font-bold overflow-hidden">
                                {chef.avatar_url ? <img src={chef.avatar_url} className="w-full h-full object-cover" /> : chef.full_name.charAt(0).toUpperCase()}
                              </div>
                              {/* 🚀 BADGE INTEGRATION ON DP IN TOP CHEFS SEARCH */}
                              {chef.is_verified && (
                                  <div className="absolute bottom-0 right-0 z-20">
                                      <VerifiedBadge sizeClass="w-[16px] h-[16px]" noTooltip={true}/>
                                  </div>
                              )}
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                                  {chef.full_name}
                              </div>
                              <p className="text-xs text-slate-500 font-medium">@{chef.username || `zestly_${chef.id.substring(0, 4)}`}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {displayPosts.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Top Recipes</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                        {displayPosts.map((post) => (
                          <div key={post.id} onClick={() => openCookMode(post)} className="aspect-square relative cursor-pointer group outline-none [-webkit-tap-highlight-color:transparent] overflow-hidden">
                            {post.imageUrl ? <img src={post.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className={`w-full h-full bg-gradient-to-br ${post.gradient} flex items-center justify-center`}><span className="text-3xl sm:text-5xl">{post.emoji}</span></div>}
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
                  <div className={`w-full h-full bg-gradient-to-br ${featuredPost.gradient} flex items-center justify-center`}><span className="text-8xl">{featuredPost.emoji}</span></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 flex flex-col justify-end">
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
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  {activeCuisine === "All" ? "Global Feed" : `${activeCuisine} Cuisine`}
                  {fakeMode && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#4ade80]"></span>}
              </h3>
            </div>
            
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 cursor-wait text-center"><div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : displayPosts.length === 0 ? (
              <div className="text-center py-16 px-6 border-2 border-dashed border-slate-300 dark:border-white/10 rounded-[2.5rem] bg-white dark:bg-white/[0.01] mx-4"><p className="text-slate-500 dark:text-slate-400 font-medium text-sm">No recipes found!</p></div>
            ) : (
              <div className="flex flex-col gap-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-7 pb-4">
                {displayPosts.map((post) => (
                  <div key={post.id} className="flex flex-col w-full border-b-[8px] sm:border-b-0 border-slate-100 dark:border-[#121216] sm:bg-transparent">
                    
                    <div className="relative bg-white dark:bg-[#0b0b0e] border-y sm:border border-slate-200/80 dark:border-white/10 rounded-none sm:rounded-[2.5rem] overflow-hidden shadow-none sm:shadow-md dark:shadow-2xl transition-all sm:hover:-translate-y-1.5 sm:hover:shadow-[0_20px_50px_#0000001a] sm:dark:hover:border-white/20 group/card flex flex-col">
                      
                      {/* Author Header */}
                      <div className="py-3 px-4 sm:p-5 flex justify-between items-center bg-transparent border-b border-slate-100 dark:border-white/5 z-10">
                        <div onClick={() => openChefProfile(post.authorId || "mock", post.authorName)} className="flex items-center gap-3 cursor-pointer group outline-none focus:outline-none [-webkit-tap-highlight-color:transparent]">
                          <div className="relative shrink-0 w-9 h-9">
                            <div className="w-full h-full rounded-full bg-gradient-to-tr from-orange-500 to-red-500 p-[2px] shadow">
                              <div className="w-full h-full bg-white dark:bg-[#1c1c1e] rounded-full flex items-center justify-center text-xs font-black text-slate-900 dark:text-white uppercase transition-colors overflow-hidden">
                                {post.authorAvatar ? <img src={post.authorAvatar} className="w-full h-full object-cover" /> : post.authorName.charAt(0).toUpperCase()}
                              </div>
                            </div>
                            {/* 🚀 BADGE INTEGRATION IN FEED HEADER DP */}
                            {post.authorIsVerified && (
                                <div className="absolute bottom-0 right-0 z-20">
                                    <VerifiedBadge sizeClass="w-[14px] h-[14px]" noTooltip={true}/>
                                </div>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <div className="text-sm text-slate-900 dark:text-white font-bold transition-colors leading-tight group-hover:underline flex items-center gap-1.5">
                                {post.authorName}
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium">Zestly Chef</p>
                          </div>
                        </div>
                        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-white outline-none [-webkit-tap-highlight-color:transparent]">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm-7 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm14 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/></svg>
                        </button>
                      </div>

                      <div onClick={() => openCookMode(post)} className={`w-full aspect-square sm:aspect-auto sm:h-72 relative flex items-center justify-center cursor-pointer sm:overflow-hidden outline-none focus:outline-none [-webkit-tap-highlight-color:transparent] ${!post.imageUrl ? `bg-gradient-to-br ${post.gradient}` : 'bg-slate-100 dark:bg-black'}`}>
                        {post.imageUrl ? <img src={post.imageUrl} className="w-full h-full object-cover sm:group-hover/card:scale-105 transition-transform duration-700" /> : <span className="text-8xl drop-shadow-2xl sm:group-hover/card:scale-110 transition-transform duration-500">{post.emoji}</span>}
                        {/* 🚀 VIEWS BADGE OVERLAY */}
                        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                            {formatNum(post.viewsCount)}
                        </div>
                      </div>

                      <div className="pt-3 pb-5 px-4 sm:p-5 flex-1 flex flex-col justify-between bg-transparent transition-colors z-10">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-4">
                              <button onClick={() => toggleLike(post.id)} className="group transition-transform active:scale-125 cursor-pointer outline-none focus:outline-none [-webkit-tap-highlight-color:transparent]">
                                <svg className={`w-7 h-7 transition-all duration-300 outline-none focus:outline-none ${post.is_liked ? 'fill-red-500 text-red-500 scale-110' : 'text-slate-900 dark:text-white group-hover:text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                              </button>
                              
                              <button onClick={() => openComments(post)} className="group flex items-center gap-1.5 cursor-pointer transition-colors active:scale-95 outline-none focus:outline-none [-webkit-tap-highlight-color:transparent]">
                                <svg className="w-7 h-7 text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                                {post.commentsCount > 0 && <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300">{post.commentsCount}</span>}
                              </button>

                              <button onClick={() => handleShare(post.name)} className="cursor-pointer active:scale-110 transition-transform outline-none focus:outline-none [-webkit-tap-highlight-color:transparent]">
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
                              <strong className="mr-1.5 font-bold cursor-pointer hover:underline inline-flex items-center gap-1" onClick={() => openChefProfile(post.authorId || "mock", post.authorName)}>
                                  {post.authorName}
                              </strong> 
                              {post.name} - The ultimate {post.type} treat! 🥘✨
                          </div>
                          
                          {post.commentsCount > 0 && (
                            <p onClick={() => openComments(post)} className="text-[13px] text-slate-500 mt-1.5 cursor-pointer font-medium hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
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
            
            {/* 🚀 INFINITE SCROLL LOADER / TARGET */}
            {!searchQuery && activeCuisine === "All" && (
               <div ref={observerTarget} className="w-full flex flex-col items-center justify-center py-8">
                 {isFetchingMore && <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>}
                 {!hasMore && posts.length > 0 && <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-4">You're all caught up! 🏁</p>}
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
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 shrink-0">
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-orange-500 to-red-500 p-1">
                    <div className="w-full h-full bg-white dark:bg-[#1c1c1e] rounded-full flex items-center justify-center text-4xl sm:text-5xl font-black text-slate-900 dark:text-white uppercase overflow-hidden">
                      {viewingChef.avatar_url ? <img src={viewingChef.avatar_url} className="w-full h-full object-cover" /> : viewingChef.full_name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  {/* 🚀 BADGE INTEGRATION IN PROFILE MODAL ON DP */}
                  {viewingChef.is_verified && (
                      <div className="absolute bottom-0 right-0 sm:bottom-1 sm:right-1 z-20">
                          <VerifiedBadge sizeClass="w-[24px] h-[24px] sm:w-[32px] sm:h-[32px]" noTooltip={true} />
                      </div>
                  )}
                </div>
                
                <div className="flex-1 w-full">
                  <div className="flex justify-around sm:justify-start sm:gap-12 mb-5 text-center sm:text-left">
                    <div className="flex flex-col"><span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{formatNum(viewingChef.postsCount)}</span><span className="text-xs text-slate-500 font-bold">Posts</span></div>
                    <div className="flex flex-col"><span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{formatNum(viewingChef.followersCount)}</span><span className="text-xs text-slate-500 font-bold">Followers</span></div>
                    <div className="flex flex-col"><span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{formatNum(viewingChef.followingCount)}</span><span className="text-xs text-slate-500 font-bold">Following</span></div>
                  </div>

                  <div className="mb-5">
                    <div className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2 justify-center sm:justify-start">
                        {viewingChef.full_name}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium whitespace-pre-wrap leading-relaxed mt-1">{viewingChef.bio}</p>
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
                        <div className={`w-full h-full bg-gradient-to-br ${post.gradient} flex items-center justify-center`}><span className="text-3xl sm:text-5xl">{post.emoji}</span></div>
                      )}
                      <div className="absolute top-2 right-2 bg-black/50 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                        {formatNum(post.viewsCount)}
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 🚀🔥 NEW INSTAGRAM STYLE COMMENTS MODAL */}
      {mounted && activeCommentsPost && createPortal(
        <div className="fixed inset-0 z-[99999] flex flex-col justify-end bg-black/60 dark:bg-black/80 backdrop-blur-sm sm:items-center sm:justify-center p-0 sm:p-4 transition-all">
          <div className="bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-white/10 w-full sm:w-[500px] h-[85vh] sm:h-[650px] rounded-t-[2.5rem] sm:rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl">
            <div className="shrink-0 flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-white/10 z-10">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Comments</h3>
              <button onClick={() => setActiveCommentsPost(null)} className="cursor-pointer text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 w-9 h-9 rounded-full flex items-center justify-center transition-colors">✕</button>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto [&::-webkit-scrollbar]:hidden">
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
                         {cmt.replies && cmt.replies.length > 0 && (
                           <div className="w-[2px] bg-slate-200 dark:bg-white/10 absolute top-10 bottom-4 left-[17px] z-0"></div>
                         )}
                       </div>

                       <div className="w-full pb-2">
                         <div className="bg-slate-50 dark:bg-white/5 p-3.5 rounded-2xl rounded-tl-none w-fit min-w-[120px] max-w-full">
                           <p className="font-bold text-xs text-slate-900 dark:text-white mb-1">
                             {cmt.author} 
                             <span className="text-[10px] text-slate-400 font-normal ml-2">{timeAgo(cmt.created_at)}</span>
                           </p>
                           <p className="text-[13px] text-slate-700 dark:text-slate-300 break-words leading-relaxed">{cmt.text}</p>
                         </div>
                         
                         <button onClick={() => setReplyingTo({ commentId: cmt.id, author: cmt.author })} className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 mt-2 ml-2 transition-colors outline-none cursor-pointer">
                           Reply
                         </button>

                         {cmt.replies && cmt.replies.length > 0 && (
                           <div className="flex flex-col gap-4 mt-4">
                             {cmt.replies.map(reply => (
                               <div key={reply.id} className="flex gap-2.5 relative z-10">
                                 <div className="w-7 h-7 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-white text-[10px] font-bold shrink-0 overflow-hidden shadow-sm">
                                   {reply.avatar_url ? <img src={reply.avatar_url} className="w-full h-full object-cover" /> : reply.author.charAt(0).toUpperCase()}
                                 </div>
                                 <div className="w-full">
                                   <div className="bg-slate-50/80 dark:bg-white/[0.03] px-3.5 py-2.5 rounded-2xl rounded-tl-none w-fit min-w-[100px] max-w-full">
                                     <p className="font-bold text-[11px] text-slate-900 dark:text-white mb-0.5">
                                       {reply.author} 
                                       <span className="text-[9px] text-slate-400 font-normal ml-1.5">{timeAgo(reply.created_at)}</span>
                                     </p>
                                     <p className="text-[13px] text-slate-700 dark:text-slate-300 break-words leading-relaxed">
                                       {reply.text.startsWith('@') ? (
                                         <>
                                           <span className="text-blue-500 font-medium mr-1">{reply.text.split(' ')[0]}</span>
                                           <span>{reply.text.substring(reply.text.indexOf(' '))}</span>
                                         </>
                                       ) : (
                                         reply.text
                                       )}
                                     </p>
                                   </div>
                                   <button onClick={() => setReplyingTo({ commentId: cmt.id, author: reply.author, isSubReply: true })} className="text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 mt-1.5 ml-2 transition-colors outline-none cursor-pointer">
                                     Reply
                                   </button>
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
                <button onClick={() => setReplyingTo(null)} className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer">Cancel</button>
              </div>
            )}

            <div className="shrink-0 p-4 border-t border-slate-100 dark:border-white/10 flex gap-3 items-center">
               <input 
                 type="text" 
                 placeholder={replyingTo ? "Write a reply..." : "Add a comment..."} 
                 value={commentInput} 
                 onChange={(e) => setCommentInput(e.target.value)} 
                 onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                 className="flex-1 bg-slate-100 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-full px-5 py-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-orange-400" 
               />
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

      {/* 🚀 FULLY RESTORED COOK MODE UX */}
      {mounted && cookModePost && createPortal(
        <div className="fixed inset-0 z-[99999] bg-white dark:bg-[#07070a] flex flex-col animate-in slide-in-from-bottom-full duration-500">
          <div className="w-full max-w-4xl mx-auto flex flex-col h-full relative">
            
            <div className="shrink-0 pt-10 pb-4 px-6 sm:px-10 bg-white dark:bg-[#07070a] border-b border-slate-100 dark:border-white/5 relative z-20">
              <button onClick={() => setCookModePost(null)} className="absolute top-8 right-6 sm:right-10 cursor-pointer bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/20 transition-colors outline-none [-webkit-tap-highlight-color:transparent]">✕</button>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6 pr-14 leading-tight">{cookModePost.name}</h3>
              
              <div className="flex gap-1.5 mb-2">
                <div className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${currentStep === -1 ? 'bg-orange-500' : 'bg-slate-200 dark:bg-white/10'}`}></div>
                {cookModePost.steps.map((_, idx) => (
                  <div key={idx} className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${currentStep >= idx ? 'bg-orange-500' : 'bg-slate-200 dark:bg-white/10'}`}></div>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {currentStep === -1 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-10">
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-500/10 dark:to-red-500/5 border border-orange-200 dark:border-orange-500/20 p-6 rounded-[2rem] flex justify-between items-center">
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
                      {cookModePost.ingredients.map((ing, i) => (
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
        </div>,
        document.body
      )}

      {mounted && alertModal.isOpen && createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200" onClick={() => setAlertModal({ isOpen: false, message: "" })}>
          <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border border-slate-200 dark:border-white/10 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 mx-auto bg-orange-100 dark:bg-orange-500/20 text-orange-500 rounded-full flex items-center justify-center text-2xl mb-4">👨‍🍳</div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Login Required</h3>
            <p className="text-sm text-slate-500 mb-6">{alertModal.message}</p>
            <div className="flex gap-3">
              <button onClick={() => setAlertModal({ isOpen: false, message: "" })} className="flex-1 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white font-bold py-3.5 rounded-xl transition-all outline-none cursor-pointer">Cancel</button>
              <button onClick={() => router.push("/login")} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-all outline-none shadow-[0_4px_15px_rgba(249,115,22,0.3)] cursor-pointer active:scale-95">Log In</button>
            </div>
          </div>
        </div>, document.body
      )}

      {mounted && toast.isOpen && createPortal(
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100000] pointer-events-none">
          <div className="bg-slate-900 dark:bg-[#1c1c1e] text-white px-6 py-3.5 rounded-full shadow-lg text-sm font-bold border border-slate-700 dark:border-white/10">{toast.message}</div>
        </div>, document.body
      )}
    </div>
  );
}
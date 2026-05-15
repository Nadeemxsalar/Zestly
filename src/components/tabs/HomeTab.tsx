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
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      const formattedPosts: FeedPost[] = data.map((item, index) => {
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
          authorName: item.author_name || "Chef Nadeem", 
          likesCount: item.is_liked ? 246 : Math.floor(Math.random() * 100) + 10,
          commentsList: item.comments_data || [], 
          commentsCount: item.comments_data ? item.comments_data.length : (Math.floor(Math.random() * 20) + 5),
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
    setIsLoading(false);
  };

  const showAlert = (message: string) => setAlertModal({ isOpen: true, message });
  const showToast = (message: string) => {
    setToast({ isOpen: true, message });
    setTimeout(() => setToast({ isOpen: false, message: "" }), 3000);
  };

  const checkAuth = () => {
    if (!user) {
      showAlert("Chef, you need to log in to interact with recipes! 👨‍🍳");
      setTimeout(() => router.push("/login"), 1500); 
      return false;
    }
    return true;
  };

  const toggleLike = async (id: string) => {
    if (!checkAuth()) return;
    const post = posts.find(p => p.id === id);
    if (!post) return;
    setPosts(posts.map(p => p.id === id ? { 
      ...p, 
      is_liked: !p.is_liked,
      likesCount: p.is_liked ? p.likesCount - 1 : p.likesCount + 1 
    } : p));
    await supabase.from("recipes").update({ is_liked: !post.is_liked }).eq("id", id);
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

    const currentUserName = user?.user_metadata?.full_name?.split(" ")[0] || "Chef";
    const newComment = { author: currentUserName, text: text };
    const newCommentsList = [...activeCommentsPost.commentsList, newComment];

    const updatedPost = {
      ...activeCommentsPost,
      commentsCount: newCommentsList.length,
      commentsList: newCommentsList
    };

    const { error } = await supabase.from("recipes").update({ 
      comments_data: newCommentsList 
    }).eq("id", activeCommentsPost.id);

    if (!error) {
      setPosts(posts.map(p => p.id === activeCommentsPost.id ? updatedPost : p));
      setActiveCommentsPost(updatedPost);
      setCommentInput("");
      showToast("Comment posted! 💬");
    } else {
      showAlert("Failed to post comment. Try again!");
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
    if (activeCuisine !== "All") {
      result = result.filter(post => post.cuisine === activeCuisine);
    }
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(post => 
        post.name.toLowerCase().includes(lowerQuery) || 
        post.authorName.toLowerCase().includes(lowerQuery) ||
        post.type.toLowerCase().includes(lowerQuery)
      );
    }
    return result;
  }, [posts, searchQuery, activeCuisine]);

  const featuredPost = posts.length > 0 ? posts[0] : null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8 pb-24 relative max-w-full overflow-x-hidden cursor-default selection:bg-orange-500/10 w-full flex flex-col items-center">
      
      <div className="px-4 sm:px-1 pt-6 w-full max-w-5xl">
        <div className="relative bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-white/5 p-1 rounded-full flex items-center shadow-sm">
          <div className="pl-4 pr-2 text-slate-400 dark:text-slate-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recipes, chefs, or diets..." 
            className="flex-1 bg-transparent text-slate-900 dark:text-white font-medium px-2 py-3 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 cursor-text"
          />
          {searchQuery ? (
            <button onClick={() => setSearchQuery("")} className="p-3 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer active:scale-90 outline-none focus:outline-none [-webkit-tap-highlight-color:transparent]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          ) : (
            <button className="pr-4 pl-3 py-3 text-slate-400 hover:text-orange-500 transition-colors cursor-pointer active:scale-90 outline-none focus:outline-none [-webkit-tap-highlight-color:transparent]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
            </button>
          )}
        </div>
      </div>

      <div className="w-full max-w-5xl">
        <div className="flex items-center justify-between mb-2 px-5 sm:px-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Explore Cuisine</h3>
          <span className="text-sm font-bold text-orange-500 cursor-pointer pr-1">See all</span>
        </div>
        
        {/* 🚀 FIXED: No px padding on container, used first:ml-5 last:mr-5 logic */}
        <div className="flex gap-3 overflow-x-auto py-2 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {cuisinesList.map((cuisine, index) => (
            <button 
              key={index}
              onClick={() => setActiveCuisine(cuisine.name)}
              className={`shrink-0 snap-start flex items-center gap-2 px-5 py-3.5 rounded-full font-bold text-sm transition-all duration-300 cursor-pointer border outline-none focus:outline-none [-webkit-tap-highlight-color:transparent] 
                ${index === 0 ? "ml-5 sm:ml-1" : ""} 
                ${index === cuisinesList.length - 1 ? "mr-5 sm:mr-1" : ""} 
                ${activeCuisine === cuisine.name 
                  ? "bg-orange-500 text-white border-orange-500 shadow-[0_4px_15px_rgba(249,115,22,0.4)] scale-[1.02]" 
                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 dark:bg-[#1c1c1e] dark:text-slate-300 dark:border-transparent dark:hover:bg-white/10"
                }`}
            >
              <span className="text-lg drop-shadow-sm">{cuisine.icon}</span> 
              {cuisine.name}
            </button>
          ))}
        </div>
      </div>

      {!searchQuery && activeCuisine === "All" && featuredPost && (
        <div className="px-4 sm:px-1 w-full max-w-5xl">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mb-4 px-1">Featured Recipe</h3>
          
          <div onClick={() => openCookMode(featuredPost)} className="relative w-full h-[22rem] sm:h-80 rounded-[2rem] overflow-hidden group cursor-pointer shadow-lg outline-none [-webkit-tap-highlight-color:transparent] border border-slate-200 dark:border-white/5">
            {featuredPost.imageUrl ? (
              <img src={featuredPost.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            ) : (
              <div className={`w-full h-full bg-linear-to-br ${featuredPost.gradient} flex items-center justify-center`}>
                <span className="text-8xl">{featuredPost.emoji}</span>
              </div>
            )}
            
            <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent p-6 flex flex-col justify-end">
              <div className="bg-orange-500/20 backdrop-blur-md text-orange-400 border border-orange-500/30 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full w-fit mb-3 flex items-center gap-1.5">
                🔥 Trending
              </div>
              <h3 className="text-3xl font-black text-white leading-tight mb-2 drop-shadow-md">{featuredPost.name}</h3>
              <p className="text-slate-300 text-sm font-medium line-clamp-2 pr-10">Rich, creamy & full of classic flavor. A must try masterpiece.</p>
              
              <div className="flex gap-5 mt-4 text-xs font-bold text-slate-300">
                 <span className="flex items-center gap-1.5 text-yellow-400"><span className="text-base">⭐</span> 4.8</span>
                 <span className="flex items-center gap-1.5"><span className="text-base">⏱️</span> {featuredPost.time}</span>
                 <span className="flex items-center gap-1.5 text-orange-400"><span className="text-base">🔥</span> {featuredPost.calories} cal</span>
              </div>
              
              <button onClick={(e) => { e.stopPropagation(); toggleLike(featuredPost.id); }} className="absolute bottom-6 right-6 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-orange-500 transition-colors">
                <svg className={`w-5 h-5 ${featuredPost.is_liked ? 'fill-white text-white' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-5xl pt-2">
        <div className="flex items-center justify-between mb-2 px-5 sm:px-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Trending Chefs</h3>
          <span className="text-sm font-bold text-orange-500 cursor-pointer pr-1">See all</span>
        </div>
        
        {/* 🚀 FIXED: No px padding on container, used first:ml-5 last:mr-5 logic */}
        <div className="flex gap-4 overflow-x-auto py-4 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {['Nadeem', 'Rahul', 'Sneha', 'Aisha', 'Karan'].map((chef, i, arr) => (
            <div key={i} className={`flex flex-col items-center shrink-0 snap-start cursor-pointer group outline-none focus:outline-none [-webkit-tap-highlight-color:transparent] ${i === 0 ? "ml-5 sm:ml-1" : ""} ${i === arr.length - 1 ? "mr-5 sm:mr-1" : ""}`}>
              <div className="relative w-[76px] h-[76px] rounded-full p-[3px] bg-linear-to-tr from-orange-500 via-red-500 to-purple-500 group-hover:scale-105 group-active:scale-95 transition-all duration-300 shadow-md mb-2.5">
                <div className="w-full h-full bg-white dark:bg-[#1c1c1e] rounded-full flex items-center justify-center text-2xl font-extrabold text-slate-900 dark:text-white border-[3px] border-white dark:border-[#07070a] transition-colors">
                  {chef.charAt(0)}
                </div>
                <div className="absolute bottom-0 right-0 bg-orange-500 w-5 h-5 rounded-full border-2 border-white dark:border-[#07070a] flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                </div>
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white transition-colors">Chef {chef}</span>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{Math.floor(Math.random() * 10 + 5)}.{Math.floor(Math.random() * 9)}K followers</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 w-full max-w-5xl">
        <div className="flex justify-between items-end mb-5 px-5 sm:px-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            {activeCuisine === "All" ? "Global Feed" : `${activeCuisine} Cuisine`} 
          </h3>
          {(searchQuery || activeCuisine !== "All") && <span className="text-sm font-bold text-blue-600 dark:text-blue-400 transition-colors">{filteredPosts.length} Results</span>}
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 cursor-wait text-center">
             <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16 px-6 border-2 border-dashed border-slate-300 dark:border-white/10 rounded-[2.5rem] bg-white dark:bg-white/[0.01] mx-4">
            <div className="text-6xl mb-5 opacity-50">🧭</div>
            <h3 className="text-slate-900 dark:text-white font-black text-lg mb-1">No recipes found</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Be the first chef to add a recipe here!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 sm:gap-7">
            {filteredPosts.map((post, index) => (
              <div key={post.id} className="flex flex-col w-full">
                
                <div className="relative sm:bg-white sm:dark:bg-[#0b0b0e] sm:border sm:border-slate-200/80 sm:dark:border-white/10 sm:rounded-[2.5rem] sm:overflow-hidden sm:shadow-[0_8px_35px_#0000000d] sm:dark:shadow-2xl transition-all sm:hover:-translate-y-1.5 sm:hover:shadow-[0_20px_50px_#0000001a] sm:dark:hover:border-white/20 group/card flex flex-col">
                  
                  <div className="py-3.5 px-4 sm:p-5 flex justify-between items-center sm:bg-slate-50 sm:dark:bg-white/[0.02] sm:border-b border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-3 cursor-pointer group outline-none focus:outline-none [-webkit-tap-highlight-color:transparent]">
                      <div className="w-10 h-10 rounded-full bg-linear-to-tr from-orange-500 to-red-500 p-[2px] shadow">
                        <div className="w-full h-full bg-white dark:bg-[#1c1c1e] rounded-full flex items-center justify-center text-sm font-black text-slate-900 dark:text-white uppercase transition-colors">
                          {post.authorName.charAt(0)}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <p className="text-sm text-slate-900 dark:text-white font-bold transition-colors leading-tight">{post.authorName}</p>
                        <p className="text-[10px] text-slate-500 font-medium">New Delhi, India</p>
                      </div>
                    </div>
                    <button className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer p-2 rounded-full active:scale-90 outline-none focus:outline-none [-webkit-tap-highlight-color:transparent]">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/></svg>
                    </button>
                  </div>

                  <div className={`w-full h-[26rem] sm:h-72 relative flex items-center justify-center cursor-pointer sm:overflow-hidden outline-none focus:outline-none [-webkit-tap-highlight-color:transparent] ${!post.imageUrl ? `bg-linear-to-br ${post.gradient}` : 'bg-slate-100 dark:bg-black'}`}>
                    {post.imageUrl ? (
                      <img src={post.imageUrl} alt={post.name} className="w-full h-full object-cover sm:group-hover/card:scale-105 transition-transform duration-700" />
                    ) : (
                      <span className="text-8xl drop-shadow-2xl sm:group-hover/card:scale-110 transition-transform duration-500">{post.emoji}</span>
                    )}
                  </div>

                  <div className="py-4 px-4 sm:p-6 flex-1 flex flex-col justify-between bg-transparent transition-colors z-10">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-5">
                          <button onClick={() => toggleLike(post.id)} className="group transition-transform active:scale-125 cursor-pointer outline-none focus:outline-none [-webkit-tap-highlight-color:transparent]">
                            <svg className={`w-7 h-7 transition-all duration-300 outline-none focus:outline-none ${post.is_liked ? 'fill-red-500 text-red-500 scale-110' : 'text-slate-900 dark:text-white group-hover:text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                          </button>

                          <button onClick={() => openComments(post)} className="group cursor-pointer transition-colors active:scale-95 outline-none focus:outline-none [-webkit-tap-highlight-color:transparent]">
                            <svg className="w-7 h-7 text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                          </button>

                          <button onClick={() => handleShare(post.name)} className="cursor-pointer active:scale-110 transition-transform outline-none focus:outline-none [-webkit-tap-highlight-color:transparent]">
                            <svg className="w-7 h-7 text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
                          </button>
                        </div>
                        <button className="text-slate-900 dark:text-white outline-none [-webkit-tap-highlight-color:transparent]">
                           <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
                        </button>
                      </div>

                      <p className="font-bold text-sm text-slate-900 dark:text-white mb-2">{post.likesCount} likes</p>
                      
                      <p className="text-sm text-slate-900 dark:text-white leading-relaxed line-clamp-2">
                        <strong className="mr-1.5 font-bold">{post.authorName}</strong> 
                        This authentic <span className="text-orange-500 dark:text-orange-400 font-bold">{post.cuisine}</span> masterpiece is trending right now! 🥘✨
                      </p>
                      <button onClick={() => openComments(post)} className="text-slate-500 text-sm mt-1.5 font-medium outline-none [-webkit-tap-highlight-color:transparent]">
                        View all {post.commentsCount} comments
                      </button>
                    </div>

                    <button 
                      onClick={() => openCookMode(post)} 
                      className="mt-4 w-full bg-slate-100 dark:bg-white/10 hover:bg-orange-500 dark:hover:bg-orange-500 text-slate-900 dark:text-white hover:text-white font-bold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer group/btn active:scale-95 outline-none focus:outline-none [-webkit-tap-highlight-color:transparent]"
                    >
                      <span>Cook Now</span>
                      <svg className="w-4 h-4 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                    </button>
                  </div>
                </div>

                {index !== filteredPosts.length - 1 ? (
                  <div className="sm:hidden py-6 flex items-center justify-center w-full opacity-50">
                    <div className="h-[1px] w-full bg-slate-300 dark:bg-slate-700"></div>
                  </div>
                ) : (
                  <div className="sm:hidden h-4"></div>
                )}

              </div>
            ))}
          </div>
        )}
      </div>

      {mounted && activeCommentsPost && createPortal(
        <div className="fixed inset-0 z-[99999] flex flex-col justify-end bg-black/60 dark:bg-black/80 backdrop-blur-sm sm:items-center sm:justify-center p-0 sm:p-4 transition-all">
          <div className="bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-white/10 w-full sm:w-[500px] h-[85vh] sm:h-[650px] rounded-t-[2.5rem] sm:rounded-[2.5rem] flex flex-col overflow-hidden animate-in slide-in-from-bottom-full duration-300 shadow-2xl">
            
            <div className="shrink-0 flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-white/10 z-10">
              <div className="w-9 h-9"></div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Comments</h3>
              <button onClick={() => setActiveCommentsPost(null)} className="cursor-pointer text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 w-9 h-9 rounded-full flex items-center justify-center transition-colors outline-none [-webkit-tap-highlight-color:transparent]">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {activeCommentsPost.commentsList.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                  <span className="text-5xl mb-3">💬</span>
                  <p className="text-slate-500 font-bold">No comments yet.</p>
                  <p className="text-xs">Be the first to comment!</p>
                </div>
              ) : (
                activeCommentsPost.commentsList.map((cmt, idx) => (
                  <div key={idx} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2">
                    <div className="w-8 h-8 rounded-full bg-linear-to-tr from-blue-400 to-purple-500 shrink-0 flex items-center justify-center text-white text-xs font-bold uppercase">
                      {cmt.author.charAt(0)}
                    </div>
                    <div>
                      <strong className="text-slate-900 dark:text-white text-sm mr-2 font-bold">{cmt.author}</strong>
                      <span className="text-slate-700 dark:text-slate-300 text-sm">{cmt.text}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="shrink-0 p-4 border-t border-slate-100 dark:border-white/10 flex gap-3 pb-safe">
               <input 
                  type="text" 
                  placeholder="Add a comment..." 
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                  disabled={isSubmittingComment}
                  className="flex-1 bg-slate-100 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-full px-5 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-400 dark:focus:border-blue-500 cursor-text transition-colors disabled:opacity-50"
                />
                
                <button 
                  onClick={submitComment}
                  disabled={!commentInput.trim() || isSubmittingComment}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-5 rounded-full flex items-center justify-center font-bold transition-all disabled:opacity-50 active:scale-95 outline-none [-webkit-tap-highlight-color:transparent]"
                >
                  {isSubmittingComment ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Post"}
                </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {mounted && cookModePost && createPortal(
        <div className="fixed inset-0 z-[99999] flex flex-col bg-slate-50 dark:bg-[#0b0b0e] sm:p-4 transition-all">
          <div className="w-full h-full max-w-2xl mx-auto sm:border border-slate-200 dark:border-white/10 sm:rounded-[2.5rem] flex flex-col bg-white dark:bg-[#07070a] shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom-full duration-500">
            
            <div className="shrink-0 pt-12 pb-4 px-6 bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/5 relative z-20">
              <button onClick={() => setCookModePost(null)} className="absolute top-6 right-6 cursor-pointer bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-white w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-300 dark:hover:bg-white/20 transition-colors outline-none [-webkit-tap-highlight-color:transparent]">✕</button>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 pr-10 leading-tight">{cookModePost.name}</h3>
              
              <div className="flex gap-1 mb-2">
                <div className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${currentStep === -1 ? 'bg-orange-500' : 'bg-slate-200 dark:bg-white/10'}`}></div>
                {cookModePost.steps.map((_, idx) => (
                  <div key={idx} className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${currentStep >= idx ? 'bg-orange-500' : 'bg-slate-200 dark:bg-white/10'}`}></div>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {currentStep === -1 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
                  <div className="bg-linear-to-r from-orange-50 to-red-50 dark:from-orange-500/10 dark:to-red-500/5 border border-orange-200 dark:border-orange-500/20 p-5 rounded-[2rem] flex justify-between items-center">
                    <div>
                      <span className="text-orange-600 dark:text-orange-400 font-bold text-sm block">Serving Size</span>
                    </div>
                    <div className="flex items-center gap-4 bg-white dark:bg-black/40 p-1.5 rounded-xl border border-orange-100 dark:border-white/5 shadow-sm dark:shadow-none">
                      <button onClick={() => setPortions(Math.max(1, portions - 1))} className="cursor-pointer w-10 h-10 rounded-lg bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-900 dark:text-white font-black text-lg active:scale-95 transition-transform outline-none [-webkit-tap-highlight-color:transparent]">-</button>
                      <span className="font-black text-slate-900 dark:text-white w-6 text-center text-lg">{portions}</span>
                      <button onClick={() => setPortions(portions + 1)} className="cursor-pointer w-10 h-10 rounded-lg bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-900 dark:text-white font-black text-lg active:scale-95 transition-transform outline-none [-webkit-tap-highlight-color:transparent]">+</button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-slate-900 dark:text-white font-black text-lg mb-4">Ingredients</h4>
                    <ul className="grid grid-cols-1 gap-3">
                      {cookModePost.ingredients.map((ing, i) => (
                        <li key={i} className="flex items-center gap-4 bg-slate-50 dark:bg-white/[0.02] p-4 rounded-2xl border border-slate-200 dark:border-white/5">
                          <span className="text-slate-700 dark:text-white font-medium">{ing} <span className="text-orange-500 dark:text-orange-400 font-bold ml-1">(x{portions})</span></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {currentStep >= 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-8 animate-in zoom-in-95 duration-500">
                  <div className="w-24 h-24 rounded-full bg-linear-to-br from-orange-400 to-red-500 flex items-center justify-center text-4xl font-black text-white shadow-[0_8px_30px_#f9731666]">{currentStep + 1}</div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white px-4 leading-relaxed">{cookModePost.steps[currentStep]}</h2>
                </div>
              )}
            </div>

            <div className="shrink-0 p-6 bg-linear-to-t from-white dark:from-[#07070a] to-transparent relative z-20">
              {currentStep === -1 ? (
                <button onClick={() => setCurrentStep(0)} className="cursor-pointer w-full bg-slate-900 dark:bg-white text-white dark:text-black font-black text-lg py-5 rounded-[1.5rem] hover:scale-[1.02] active:scale-[0.98] transition-all outline-none [-webkit-tap-highlight-color:transparent] shadow-lg">Let's Start Cooking</button>
              ) : (
                <div className="flex gap-4">
                  <button onClick={() => setCurrentStep(currentStep - 1)} className="cursor-pointer w-1/3 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white font-bold py-5 rounded-[1.5rem] transition-colors active:scale-95 outline-none [-webkit-tap-highlight-color:transparent]">Back</button>
                  <button onClick={() => { if (currentStep < cookModePost.steps.length - 1) setCurrentStep(currentStep + 1); else setCookModePost(null); }} className={`cursor-pointer w-2/3 text-white font-black py-5 rounded-[1.5rem] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg outline-none [-webkit-tap-highlight-color:transparent] ${currentStep === cookModePost.steps.length - 1 ? 'bg-green-500 hover:bg-green-600 shadow-[0_8px_20px_#22c55e66]' : 'bg-orange-500 hover:bg-orange-600 shadow-[0_8px_20px_#f9731666]'}`}>
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
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-[2rem] p-6 text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              🔒
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Login Required</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-6">{alertModal.message}</p>
            <button onClick={() => setAlertModal({ isOpen: false, message: "" })} className="w-full bg-orange-500 text-white font-bold py-3.5 rounded-xl active:scale-95 transition-transform cursor-pointer outline-none [-webkit-tap-highlight-color:transparent]">Got it</button>
          </div>
        </div>,
        document.body
      )}

      {mounted && toast.isOpen && createPortal(
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[99999] animate-in slide-in-from-top-5 fade-out duration-300 pointer-events-none">
          <div className="bg-slate-900 dark:bg-[#1c1c1e] text-white dark:text-white px-6 py-3.5 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.2)] text-sm font-bold flex items-center gap-2 border border-slate-700 dark:border-white/10">
            <span>{toast.message}</span>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
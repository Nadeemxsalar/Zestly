"use client";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface HomeTabProps {
  user: any;
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
}

export default function HomeTab({ user }: HomeTabProps) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCommentBox, setActiveCommentBox] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCuisine, setActiveCuisine] = useState<string>("All"); 
  const router = useRouter();

  const cuisinesList = [
    { name: "All", icon: "🌍" },
    { name: "Indian", icon: "🇮🇳" },
    { name: "Italian", icon: "🇮🇹" },
    { name: "Mexican", icon: "🇲🇽" },
    { name: "Chinese", icon: "🇨🇳" },
    { name: "American", icon: "🇺🇸" }
  ];

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      const formattedPosts: FeedPost[] = data.map((item, index) => {
        const mockCuisines = ["Indian", "Italian", "Mexican", "American", "Chinese"];
        const assignedCuisine = mockCuisines[index % mockCuisines.length];

        return {
          id: item.id,
          name: item.name,
          type: item.type || "Veg",
          emoji: item.emoji || "🍲",
          gradient: item.gradient || "from-orange-500 to-red-600",
          is_liked: item.is_liked || false,
          imageUrl: item.image_url,
          authorName: index % 2 === 0 ? "Chef Nadeem" : "Chef Rahul",
          likesCount: item.is_liked ? 246 : Math.floor(Math.random() * 100) + 10,
          commentsCount: Math.floor(Math.random() * 20) + 5,
          cuisine: assignedCuisine
        };
      });
      setPosts(formattedPosts);
    }
    setIsLoading(false);
  };

  const checkAuth = () => {
    if (!user) {
      alert("Chef, you need to log in to interact with recipes! 🔒👨‍🍳");
      router.push("/login");
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
    if (!checkAuth()) return;
    navigator.clipboard.writeText(`Zestly Recipe: ${postName}`);
    alert(`Link for ${postName} copied to clipboard! 🚀`);
  };

  const handleCommentClick = (postId: string) => {
    if (!checkAuth()) return;
    setActiveCommentBox(activeCommentBox === postId ? null : postId);
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

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-7 pb-24 relative max-w-full overflow-x-hidden cursor-default selection:bg-orange-500/10">
      
      {/* 🚀 New Advanced Subtle Background Glow */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[160%] h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/70 via-slate-50 to-transparent dark:from-blue-600/10 dark:via-[#07070a]/0 dark:to-transparent pointer-events-none -z-10 transition-colors duration-500"></div>

      {/* --- HEADER --- */}
      <div className="flex justify-between items-end px-1 pt-2">
        <div>
          <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tighter mb-1.5 transition-colors">
            Discover ✨
          </h2>
          <p className="text-blue-600 dark:text-blue-400 font-bold text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Explore global culinary masterpieces.
          </p>
        </div>
      </div>

      {/* SEARCH BAR (Attractive Shadow) */}
      <div className="relative group px-1">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-[2.2rem] blur-lg opacity-0 dark:opacity-10 group-focus-within:opacity-20 dark:group-focus-within:opacity-40 transition duration-500"></div>
        <div className="relative bg-white dark:bg-[#0c0c10] border border-slate-200 dark:border-white/10 p-2.5 rounded-[2.2rem] flex items-center shadow-[0_8px_30px_rgb(0,0,0,0.05)] dark:shadow-2xl transition-all focus-within:border-blue-500/40">
          <div className="p-3 text-slate-400 group-focus-within:text-blue-500 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recipes, chefs, or diets..." 
            className="flex-1 bg-transparent text-slate-900 dark:text-white font-semibold px-2 py-2.5 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 cursor-text"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="p-3 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer active:scale-90 outline-none [-webkit-tap-highlight-color:transparent]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* TASTE THE WORLD (Premium Apple Style Pills) */}
      <div className="px-1 pt-1">
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Taste the World</h3>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2.5 -mx-1 px-1 snap-x">
          {cuisinesList.map((cuisine, index) => (
            <button 
              key={index}
              onClick={() => setActiveCuisine(cuisine.name)}
              className={`shrink-0 snap-start flex items-center gap-2.5 px-5 py-3 rounded-full font-extrabold text-sm transition-all duration-300 cursor-pointer border outline-none [-webkit-tap-highlight-color:transparent] ${
                activeCuisine === cuisine.name 
                ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-black dark:border-white shadow-[0_4px_15px_#00000026] dark:shadow-md scale-105" 
                : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 dark:bg-[#0c0c10] dark:text-slate-300 dark:border-white/10 dark:hover:bg-white/5 dark:hover:border-white/20"
              }`}
            >
              <span className="text-xl drop-shadow">{cuisine.icon}</span> 
              {cuisine.name}
            </button>
          ))}
        </div>
      </div>

      {/* TRENDING CHEFS ( fixed clipping) */}
      {!searchQuery && activeCuisine === "All" && (
        <div className="px-1 pt-1">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Trending Chefs</h3>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide py-3.5 px-1 snap-x -mx-1">
            {['Nadeem', 'Rahul', 'Prachi', 'Aisha', 'Karan'].map((chef, i) => (
              <div key={i} className="flex flex-col items-center gap-2.5 shrink-0 snap-start cursor-pointer group">
                <div className="w-17 h-17 rounded-full p-[2.5px] bg-gradient-to-tr from-orange-500 via-red-500 to-purple-500 group-hover:scale-110 group-active:scale-95 transition-all duration-300 shadow-lg">
                  <div className="w-full h-full bg-white dark:bg-[#0b0b0e] rounded-full flex items-center justify-center text-2xl font-extrabold text-slate-900 dark:text-white border-[4px] border-white dark:border-[#0b0b0e] transition-colors">
                    {chef.charAt(0)}
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{chef}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- GLOBAL FEED --- */}
      <div className="mt-9">
        <div className="flex justify-between items-end mb-5 px-1">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 transition-colors tracking-tight">
            🌍 {activeCuisine === "All" ? "Global Feed" : `${activeCuisine} Cuisine`} 
            {!searchQuery && <span className="text-[10px] bg-red-500 text-white font-extrabold px-2.5 py-1 rounded-full animate-bounce cursor-default shadow-[0_0_10px_#ef444466]">LIVE</span>}
          </h3>
          {(searchQuery || activeCuisine !== "All") && <span className="text-sm font-bold text-blue-600 dark:text-blue-400 transition-colors">{filteredPosts.length} Results</span>}
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 cursor-wait text-center">
             <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-slate-500 font-bold">Fetching Global Recipes...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16 px-6 border-2 border-dashed border-slate-300 dark:border-white/10 rounded-[2.5rem] bg-white dark:bg-white/[0.01]">
            <div className="text-6xl mb-5 opacity-50">🧭</div>
            <h3 className="text-slate-900 dark:text-white font-black text-lg mb-1">No recipes found</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Be the first chef to add a recipe here!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 sm:gap-7">
            {filteredPosts.map((post) => (
              /* 🚀 RESPOSIVE FIX: Instagram style mobile, Cards on laptop */
              <div key={post.id} className="mb-8 sm:mb-0 sm:bg-white sm:dark:bg-[#0b0b0e] sm:border sm:border-slate-200/80 sm:dark:border-white/10 sm:rounded-[2.5rem] sm:overflow-hidden sm:shadow-[0_8px_35px_#0000000d] sm:dark:shadow-2xl transition-all sm:hover:-translate-y-1.5 sm:hover:shadow-[0_20px_50px_#0000001a] sm:dark:hover:border-white/20 group/card flex flex-col">
                
                {/* Header: Author Info */}
                <div className="py-3.5 sm:p-5 flex justify-between items-center sm:bg-slate-50 sm:dark:bg-white/[0.02] sm:border-b border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-3.5 cursor-pointer group">
                    <div className="w-11 h-11 rounded-full bg-linear-to-tr from-orange-500 to-red-500 p-[2px] shadow">
                      <div className="w-full h-full bg-white dark:bg-[#0b0b0e] rounded-full flex items-center justify-center text-sm font-black text-slate-900 dark:text-white uppercase transition-colors">
                        {post.authorName.charAt(0)}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-slate-900 dark:text-white font-extrabold group-hover:text-blue-600 transition-colors leading-tight">{post.authorName}</p>
                      <div className="flex gap-2.5 items-center">
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">{post.type}</p>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                        <p className="text-[11px] text-orange-500 dark:text-orange-400 font-bold uppercase tracking-wider">{post.cuisine}</p>
                      </div>
                    </div>
                  </div>
                  <button className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer p-2.5 rounded-full hover:bg-slate-200 dark:hover:bg-white/5 active:scale-90 outline-none [-webkit-tap-highlight-color:transparent]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/></svg>
                  </button>
                </div>

                {/* Media Area (Modern overlay) */}
                <div className={`-mx-5 w-[calc(100%+40px)] sm:mx-0 sm:w-full h-[23rem] sm:h-72 relative flex items-center justify-center cursor-pointer sm:overflow-hidden ${!post.imageUrl ? `bg-linear-to-br ${post.gradient}` : 'bg-slate-100 dark:bg-black'}`}>
                  {post.imageUrl ? (
                    <img src={post.imageUrl} alt={post.name} className="w-full h-full object-cover sm:group-hover/card:scale-105 transition-transform duration-700" />
                  ) : (
                    <span className="text-8xl drop-shadow-2xl sm:group-hover/card:scale-110 transition-transform duration-500">{post.emoji}</span>
                  )}
                  {/* Title Overlay (Dark soft gradient) */}
                  <div className="absolute bottom-0 left-0 w-full bg-linear-to-t from-black/70 via-black/20 to-transparent p-5 pt-20">
                    <h4 className="text-2xl font-extrabold text-white tracking-tight leading-tight drop-shadow">{post.name}</h4>
                  </div>
                </div>

                {/* Action Buttons & Details */}
                <div className="py-5 px-0 sm:p-6 flex-1 flex flex-col justify-between bg-transparent transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-7">
                        
                        {/* 🚀 FIXED PERFECT HEART: Removed Tap highlight, no boxes around heart */}
                        <button onClick={() => toggleLike(post.id)} className="group flex items-center gap-1.5 transition-transform active:scale-125 cursor-pointer outline-none [-webkit-tap-highlight-color:transparent]">
                          <svg 
                            className={`w-8 h-8 transition-all duration-300 ${
                              post.is_liked 
                                ? 'fill-red-500 red-500 scale-110 drop-shadow-[0_0_8px_#ef44444d]' 
                                : 'text-slate-500 dark:text-white group-hover:text-red-500'
                            }`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                          </svg>
                          <span className={`text-sm font-extrabold ${post.is_liked ? 'text-red-500' : 'text-slate-800 dark:text-slate-100'}`}>
                            {post.likesCount}
                          </span>
                        </button>

                        <button onClick={() => handleCommentClick(post.id)} className="group flex items-center gap-1.5 text-slate-500 dark:text-white hover:text-blue-500 cursor-pointer transition-colors active:scale-95 outline-none [-webkit-tap-highlight-color:transparent]">
                          <svg className="w-8 h-8 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                          </svg>
                          <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-blue-500 transition-colors">
                            {post.commentsCount}
                          </span>
                        </button>

                        <button onClick={() => handleShare(post.name)} className="text-slate-500 dark:text-white hover:text-green-500 cursor-pointer active:scale-110 transition-transform outline-none [-webkit-tap-highlight-color:transparent]">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                      <strong className="text-slate-900 dark:text-white mr-2.5 cursor-pointer hover:underline font-extrabold">{post.authorName}</strong> 
                      This authentic <span className="text-orange-500 dark:text-orange-400 font-bold">{post.cuisine}</span> {post.type.toLowerCase()} masterpiece is trending right now! 🥘✨
                    </p>

                    {/* Comment Input Box */}
                    {activeCommentBox === post.id && (
                      <div className="mt-5 pt-5 border-t border-slate-200 dark:border-white/10 animate-in slide-in-from-top-2">
                        <div className="flex gap-3.5 items-center">
                          <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0 border border-slate-300 dark:border-white/10 shadow-inner"></div>
                          <input 
                            type="text" 
                            placeholder="Write a comment..." 
                            className="flex-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full px-5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-400 dark:focus:border-blue-500 cursor-text transition-colors shadow-inner font-medium"
                          />
                          <button className="text-blue-600 dark:text-blue-500 font-black text-sm px-2 cursor-pointer hover:text-blue-700 dark:hover:text-blue-400 active:scale-95 transition-transform outline-none [-webkit-tap-highlight-color:transparent]">Post</button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Premium Cook Now Button */}
                  <button 
                    onClick={() => {
                      if (!checkAuth()) return;
                      alert("Opening Cook Mode..."); 
                    }} 
                    className="mt-7 w-full bg-slate-950 dark:bg-white/5 hover:bg-orange-500 text-white font-extrabold py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer group/btn shadow-[0_4px_15px_#00000033] dark:shadow-none active:scale-95 outline-none [-webkit-tap-highlight-color:transparent]"
                  >
                    <span>Cook Now</span>
                    <svg className="w-4.5 h-4.5 opacity-70 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
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
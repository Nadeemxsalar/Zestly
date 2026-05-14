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
  cuisine: string; // 🚀 NAYA: Country/Cuisine tag
}

export default function HomeTab({ user }: HomeTabProps) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCommentBox, setActiveCommentBox] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  // 🚀 NAYA: Cuisine Filter State
  const [activeCuisine, setActiveCuisine] = useState<string>("All"); 
  
  const router = useRouter();

  // World Cuisines List
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
        // Mocking cuisines for UI (Aap ise baad mein DB se link kar sakte hain)
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

  // 🚀 ADVANCED FILTERING (Search + Country combined)
  const filteredPosts = useMemo(() => {
    let result = posts;

    // 1. Filter by Cuisine (Country)
    if (activeCuisine !== "All") {
      result = result.filter(post => post.cuisine === activeCuisine);
    }

    // 2. Filter by Search Query
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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6 pb-24 relative max-w-full overflow-x-hidden cursor-default">
      
      {/* Background Mesh Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-600/15 via-[#07070a]/0 to-transparent pointer-events-none -z-10"></div>

      {/* --- HEADER --- */}
      <div className="flex justify-between items-end px-1 pt-2">
        <div>
          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight mb-2">
            Discover ✨
          </h2>
          <p className="text-blue-400 font-bold text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Explore global culinary masterpieces.
          </p>
        </div>
      </div>

      {/* 🚀 ADVANCED SEARCH BAR */}
      <div className="relative group px-1">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-[2rem] blur-md opacity-20 group-focus-within:opacity-50 transition duration-500"></div>
        <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 p-2 rounded-[2rem] flex items-center shadow-2xl transition-all focus-within:border-blue-500/50">
          <div className="p-3 text-slate-400 group-focus-within:text-blue-400 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recipes, chefs, or diets..." 
            className="flex-1 bg-transparent text-white font-medium px-2 py-2 outline-none placeholder:text-slate-500 cursor-text"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="p-3 text-slate-400 hover:text-white transition-colors cursor-pointer active:scale-90">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* 🚀 NAYA: TASTE THE WORLD (Country Filter) */}
      <div className="px-1">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Taste the World</h3>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x">
          {cuisinesList.map((cuisine, index) => (
            <button 
              key={index}
              onClick={() => setActiveCuisine(cuisine.name)}
              className={`shrink-0 snap-start flex items-center gap-2 px-4 py-2.5 rounded-[1.2rem] font-bold text-sm transition-all cursor-pointer border ${
                activeCuisine === cuisine.name 
                ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-105" 
                : "bg-[#0c0c10] text-slate-400 border-white/10 hover:border-white/30 hover:text-white"
              }`}
            >
              <span className="text-lg drop-shadow-md">{cuisine.icon}</span> 
              {cuisine.name}
            </button>
          ))}
        </div>
      </div>

      {/* 🚀 TOP CHEFS SECTION (Hidden when searching) */}
      {!searchQuery && activeCuisine === "All" && (
        <div className="px-1 pt-2">
          <h3 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">Trending Chefs</h3>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x">
            {['Nadeem', 'Rahul', 'Prachi', 'Aisha', 'Karan'].map((chef, i) => (
              <div key={i} className="flex flex-col items-center gap-2 shrink-0 snap-start cursor-pointer group">
                <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-orange-500 via-red-500 to-purple-500 group-hover:scale-110 transition-transform shadow-lg">
                  <div className="w-full h-full bg-[#0b0b0e] rounded-full flex items-center justify-center text-xl font-black text-white border-[3px] border-[#0b0b0e]">
                    {chef.charAt(0)}
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-300 group-hover:text-white">{chef}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- LIVE GLOBAL FEED --- */}
      <div className="mt-8">
        <div className="flex justify-between items-end mb-6 px-1">
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            🌍 {activeCuisine === "All" ? "Global Feed" : `${activeCuisine} Cuisine`} 
            {!searchQuery && <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full animate-bounce cursor-default shadow-[0_0_10px_rgba(239,68,68,0.5)]">LIVE</span>}
          </h3>
          {(searchQuery || activeCuisine !== "All") && <span className="text-sm font-bold text-blue-400">{filteredPosts.length} Results</span>}
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 cursor-wait">
             <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-slate-500 font-bold">Fetching Global Recipes...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16 px-6 border border-dashed border-white/10 rounded-[2.5rem] bg-white/[0.01]">
            <div className="text-5xl mb-4 opacity-50">🧭</div>
            <h3 className="text-white font-black text-lg mb-1">No recipes found</h3>
            <p className="text-slate-400 font-medium text-sm">Be the first chef to add a recipe here!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {filteredPosts.map((post) => (
              <div key={post.id} className="bg-[#0b0b0e] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl transition-all hover:border-white/20 group/card flex flex-col">
                
                {/* 1. Header: Author Info */}
                <div className="p-4 flex justify-between items-center bg-white/[0.02]">
                  <div className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-red-500 p-[2px] group-hover:scale-105 transition-transform shadow-md">
                      <div className="w-full h-full bg-[#0b0b0e] rounded-full flex items-center justify-center text-sm font-bold text-white uppercase">
                        {post.authorName.charAt(0)}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-white font-black group-hover:text-blue-400 transition-colors">{post.authorName}</p>
                      <div className="flex gap-2 items-center">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{post.type}</p>
                        <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                        {/* Country Tag */}
                        <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest">{post.cuisine}</p>
                      </div>
                    </div>
                  </div>
                  <button className="text-slate-500 hover:text-white transition-colors cursor-pointer p-2 rounded-full hover:bg-white/5 active:scale-95">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/></svg>
                  </button>
                </div>

                {/* 2. Media Area */}
                <div className={`w-full h-64 sm:h-72 relative flex items-center justify-center cursor-pointer overflow-hidden ${!post.imageUrl ? `bg-gradient-to-br ${post.gradient}` : 'bg-black'}`}>
                  {post.imageUrl ? (
                    <img src={post.imageUrl} alt={post.name} className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-700" />
                  ) : (
                    <span className="text-8xl drop-shadow-2xl group-hover/card:scale-110 transition-transform duration-500">{post.emoji}</span>
                  )}
                  {/* Title Overlay */}
                  <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 via-black/50 to-transparent p-5 pt-16">
                    <h4 className="text-2xl font-black text-white tracking-tight leading-tight drop-shadow-lg">{post.name}</h4>
                  </div>
                </div>

                {/* 3. Action Buttons & Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-5">
                        <button onClick={() => toggleLike(post.id)} className="flex items-center gap-1.5 transition-transform active:scale-125 cursor-pointer">
                          <svg className={`w-7 h-7 ${post.is_liked ? 'fill-red-500 text-red-500 scale-110 shadow-[0_0_15px_rgba(239,68,68,0.5)] rounded-full' : 'text-white hover:text-red-400 transition-colors'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                          </svg>
                          <span className={`text-sm font-black ${post.is_liked ? 'text-red-500' : 'text-white'}`}>{post.likesCount}</span>
                        </button>

                        <button onClick={() => handleCommentClick(post.id)} className="flex items-center gap-1.5 text-white hover:text-blue-400 cursor-pointer transition-colors active:scale-95">
                          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                          </svg>
                          <span className="text-sm font-black">{post.commentsCount}</span>
                        </button>

                        <button onClick={() => handleShare(post.name)} className="text-white hover:text-green-400 cursor-pointer active:scale-110 transition-transform">
                          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-slate-400 font-medium leading-relaxed">
                      <strong className="text-white mr-2 cursor-pointer hover:underline">{post.authorName}</strong> 
                      This authentic <span className="text-orange-400 font-bold">{post.cuisine}</span> {post.type.toLowerCase()} masterpiece is trending right now! 🥘✨
                    </p>

                    {/* Comment Input Box */}
                    {activeCommentBox === post.id && (
                      <div className="mt-4 pt-4 border-t border-white/10 animate-in slide-in-from-top-2">
                        <div className="flex gap-3 items-center">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 shrink-0 border border-white/10 shadow-inner"></div>
                          <input 
                            type="text" 
                            placeholder="Write a comment..." 
                            className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 cursor-text transition-colors"
                          />
                          <button className="text-blue-500 font-black text-sm px-2 cursor-pointer hover:text-blue-400 active:scale-95 transition-transform">Post</button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 🚀 NAYA: Cook Now Button inside Social Feed */}
                  <button 
                    onClick={() => {
                      if (!checkAuth()) return;
                      alert("Opening Cook Mode... (Redirecting to Recipes Tab)"); 
                      // In a real app, this would route to the recipe details or trigger cook mode.
                    }} 
                    className="mt-6 w-full bg-white/5 hover:bg-orange-500 text-white font-bold py-3.5 rounded-xl border border-white/10 hover:border-orange-500 transition-all flex items-center justify-center gap-2 cursor-pointer group/btn"
                  >
                    <span>Cook Now</span>
                    <svg className="w-4 h-4 opacity-50 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
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
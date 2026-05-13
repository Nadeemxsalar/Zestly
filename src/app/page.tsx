"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false); // Popup control karne ke liye
  const router = useRouter();

  // Check karna ki user logged in hai ya nahi
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Ab hum user ko redirect nahi karenge, bas state set karenge
      if (session) {
        setUser(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    };
    checkUser();

    // Supabase auth state listener (Agar doosre tab mein login/logout ho toh update karne ke liye)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Log Out function
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null); // Logout hote hi user state clear ho jayegi aur Navbar change ho jayega
  };

  // Jab koi "Add Recipe" par click kare
  const handleAddRecipeClick = () => {
    if (!user) {
      // Agar login nahi hai, toh popup dikhao
      setShowAuthModal(true);
    } else {
      // Agar login hai, toh recipe add karne ka logic chalega (baad mein banayenge)
      alert("Recipe Add Modal will open here!");
    }
  };

  // Jab tak load ho raha hai
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07070a]">
         <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full shadow-[0_0_15px_rgba(249,115,22,0.5)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070a] text-white font-sans selection:bg-orange-500/30">
      
      {/* Modern Glassmorphism Navbar */}
      <nav className="border-b border-white/[0.08] bg-white/[0.02] backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer">
              <span className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500 tracking-tighter">
                Zestly.
              </span>
            </div>
            
            {/* Dynamic Auth Section (Logged In vs Guest) */}
            <div className="flex items-center gap-4 sm:gap-6">
              {user ? (
                <>
                  <div className="hidden sm:block text-slate-400 text-sm font-medium">
                    Hello, <span className="text-orange-400 font-bold">{user?.user_metadata?.full_name || "Chef"}</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-red-400 text-sm font-semibold py-2 px-5 sm:py-2.5 sm:px-6 rounded-xl transition-all duration-300 hover:border-red-500/30 hover:shadow-[0_0_15px_rgba(239,68,68,0.15)] active:scale-95"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-slate-300 hover:text-white text-sm font-semibold transition-colors">
                    Log In
                  </Link>
                  <Link href="/signup" className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white text-sm font-bold py-2.5 px-6 rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] active:scale-95">
                    Sign Up Free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Feed Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2 tracking-tight">Discover Recipes</h1>
            <p className="text-slate-400">Find and share the best recipes from around the world.</p>
          </div>
          
          <button 
            onClick={handleAddRecipeClick}
            className="group bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-bold py-3.5 px-6 rounded-2xl shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add New Recipe</span>
          </button>
        </div>

        {/* Empty Feed State */}
        <div className="mt-8 bg-white/[0.02] border border-white/[0.08] rounded-[2.5rem] p-12 text-center border-dashed hover:bg-white/[0.03] transition-colors duration-500">
          <div className="w-24 h-24 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(249,115,22,0.15)]">
            <svg className="w-12 h-12 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Feed is waiting for chefs!</h3>
          <p className="text-slate-400 max-w-md mx-auto mb-8">Anyone can explore, but only members can share their secret recipes. Be the first to add one!</p>
        </div>

      </main>

      {/* Modern Authentication Popup (Jab guest click karega) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Blurred Overlay */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setShowAuthModal(false)}
          ></div>
          
          {/* Modal Card */}
          <div className="relative bg-[#0f0f13] border border-white/10 rounded-[2rem] p-8 max-w-md w-full shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 slide-in-from-bottom-10 duration-500">
            
            {/* Close Button */}
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-5 right-5 text-slate-500 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-8 mt-2">
              <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-500/20">
                <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Members Only Action</h3>
              <p className="text-slate-400 text-sm">You need to be logged in to share recipes with the Zestly community.</p>
            </div>

            <div className="space-y-3">
              <Link href="/login" className="flex justify-center items-center w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3.5 rounded-xl transition-all">
                Log In to Your Account
              </Link>
              <Link href="/signup" className="flex justify-center items-center w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all">
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
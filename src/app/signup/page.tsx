"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; 
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState(""); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  
  // 🚀 Added Animation States
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [mounted, setMounted] = useState(false);

  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const cleanUsername = username.toLowerCase().trim();

    // 1. Basic Validation
    if (cleanUsername.includes(" ")) {
      setErrorMsg("Username cannot contain spaces. Use underscore (_) instead.");
      setLoading(false);
      return;
    }

    // 2. LIVE UNIQUE CHECK: Check if username already exists in DB
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", cleanUsername)
      .single();

    if (existingUser) {
      setErrorMsg("This username is already taken! Please choose another one.");
      setLoading(false);
      return;
    }

    // 3. Create Account if username is unique
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        data: { 
          full_name: name,
          username: cleanUsername 
        } 
      }
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      // 🚀 Trigger Full-Screen Premium Animation
      setIsRedirecting(true);
      setTimeout(() => {
        router.push("/");
      }, 1500);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` }
    });
    
    if (error) {
      setErrorMsg("Google signup failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#07070a] font-sans overflow-hidden">
      
      {/* ========================================= */}
      {/* 🚀 LEFT SIDE: DYNAMIC ANIMATED UI (Desktop) */}
      {/* ========================================= */}
      <div className="hidden lg:flex w-1/2 relative bg-[#07070a] flex-col justify-between p-12 overflow-hidden border-r border-white/5">
        
        {/* Animated Glowing Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-orange-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-red-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '4s' }}></div>

        {/* Dynamic Tech Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

        {/* Floating Brand Logo */}
        <div className="relative z-10">
          <div className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500 tracking-tighter">
            Zestly<span className="text-slate-300 text-sm ml-1 opacity-70">Pro</span>
          </div>
        </div>

        {/* Futuristic Content */}
        <div className="relative z-10 mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full mb-6">
             <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
             <span className="text-slate-300 font-bold text-xs tracking-wider uppercase">Live Network</span>
          </div>
          <h1 className="text-5xl font-black text-white leading-tight mb-6 tracking-tight">
            Connect.<br/>Cook.<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Conquer.</span>
          </h1>
          <p className="text-lg text-slate-400 font-medium max-w-md leading-relaxed">
            The next-generation platform for culinary artists. Share your recipes, build your audience, and join the global kitchen.
          </p>
        </div>

        {/* Decorative Floating Elements */}
        <div className="relative z-10 flex gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center text-xl shadow-lg">🥗</div>
          <div className="w-12 h-12 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center text-xl shadow-lg">🥩</div>
          <div className="w-12 h-12 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center text-xl shadow-lg">🍰</div>
        </div>
      </div>

      {/* ========================================= */}
      {/* 🚀 RIGHT SIDE: SIGNUP FORM (Mobile & Desktop) */}
      {/* ========================================= */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-20">
        
        {/* Subtle Glows for Mobile ONLY */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-orange-600/10 rounded-full blur-[100px] lg:hidden pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-red-600/10 rounded-full blur-[100px] lg:hidden pointer-events-none"></div>

        <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
          
          <div className="lg:hidden mb-8 text-center">
            <div className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500 tracking-tighter inline-block">
              Zestly<span className="text-slate-400 text-sm ml-1 opacity-70">Pro</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight">Create Account</h2>
            <p className="text-slate-400 font-medium text-sm sm:text-base">Join the community of food creators today.</p>
          </div>

          {(errorMsg || successMsg) && (
            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${errorMsg ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-green-500/10 border border-green-500/20 text-green-400'}`}>
              <p className="text-sm font-bold">{errorMsg || successMsg}</p>
            </div>
          )}

          {/* Google Sign Up */}
          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white hover:bg-slate-100 text-slate-900 font-extrabold py-3.5 rounded-2xl transition-all active:scale-[0.98] mb-6 flex justify-center items-center gap-3 disabled:opacity-70 outline-none [-webkit-tap-highlight-color:transparent] shadow-md cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <div className="flex items-center mb-6">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="px-4 text-slate-500 text-xs font-bold tracking-widest uppercase">Or register with email</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Full Name */}
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-bold text-slate-400 pl-1">Full Name</label>
                <div className="relative flex items-center bg-white/[0.02] border border-white/10 rounded-2xl focus-within:border-orange-500/50 focus-within:bg-white/[0.04] transition-all">
                  <svg className="absolute left-4 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <input 
                    type="text" placeholder="Enter your name" 
                    className="w-full bg-transparent pl-11 pr-4 py-3.5 text-white placeholder:text-slate-600 outline-none text-sm font-medium"
                    onChange={(e) => setName(e.target.value)} value={name} required
                  />
                </div>
              </div>

              {/* Username */}
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-bold text-slate-400 pl-1 flex justify-between">
                  <span>Username</span>
                </label>
                <div className="relative flex items-center bg-white/[0.02] border border-white/10 rounded-2xl focus-within:border-orange-500/50 focus-within:bg-white/[0.04] transition-all">
                  <span className="absolute left-4 text-slate-500 font-bold">@</span>
                  <input 
                    type="text" placeholder="Enter username" 
                    className="w-full bg-transparent pl-10 pr-4 py-3.5 text-white placeholder:text-slate-600 outline-none text-sm font-medium lowercase"
                    onChange={(e) => setUsername(e.target.value)} value={username} required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 pl-1">Email Address</label>
              <div className="relative flex items-center bg-white/[0.02] border border-white/10 rounded-2xl focus-within:border-orange-500/50 focus-within:bg-white/[0.04] transition-all">
                <svg className="absolute left-4 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input 
                  type="email" placeholder="Enter your email" 
                  className="w-full bg-transparent pl-11 pr-4 py-3.5 text-white placeholder:text-slate-600 outline-none text-sm font-medium"
                  onChange={(e) => setEmail(e.target.value)} value={email} required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 pl-1">Password</label>
              <div className="relative flex items-center bg-white/[0.02] border border-white/10 rounded-2xl focus-within:border-orange-500/50 focus-within:bg-white/[0.04] transition-all">
                <svg className="absolute left-4 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input 
                  type="password" placeholder="Create a strong password" autoComplete="new-password"
                  className="w-full bg-transparent pl-11 pr-4 py-3.5 text-white placeholder:text-slate-600 outline-none text-sm font-medium"
                  onChange={(e) => setPassword(e.target.value)} value={password} required minLength={6}
                />
              </div>
            </div>

            <button 
              type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-black py-4 rounded-2xl shadow-[0_8px_20px_rgba(249,115,22,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all mt-4 flex justify-center items-center gap-2 outline-none [-webkit-tap-highlight-color:transparent] cursor-pointer"
            >
              {loading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Setting up...</> : "Create Account"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-400 text-sm font-medium">
              Already have an account?{" "}
              <Link href="/login" className="text-white font-extrabold hover:text-orange-400 transition-colors outline-none [-webkit-tap-highlight-color:transparent]">Log in</Link>
            </p>
          </div>

        </div>
      </div>

      {/* 🚀 ULTIMATE FULL-SCREEN REDIRECT ANIMATION MODAL */}
      {mounted && isRedirecting && createPortal(
        <div className="fixed inset-0 z-[100000] bg-[#07070a] flex flex-col items-center justify-center overflow-hidden animate-in fade-in duration-300">
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-orange-600/30 rounded-full blur-[150px] animate-pulse"></div>
          
          <div className="relative z-10 flex flex-col items-center animate-in zoom-in duration-500">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-5xl sm:text-7xl font-black text-white shadow-[0_0_80px_rgba(249,115,22,0.8)] animate-pulse mb-8">
              Z
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
              Account Created Successfully
            </h2>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 font-bold tracking-widest uppercase text-xs sm:text-sm">
                Preparing your kitchen... 👨‍🍳
              </p>
            </div>
          </div>

          <div className="absolute inset-0 bg-orange-500/10 mix-blend-overlay animate-pulse"></div>
        </div>,
        document.body
      )}

    </div>
  );
}
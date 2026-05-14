"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase"; // Updated Path
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccessMsg("Account created! Redirecting to Dashboard...");
      setTimeout(() => router.push("/"), 2000);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` }
    });
    
    if (error) {
      setErrorMsg("Google signup failed.");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#07070a] overflow-x-hidden font-sans">
      
      {/* Background Animated Orbs */}
      <div className="absolute top-[-5%] left-[-5%] w-[25rem] h-[25rem] bg-orange-600/20 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[-5%] right-[-5%] w-[35rem] h-[35rem] bg-red-600/10 rounded-full blur-[130px] animate-pulse pointer-events-none"></div>

      {/* Main Container: Mobile par full-screen, Desktop par Card */}
      <div className="relative z-10 w-full sm:max-w-md h-screen sm:h-auto animate-in fade-in zoom-in-95 duration-700">
        
        <div className="h-full sm:h-auto bg-[#07070a] sm:bg-white/[0.03] sm:backdrop-blur-3xl p-8 sm:p-10 sm:rounded-[2.5rem] sm:border sm:border-white/[0.08] sm:shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col justify-center">
          
          {/* Header */}
          <div className="text-left sm:text-center mb-8">
            <h2 className="text-4xl sm:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 mb-2 tracking-tight">
              Join Zestly.
            </h2>
            <p className="text-slate-400 font-medium">Create your professional chef account</p>
          </div>

          {/* Error/Success Messages */}
          {(errorMsg || successMsg) && (
            <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${errorMsg ? 'bg-red-500/10 border border-red-500/30 text-red-400' : 'bg-green-500/10 border border-green-500/30 text-green-400'}`}>
              <p className="text-sm font-semibold">{errorMsg || successMsg}</p>
            </div>
          )}

          {/* Google Sign Up */}
          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white hover:bg-slate-50 text-slate-900 font-bold py-4 rounded-2xl transition-all duration-300 active:scale-[0.97] mb-6 flex justify-center items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="w-6 h-6">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign up with Google
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center mb-6 opacity-30">
            <div className="flex-1 h-px bg-white"></div>
            <span className="px-4 text-white text-xs font-bold tracking-widest uppercase">Or email</span>
            <div className="flex-1 h-px bg-white"></div>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            {/* Full Name */}
            <div className="group">
              <div className="relative flex items-center">
                <svg className="absolute left-4 w-5 h-5 text-slate-500 group-focus-within:text-orange-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <input 
                  type="text" 
                  placeholder="Enter your full name" 
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white placeholder:text-slate-600 focus:border-orange-500/50 outline-none transition-all"
                  onChange={(e) => setName(e.target.value)}
                  value={name}
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="group">
              <div className="relative flex items-center">
                <svg className="absolute left-4 w-5 h-5 text-slate-500 group-focus-within:text-orange-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input 
                  type="email" 
                  placeholder="Enter your email address" 
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white placeholder:text-slate-600 focus:border-orange-500/50 outline-none transition-all"
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="group">
              <div className="relative flex items-center">
                <svg className="absolute left-4 w-5 h-5 text-slate-500 group-focus-within:text-orange-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input 
                  type="password" 
                  placeholder="Create a strong password" 
                  autoComplete="new-password"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white placeholder:text-slate-600 focus:border-orange-500/50 outline-none transition-all"
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {loading ? (
                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Creating...</>
              ) : "Create Account"}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-slate-400 text-sm">
              Already a chef?{" "}
              <Link href="/login" className="text-white font-bold hover:text-orange-400 transition-colors">
                Log in here
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
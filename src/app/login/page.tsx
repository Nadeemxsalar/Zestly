"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState(""); // 🚀 New: For Success Emails
  const [loading, setLoading] = useState(false);
  
  // 🚀 New: Toggle between Login and Forgot Password mode
  const [isForgotPassword, setIsForgotPassword] = useState(false); 
  
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg("Incorrect email or password. Please try again.");
    } else {
      router.push("/");
    }
    setLoading(false);
  };

  // 🚀 NEW: Supabase Forgot Password Logic
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg("Please enter your email address first. 📧");
      return;
    }
    
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`, // Jab link pe click karega toh yahan aayega
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccessMsg("Password reset link sent! Check your inbox. 📩");
      setTimeout(() => setIsForgotPassword(false), 3000); // 3 sec baad wapas login form dikhayega
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` }
    });
    if (error) setErrorMsg("Google login failed. Please try again.");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#07070a] overflow-x-hidden font-sans">
      
      {/* Background Animated Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-orange-600/20 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-red-600/10 rounded-full blur-[150px] animate-pulse pointer-events-none" style={{ animationDelay: '1s' }}></div>

      {/* Main Container */}
      <div className="relative z-10 w-full sm:max-w-md h-screen sm:h-auto animate-in fade-in zoom-in-95 duration-700">
        
        <div className="h-full sm:h-auto bg-[#07070a] sm:bg-white/[0.03] sm:backdrop-blur-3xl p-8 sm:p-10 sm:rounded-[2.5rem] sm:border sm:border-white/[0.08] sm:shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col justify-center transition-all duration-500">
          
          {/* Header */}
          <div className="text-left sm:text-center mb-8">
            <h2 className="text-4xl sm:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 mb-2 tracking-tight">
              {isForgotPassword ? "Reset Password" : "Welcome Back"}
            </h2>
            <p className="text-slate-400 font-medium">
              {isForgotPassword ? "Enter your email to receive a reset link" : "Log in to your Zestly account"}
            </p>
          </div>

          {/* Success Message Banner */}
          {successMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 text-green-400">
              <span className="text-xl">✅</span>
              <p className="text-sm font-semibold">{successMsg}</p>
            </div>
          )}

          {/* Error Message Banner */}
          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 animate-bounce-short text-red-400">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm font-semibold">{errorMsg}</p>
            </div>
          )}

          {/* Google Log In (Only show in Login Mode) */}
          {!isForgotPassword && (
            <>
              <button 
                type="button"
                onClick={handleGoogleLogin}
                className="w-full bg-white hover:bg-slate-50 text-slate-900 font-bold py-4 rounded-2xl transition-all duration-300 active:scale-[0.97] mb-6 flex justify-center items-center gap-3 shadow-lg cursor-pointer"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Log in with Google
              </button>

              <div className="flex items-center mb-6 opacity-30">
                <div className="flex-1 h-px bg-white"></div>
                <span className="px-4 text-white text-xs font-bold tracking-widest uppercase">Or email</span>
                <div className="flex-1 h-px bg-white"></div>
              </div>
            </>
          )}

          {/* Forms */}
          <form onSubmit={isForgotPassword ? handleForgotPassword : handleLogin} className="space-y-5">
            
            {/* Email Address (Shared between both modes) */}
            <div className="group">
              <div className="relative flex items-center">
                <svg className="absolute left-4 w-5 h-5 text-slate-500 group-focus-within:text-orange-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  value={email}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white placeholder:text-slate-600 focus:border-orange-500/50 outline-none transition-all cursor-text"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password (Only show in Login Mode) */}
            {!isForgotPassword && (
              <div className="group animate-in fade-in zoom-in duration-300">
                <div className="relative flex items-center">
                  <svg className="absolute left-4 w-5 h-5 text-slate-500 group-focus-within:text-orange-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input 
                    type="password" 
                    placeholder="Password" 
                    value={password}
                    autoComplete="current-password"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white placeholder:text-slate-600 focus:border-orange-500/50 outline-none transition-all cursor-text"
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                
                {/* Forgot Password Trigger */}
                <div className="flex justify-end mt-2 pr-1">
                  <button 
                    type="button" 
                    onClick={() => { setIsForgotPassword(true); setErrorMsg(""); setSuccessMsg(""); }} 
                    className="text-sm font-medium text-slate-400 hover:text-orange-400 transition-colors cursor-pointer outline-none"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button 
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-6 cursor-pointer disabled:opacity-50"
            >
              {loading 
                ? "Processing..." 
                : isForgotPassword 
                  ? "Send Reset Link 📧" 
                  : "Sign In to Zestly"
              }
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            {isForgotPassword ? (
               <button 
                  onClick={() => { setIsForgotPassword(false); setErrorMsg(""); setSuccessMsg(""); }} 
                  className="text-slate-400 text-sm font-bold hover:text-white transition-colors cursor-pointer"
               >
                  ← Back to Login
               </button>
            ) : (
              <p className="text-slate-400 text-sm">
                New to Zestly?{" "}
                <Link href="/signup" className="text-white font-bold hover:text-orange-400 transition-colors">
                  Create an account
                </Link>
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
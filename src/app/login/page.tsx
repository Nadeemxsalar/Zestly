"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Precise Error States
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalMessage, setGeneralMessage] = useState({ text: "", type: "" }); 
  
  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Toggle modes
  const [isForgotPassword, setIsForgotPassword] = useState(false); 
  
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset errors on typing
  useEffect(() => {
    setEmailError("");
    setPasswordError("");
    setGeneralMessage({ text: "", type: "" });
  }, [email, password]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setEmailError("");
    setPasswordError("");
    setGeneralMessage({ text: "", type: "" });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const msg = error.message.toLowerCase();
      
      // Professional User-Friendly Error Handling
      if (msg.includes("credentials") || msg.includes("invalid")) {
        setPasswordError("Incorrect email or password. Please try again.");
      } else if (msg.includes("user not found") || msg.includes("not registered")) {
        setEmailError("This email address is not registered.");
      } else {
        setGeneralMessage({ text: error.message, type: "error" });
      }
      setLoading(false);
    } else {
      // Trigger Professional Full-Screen Animation
      setIsRedirecting(true);
      setTimeout(() => {
        router.push("/");
      }, 1500); 
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setEmailError("Please provide your registered email address first.");
      return;
    }
    
    setLoading(true);
    setEmailError("");
    setGeneralMessage({ text: "", type: "" });

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`, 
    });

    if (error) {
      if (error.message.toLowerCase().includes("user not found")) {
        setEmailError("This email address is not recognized in our system.");
      } else {
        setEmailError(error.message);
      }
    } else {
      setGeneralMessage({ text: "Reset instructions sent. Please check your email inbox. 📩", type: "success" });
      setTimeout(() => setIsForgotPassword(false), 3500); 
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` }
    });
    if (error) setGeneralMessage({ text: "Google log in failed. Please try again.", type: "error" });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#07070a] overflow-hidden font-sans">
      
      {/* Background Animated Premium Orbs */}
      <div className="absolute top-[-15%] right-[-10%] w-[35rem] h-[35rem] bg-gradient-to-br from-orange-600/20 to-red-600/10 rounded-full blur-[130px] animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[-15%] left-[-10%] w-[45rem] h-[45rem] bg-gradient-to-tr from-red-600/10 to-orange-500/10 rounded-full blur-[160px] animate-pulse pointer-events-none" style={{ animationDelay: '1.5s' }}></div>

      {/* Main Container */}
      <div className="relative z-10 w-full sm:max-w-md h-screen sm:h-auto animate-in fade-in zoom-in-95 duration-700 flex flex-col justify-center">
        
        <div className="h-full sm:h-auto bg-[#07070a]/80 sm:bg-white/[0.02] sm:backdrop-blur-3xl p-8 sm:p-10 sm:rounded-[3rem] sm:border sm:border-white/[0.05] sm:shadow-[0_0_80px_rgba(0,0,0,0.4)] flex flex-col justify-center transition-all duration-500 relative overflow-hidden">
          
          <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent"></div>

          {/* Header */}
          <div className="text-left sm:text-center mb-8">
            <h2 className="text-4xl sm:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 mb-2 tracking-tight drop-shadow-sm">
              {isForgotPassword ? "Account Recovery" : "Welcome Back"}
            </h2>
            <p className="text-slate-400 font-medium text-sm sm:text-base">
              {isForgotPassword ? "Enter your registered email to receive reset instructions." : "Please enter your email and password to access your account."}
            </p>
          </div>

          {/* Advanced General Message Banner */}
          {generalMessage.text && (
            <div className={`mb-6 p-4 rounded-2xl border flex items-start gap-3 animate-in fade-in slide-in-from-top-4 shadow-lg ${generalMessage.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400 shadow-green-500/10' : 'bg-red-500/10 border-red-500/30 text-red-400 shadow-red-500/10'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${generalMessage.type === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                {generalMessage.type === 'success' ? (
                  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                )}
              </div>
              <p className="text-sm font-bold leading-snug">{generalMessage.text}</p>
            </div>
          )}

          {/* Google Log In */}
          {!isForgotPassword && (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <button 
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full bg-white hover:bg-slate-100 text-slate-900 font-extrabold py-3.5 rounded-2xl transition-all duration-300 active:scale-[0.97] mb-6 flex justify-center items-center gap-3 shadow-[0_4px_20px_rgba(255,255,255,0.1)] cursor-pointer disabled:opacity-50 outline-none"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center mb-6 opacity-40">
                <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-white/10"></div>
                <span className="px-4 text-white text-[10px] font-black tracking-[0.2em] uppercase">Or continue with email</span>
                <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent via-white/50 to-white/10"></div>
              </div>
            </div>
          )}

          {/* Forms */}
          <form onSubmit={isForgotPassword ? handleForgotPassword : handleLogin} className="space-y-4">
            
            {/* Email Address Field */}
            <div className="flex flex-col gap-1.5">
              <div className="relative flex items-center group">
                <div className="absolute left-4 flex items-center justify-center w-8 h-8 rounded-full bg-white/5 group-focus-within:bg-orange-500/20 transition-colors duration-300">
                  <svg className={`w-4 h-4 transition-colors ${emailError ? 'text-red-500' : 'text-slate-400 group-focus-within:text-orange-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  value={email}
                  disabled={loading}
                  className={`w-full bg-white/[0.02] border hover:border-white/20 rounded-2xl pl-14 pr-6 py-4 text-white font-medium placeholder:text-slate-500 outline-none transition-all cursor-text disabled:opacity-50 ${emailError ? 'border-red-500/50 focus:border-red-500 bg-red-500/5' : 'border-white/10 focus:border-orange-500/50 focus:bg-white/[0.04]'}`}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {/* Precise Email Error Placement */}
              {emailError && (
                <p className="text-red-400 text-xs font-bold pl-2 animate-in fade-in flex items-center gap-1">
                  <span>⚠️</span> {emailError}
                </p>
              )}
            </div>

            {/* Password Field */}
            {!isForgotPassword && (
              <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="relative flex items-center group">
                  <div className="absolute left-4 flex items-center justify-center w-8 h-8 rounded-full bg-white/5 group-focus-within:bg-orange-500/20 transition-colors duration-300">
                    <svg className={`w-4 h-4 transition-colors ${passwordError ? 'text-red-500' : 'text-slate-400 group-focus-within:text-orange-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input 
                    type="password" 
                    placeholder="Password" 
                    value={password}
                    disabled={loading}
                    autoComplete="current-password"
                    className={`w-full bg-white/[0.02] border hover:border-white/20 rounded-2xl pl-14 pr-6 py-4 text-white font-medium placeholder:text-slate-500 outline-none transition-all cursor-text disabled:opacity-50 ${passwordError ? 'border-red-500/50 focus:border-red-500 bg-red-500/5' : 'border-white/10 focus:border-orange-500/50 focus:bg-white/[0.04]'}`}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {/* Precise Password Error Placement */}
                {passwordError && (
                  <p className="text-red-400 text-xs font-bold pl-2 animate-in fade-in flex items-center gap-1">
                    <span>⚠️</span> {passwordError}
                  </p>
                )}
                
                {/* Forgot Password Trigger */}
                <div className="flex justify-end mt-2 pr-2">
                  <button 
                    type="button" 
                    disabled={loading}
                    onClick={() => { setIsForgotPassword(true); setEmailError(""); setPasswordError(""); setGeneralMessage({text:"", type:""}); }} 
                    className="text-xs font-bold text-slate-400 hover:text-orange-400 transition-colors cursor-pointer outline-none disabled:opacity-50"
                  >
                    Forgot your password?
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button 
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-black text-lg py-4 rounded-2xl shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 mt-6 cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2 outline-none"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Processing...
                </>
              ) : isForgotPassword ? (
                "Send Reset Instructions" 
              ) : (
                "Log In"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center pb-4 sm:pb-0">
            {isForgotPassword ? (
               <button 
                  disabled={loading}
                  onClick={() => { setIsForgotPassword(false); setEmailError(""); setGeneralMessage({text:"", type:""}); }} 
                  className="text-slate-400 text-sm font-bold hover:text-white transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mx-auto outline-none"
               >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                  Back to Log In
               </button>
            ) : (
              <p className="text-slate-400 text-sm font-medium">
                New to Zestly?{" "}
                <Link href="/signup" className="text-white font-extrabold hover:text-orange-400 transition-colors ml-1">
                  Create an account
                </Link>
              </p>
            )}
          </div>

        </div>
      </div>

      {/* ULTIMATE FULL-SCREEN REDIRECT ANIMATION MODAL */}
      {mounted && isRedirecting && createPortal(
        <div className="fixed inset-0 z-[100000] bg-[#07070a] flex flex-col items-center justify-center overflow-hidden animate-in fade-in duration-300">
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-orange-600/30 rounded-full blur-[150px] animate-pulse"></div>
          
          <div className="relative z-10 flex flex-col items-center animate-in zoom-in duration-500">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-5xl sm:text-7xl font-black text-white shadow-[0_0_80px_rgba(249,115,22,0.8)] animate-pulse mb-8">
              Z
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
              Log In Successful
            </h2>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 font-bold tracking-widest uppercase text-xs sm:text-sm">
                Logging you in securely... 🛡️
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
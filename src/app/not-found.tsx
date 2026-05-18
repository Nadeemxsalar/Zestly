"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function NotFound() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="h-[100dvh] w-full bg-[#f6f1eb] flex flex-col overflow-hidden relative font-sans selection:bg-orange-500/30">

      {/* 🌟 Custom Animations */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes float {
              0% { transform: translateY(0px); }
              50% { transform: translateY(-8px); }
              100% { transform: translateY(0px); }
            }

            @keyframes shine {
              100% { left: 125%; }
            }

            .animate-float {
              animation: float 6s ease-in-out infinite;
            }
          `,
        }}
      />

      {/* 🌈 Ambient Glow */}
      <div className="absolute top-[5%] left-[-10%] w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] bg-orange-300/20 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <div className="absolute bottom-[10%] right-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-red-300/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* =========================================
          🟢 TOP SECTION
      ========================================= */}
      <div className="relative z-10 flex-1 flex items-center justify-center w-full bg-white">

        {/* GIF Background */}
        <div
          className="absolute inset-0 w-full h-[48vh] sm:h-[58vh] bg-no-repeat bg-center bg-contain opacity-100"
          style={{
            backgroundImage:
              "url('https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif')",
            backgroundPosition: "center center",
            backgroundColor: "#ffffff",
          }}
        />

        {/* 404 Text */}
        <div className="absolute top-[18%] sm:top-[16%] left-1/2 -translate-x-1/2 z-20">
          <h1 className="text-[34px] sm:text-[58px] md:text-[72px] font-black tracking-[0.18em] leading-none text-slate-500/70 select-none">
            404
          </h1>
        </div>

      </div>

      {/* =========================================
          🔵 BOTTOM GLASS CARD
      ========================================= */}
      <div className="relative z-20 w-full bg-white/40 backdrop-blur-2xl border-t border-white/80 shadow-[0_-20px_50px_rgba(0,0,0,0.05)] rounded-t-[2.5rem] sm:rounded-t-[4rem] px-6 py-8 sm:py-10 md:px-20 flex flex-col items-center text-center mt-auto animate-in slide-in-from-bottom-10 duration-700">

        {/* Content */}
        <div className="w-full max-w-2xl flex flex-col items-center animate-float">

          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 bg-white/80 backdrop-blur-xl px-4 py-2 rounded-full border border-orange-100 mb-4 shadow-sm">

            <span className="w-2 h-2 rounded-full bg-orange-500 animate-[ping_2s_infinite]"></span>

            <span className="text-[10px] sm:text-xs font-bold text-orange-600 uppercase tracking-widest">
              Error Code: Page Not Found
            </span>
          </div>

          {/* Heading */}
          <h3 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3 drop-shadow-sm">
            Oops! You're lost.
          </h3>

          {/* Description */}
          <p className="text-slate-600 font-medium text-sm sm:text-base leading-relaxed mb-6 px-2 max-w-xl">
            The page you're looking for has been moved, deleted, or you
            wandered into unknown territory. Let's get you back on track. 🚀
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full">

            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="w-full sm:w-[200px] group relative flex items-center justify-center gap-2 bg-white/70 hover:bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-bold py-3.5 rounded-2xl transition-all duration-300 active:scale-95 outline-none cursor-pointer overflow-hidden backdrop-blur-md"
            >
              <span className="relative z-10 flex items-center gap-2">

                <svg
                  className="w-5 h-5 group-hover:-translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                  />
                </svg>

                Go Back
              </span>
            </button>

            {/* Home Button */}
            <Link
              href="/"
              className="w-full sm:w-[240px] group relative flex justify-center items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3.5 rounded-2xl transition-all duration-300 shadow-[0_10px_30px_rgba(249,115,22,0.3)] hover:shadow-[0_15px_40px_rgba(249,115,22,0.45)] hover:-translate-y-1 active:scale-95 outline-none cursor-pointer overflow-hidden border border-orange-400"
            >

              {/* Shine Effect */}
              <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-[shine_1.5s] pointer-events-none" />

              <span className="relative z-10 flex items-center gap-2">
                Back to Home

                <svg
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

// PWA ki master settings
const withPWA = withPWAInit({
  dest: "public", // Service worker public folder mein banega
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development", // Dev mode mein band rakha hai taaki errors na aayein
  workboxOptions: {
    disableDevLogs: true,
  },
});

// Aapki normal Next.js config
const nextConfig: NextConfig = {
  /* config options here */
};

// Next config ko PWA wrapper ke sath export kar rahe hain
export default withPWA(nextConfig);
import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

// PWA ki master settings
const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  // 🔥 DEVELOPMENT MEIN PWA KO COMPLETELY BAND RAKHNE KA LOGIC:
  disable: process.env.NODE_ENV === "development", 
  workboxOptions: {
    disableDevLogs: true,
  },
});

// Aapki normal Next.js config
const nextConfig: NextConfig = {
  // Aap yahan apni baaki settings daal sakte hain
};

// Next config ko PWA wrapper ke sath export kar rahe hain
export default withPWA(nextConfig);
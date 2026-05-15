import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Path fixed (../ dalkar)
import { ThemeProvider } from "../components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#07070a", 
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Zestly",
  description: "Your Ultimate AI Cookbook & Pantry Tracker",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Zestly",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning // Zaroori hai hydration mismatch errors rokne ke liye
    >
      {/* 🚀 NAYA: 100% Correct Body Colors - Light: Slate-50/Slate-900, Dark: #07070a/White */}
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-[#07070a] dark:text-white antialiased transition-colors duration-300">
        
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </ThemeProvider>
        
      </body>
    </html>
  );
}
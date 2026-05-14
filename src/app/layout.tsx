import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// NAYA: PWA aur Mobile Screen ke liye Viewport settings
export const viewport: Viewport = {
  themeColor: "#07070a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Yeh app ko browser ki tarah zoom hone se rokega
};

// NAYA: Zestly ki pehchaan (Metadata & PWA Manifest)
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
    >
      <body className="min-h-full flex flex-col bg-[#07070a] text-white">
        {children}
      </body>
    </html>
  );
}
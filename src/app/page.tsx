"use client";

import { Counter } from "@/components/counter";
import { Button } from "@/components/ui/button";
import SplitText from "@/components/ui/split-text";
import { WaitlistForm } from "@/components/waitlist-form";
import Link from "next/link";
import Image from "next/image";
import { Space_Grotesk } from "next/font/google";

// ✅ ฟอนต์หลักของหน้า
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function Home() {
  return (
    <div
      className={`${spaceGrotesk.className} relative min-h-screen bg-[#030303] text-white selection:bg-cyan-500 selection:text-black overflow-hidden flex flex-col justify-between`}
    >
      {/* 🔮 Background Ambient Lighting (แสงฟุ้งด้านหลังเพิ่มความ Luxury) */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />

      {/* 🕸️ Subtle Grid Overlay (ตารางจางๆ เพิ่มฟีล Tech/AI) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto py-12">
        
        {/* 🌟 VIP Status Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-md mb-8 text-xs font-medium tracking-widest text-zinc-300 uppercase shadow-inner">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          Exclusive Priority Access
        </div>

        {/* 🛡️ Logo with Soft Glow */}
        <div className="relative mb-8 group">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full blur opacity-30 group-hover:opacity-60 transition duration-500" />
          <Image
            src="/logo.png"
            alt="Jarvis Logo"
            width={80}
            height={80}
            className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        {/* ✍️ World-Class Headline */}
        <div className="mb-6 space-y-4 max-w-3xl">
          <SplitText className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1]">
            Be First to Experience{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-cyan-400 to-teal-200 drop-shadow-[0_0_25px_rgba(34,211,238,0.4)]">
              7on
            </span>
          </SplitText>

          {/* Sub-headline สไตล์เรียบหรู */}
          <p className="text-base sm:text-lg text-zinc-400 max-w-lg mx-auto font-normal leading-relaxed">
            Unlocking priority access to the real-life Jarvis. <br className="hidden sm:inline" />
            Designed for the select few.
          </p>
        </div>

        {/* ✉️ Glassmorphic Waitlist Form Container */}
        <div className="w-full max-w-md mx-auto my-4 p-1 rounded-2xl bg-gradient-to-b from-white/10 via-white/5 to-transparent">
          <div className="bg-black/60 backdrop-blur-xl p-2 rounded-xl border border-white/10 shadow-2xl">
            <WaitlistForm />
          </div>
        </div>

        {/* 🔢 Counter Section */}
        <div className="mt-6 text-zinc-400">
          <Counter />
        </div>

      </main>

      {/* ⚓ Footer */}
      <footer className="relative z-10 py-6 text-center">
        <Button
          size="icon"
          variant="ghost"
          className="hover:bg-white/10 rounded-full transition-all duration-300"
        >
          <Link href="https://7on.ai" target="_blank" aria-label="Visit 7on.ai">
            <Image
              src="/logo.png"
              alt="My Logo"
              width={24}
              height={24}
              className="w-6 h-6 opacity-60 hover:opacity-100 transition-opacity"
            />
          </Link>
        </Button>
      </footer>
    </div>
  );
}

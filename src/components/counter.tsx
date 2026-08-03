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
      className={`${spaceGrotesk.className} relative min-h-screen bg-[#030303] text-white selection:bg-rose-600 selection:text-white overflow-hidden flex flex-col justify-between`}
    >
      {/* 🔮 Crimson Ambient Glow (บรรยากาศแสงแดงเข้ม Crimson ลุ่มลึกด้านหลัง) */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-rose-600/15 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-red-900/20 blur-[140px] rounded-full pointer-events-none" />

      {/* 🕸️ Subtle Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto py-12">
        
        {/* 🌟 Crimson VIP Status Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-950/30 border border-rose-500/20 backdrop-blur-md mb-8 text-xs font-medium tracking-widest text-zinc-300 uppercase shadow-inner">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_#f43f5e]" />
          Exclusive Priority Access
        </div>

        {/* 🛡️ Crimson Glowing Orb Behind Logo (วงกลมหลังโลโก้สี Crimson) */}
        <div className="relative mb-8 group flex items-center justify-center">
          {/* แสงวงกลม Crimson รัศมีเรืองแสงหลัง Logo */}
          <div className="absolute w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-tr from-rose-600 via-red-600 to-rose-400 rounded-full blur-xl opacity-80 group-hover:opacity-100 transition-all duration-500 scale-95 group-hover:scale-110" />
          
          <Image
            src="/logo.png"
            alt="Sunday AI Logo"
            width={80}
            height={80}
            className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 transition-transform duration-500 group-hover:scale-105 filter drop-shadow-[0_0_12px_rgba(225,29,72,0.5)]"
          />
        </div>

        {/* ✍️ Headline */}
        <div className="mb-6 space-y-4 max-w-3xl">
          <SplitText className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1]">
            Be First to Experience{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-rose-500 to-red-400 drop-shadow-[0_0_25px_rgba(225,29,72,0.5)]">
              7on
            </span>
          </SplitText>

          {/* Sub-headline สไตล์เรียบหรู พร้อมอ้างอิงถึง Agent "Sunday" */}
          <p className="text-base sm:text-lg text-zinc-400 max-w-lg mx-auto font-normal leading-relaxed">
            Unlocking priority access to <span className="text-zinc-200 font-medium">Sunday</span> — your autonomous real-life agent. <br className="hidden sm:inline" />
            Designed for the select few.
          </p>
        </div>

        {/* ✉️ Crimson Glassmorphic Waitlist Form Container */}
        <div className="w-full max-w-md mx-auto my-4 p-1 rounded-2xl bg-gradient-to-b from-rose-500/20 via-white/5 to-transparent">
          <div className="bg-black/70 backdrop-blur-xl p-2 rounded-xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
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
          className="hover:bg-rose-500/10 rounded-full transition-all duration-300"
        >
          <Link href="https://7on.ai" target="_blank" aria-label="Visit 7on.ai">
            <Image
              src="/logo.png"
              alt="7on Logo"
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

/* CSS-rendered 7on device: brushed-steel shell, black face, glowing red dome */
export function Machine({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`relative aspect-square ${className}`}>
      {/* Ground shadow */}
      <div className="absolute -bottom-[6%] left-[8%] h-[18%] w-[88%] rounded-[100%] bg-black/25 blur-2xl" />
      {/* Shell */}
      <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_210deg,#d9d9dc,#8e8e93,#f1f1f3,#a2a2a7,#e4e4e7,#7c7c82,#d9d9dc)] shadow-[inset_0_2px_6px_rgba(255,255,255,0.8),inset_0_-10px_30px_rgba(0,0,0,0.35),0_30px_60px_-20px_rgba(0,0,0,0.5)]" />
      {/* Face */}
      <div className="absolute inset-[7%] rounded-full bg-[radial-gradient(circle_at_50%_40%,#1a1a1c,#050505_70%)] shadow-[inset_0_0_0_2px_rgba(196,29,59,0.9),inset_0_0_24px_rgba(196,29,59,0.45)]" />
      {/* Dome */}
      <div className="machine-glow absolute inset-[30%] rounded-full bg-[radial-gradient(circle_at_40%_35%,#ff6b7f,#e0233f_45%,#8f0f24_100%)] shadow-[0_0_60px_10px_rgba(224,35,63,0.45)]" />
    </div>
  );
}

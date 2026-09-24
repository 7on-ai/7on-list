"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import {
  AlarmClock,
  CalendarDays,
  CloudSun,
  House,
  Image as ImageIcon,
  Mail,
  MapPin,
  MessagesSquare,
  Music,
  PhoneCall,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/* Ring diameters as a fraction of the orbit square — mirrors 7on.ai */
const RINGS = [1, 0.76, 0.56];
const ORB = 0.38;

type Satellite = { icon: LucideIcon; ring: number; angle: number };

/* angle: degrees, 0 = right, clockwise */
const SATELLITES: Satellite[] = [
  { icon: PhoneCall, ring: 2, angle: 215 },
  { icon: Mail, ring: 2, angle: 285 },
  { icon: CalendarDays, ring: 2, angle: 2 },
  { icon: MessagesSquare, ring: 2, angle: 100 },
  { icon: House, ring: 2, angle: 150 },
  { icon: ImageIcon, ring: 1, angle: 245 },
  { icon: AlarmClock, ring: 1, angle: 322 },
  { icon: Music, ring: 1, angle: 142 },
  { icon: MapPin, ring: 0, angle: 297 },
  { icon: CloudSun, ring: 0, angle: 181 },
  { icon: Wallet, ring: 0, angle: 42 },
];

export function Orbit() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  /* 0 → orbit top enters the viewport, 1 → orbit centred on screen */
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });

  /* The soft pink bloom behind the hero condenses into a solid red orb */
  const orbScale = useTransform(scrollYProgress, [0.35, 1], [1.6, 1]);
  const orbBlur = useTransform(scrollYProgress, [0.35, 0.95], [60, 0]);
  const orbFilter = useTransform(orbBlur, (b) => `blur(${b}px)`);
  const orbOpacity = useTransform(scrollYProgress, [0.35, 0.95], [0.35, 1]);
  const iconsOpacity = useTransform(scrollYProgress, [0.6, 0.95], [0, 1]);
  const spin = useTransform(scrollYProgress, [0, 1], [-18, 0]);

  return (
    <div
      ref={ref}
      aria-hidden
      className="orbit relative aspect-square"
      style={{ width: "var(--orbit)", marginLeft: "calc(50% - var(--orbit) / 2)" }}
    >
      {/* Rings */}
      {RINGS.map((d) => (
        <div
          key={d}
          className="absolute rounded-full border border-zinc-300/90"
          style={{
            width: `${d * 100}%`,
            height: `${d * 100}%`,
            left: `${(1 - d) * 50}%`,
            top: `${(1 - d) * 50}%`,
          }}
        />
      ))}

      {/* Orb */}
      <motion.div
        className="absolute rounded-full bg-[#C41D3B]"
        style={{
          width: `${ORB * 100}%`,
          height: `${ORB * 100}%`,
          left: `${(1 - ORB) * 50}%`,
          top: `${(1 - ORB) * 50}%`,
          scale: reduce ? 1 : orbScale,
          filter: reduce ? "none" : orbFilter,
          opacity: reduce ? 1 : orbOpacity,
        }}
      >
        <div className="orb-breathe absolute inset-0 rounded-full shadow-[0_0_120px_20px_rgba(196,29,59,0.25)]" />
      </motion.div>

      {/* Satellites — each ring drifts slowly; icons counter-rotate to stay upright */}
      <motion.div
        className="absolute inset-0"
        style={{ opacity: reduce ? 1 : iconsOpacity, rotate: reduce ? 0 : spin }}
      >
        {RINGS.map((d, ringIndex) => (
          <div
            key={d}
            className="orbit-ring absolute"
            style={{
              width: `${d * 100}%`,
              height: `${d * 100}%`,
              left: `${(1 - d) * 50}%`,
              top: `${(1 - d) * 50}%`,
              animationDuration: `${140 + ringIndex * 40}s`,
              animationDirection: ringIndex === 1 ? "reverse" : "normal",
            }}
          >
            {SATELLITES.filter((s) => s.ring === ringIndex).map(
              ({ icon: Icon, angle }) => {
                const rad = (angle * Math.PI) / 180;
                return (
                  <div
                    key={angle}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${(50 + 50 * Math.cos(rad)).toFixed(3)}%`,
                      top: `${(50 + 50 * Math.sin(rad)).toFixed(3)}%`,
                    }}
                  >
                    <div
                      className="orbit-counter flex h-11 w-11 items-center justify-center rounded-full bg-white text-zinc-500"
                      style={{
                        animationDuration: `${140 + ringIndex * 40}s`,
                        animationDirection:
                          ringIndex === 1 ? "normal" : "reverse",
                      }}
                    >
                      <Icon className="h-6 w-6" strokeWidth={1.25} />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ElementType } from "react";
import { splitPhrases } from "./phrases";

interface SplitTextProps {
  children: string;
  as?: ElementType;
  className?: string;
  delay?: number;
}

/* Words (or Thai phrases) rise out of a soft blur, one after another.
   Never split per character — that would detach Thai vowels and tone marks. */
export default function SplitText({ children, as: Tag = "span", className = "", delay = 0 }: SplitTextProps) {
  const reduce = useReducedMotion();
  let word = 0;

  return (
    <Tag className={className} aria-label={children.replace(/​/g, "")}>
      {splitPhrases(children).map((part, i) => {
        if (part === "​") return <wbr key={i} />;
        if (/^\s+$/.test(part)) return part;
        const index = word++;
        return (
          <motion.span
            key={`${children}-${i}`}
            aria-hidden
            className="inline-block whitespace-nowrap will-change-[transform,opacity,filter]"
            initial={reduce ? false : { opacity: 0, y: 10, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ type: "spring", duration: 1.6, bounce: 0, delay: delay + index * 0.06 }}
          >
            {part}
          </motion.span>
        );
      })}
    </Tag>
  );
}

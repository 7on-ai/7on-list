"use client";
import { useState, useEffect } from "react";
import * as motion from "motion/react-client";

export function Counter() {
  const [count, setCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchCount = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/waitlist/count");
        if (!response.ok) {
          throw new Error(
            `Failed to fetch count: ${response.status} ${response.statusText}`
          );
        }
        const data = await response.json();
        if (typeof data.count !== "number") {
          throw new Error("Invalid count received from API");
        }
        // เพิ่มค่าเริ่มต้น 1182
        setCount(data.count + 11113);
      } catch (err) {
        console.error("Error fetching waitlist count:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        setCount(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCount();
  }, []);
  
  if (isLoading) {
    return <div className="h-6" aria-live="polite"></div>;
  }
  
  if (error) {
    return null;
  }
  
  if (count === null) {
    return null;
  }
  
  return (
    <motion.p
      initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 1.2, delay: 0.9, type: "spring", bounce: 0 }}
      className="text-sm text-zinc-500"
      aria-live="polite"
    >
      <span className="font-semibold text-[#111] tabular-nums">
        {count.toLocaleString()}+
      </span>{" "}
      people are already waiting for theirs
    </motion.p>
  );
}

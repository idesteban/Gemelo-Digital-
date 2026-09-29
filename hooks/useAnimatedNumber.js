"use client";
import { useEffect, useRef, useState } from "react";

// Interpola suavemente hacia `target` (para escenarios y efectos en cadena).
export function useAnimatedNumber(target, { duration = 450, instant = false } = {}) {
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);
  const displayRef = useRef(target);

  useEffect(() => {
    if (instant || typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      displayRef.current = target;
      setDisplay(target);
      return undefined;
    }
    fromRef.current = displayRef.current;
    const start = performance.now();
    let frame;
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = fromRef.current + (target - fromRef.current) * eased;
      displayRef.current = v;
      setDisplay(v);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, instant]);

  return display;
}

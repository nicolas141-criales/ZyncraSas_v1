"use client";
import { useEffect } from "react";

export default function ZyncraReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll(".z-reveal, .z-reveal-l, .z-reveal-r").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}

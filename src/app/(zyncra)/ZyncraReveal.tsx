"use client";
import { useEffect } from "react";

export default function ZyncraReveal() {
  useEffect(() => {
    // Scroll reveal for z-reveal / z-reveal-l / z-reveal-r
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

    // Blob parallax — subtle depth effect on hero blobs
    const blobs = document.querySelectorAll<HTMLElement>(".z-blob");
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        blobs.forEach((b, i) => {
          b.style.transform = `translateY(${y * (i % 2 === 0 ? 0.12 : -0.09)}px)`;
        });
        ticking = false;
      });
    };
    if (blobs.length > 0) {
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  return null;
}

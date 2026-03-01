"use client";

import { useEffect, useRef } from "react";

export default function ScrollObserver() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1, // Lower threshold to trigger sooner
        rootMargin: "0px 0px -50px 0px", // Less aggressive negative margin
      }
    );

    const elements = document.querySelectorAll(".reveal");
    elements.forEach((el) => observerRef.current?.observe(el));

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return null;
}

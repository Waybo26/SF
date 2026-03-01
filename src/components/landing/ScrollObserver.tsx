"use client";

import { useEffect, useRef } from "react";

export default function ScrollObserver() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Signal to CSS that JS is loaded — enables .reveal hide/show transitions.
    // Without this class, .reveal elements remain visible (progressive enhancement).
    document.documentElement.classList.add("js-loaded");

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
            // Once revealed, stop observing — content stays visible permanently
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    // Observe all current .reveal elements
    const elements = document.querySelectorAll(".reveal");
    elements.forEach((el) => observerRef.current?.observe(el));

    // MutationObserver to catch late-rendered .reveal elements (e.g. after hydration)
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            // Check if the added node itself is a .reveal
            if (node.classList.contains("reveal")) {
              observerRef.current?.observe(node);
            }
            // Check children of the added node
            node.querySelectorAll?.(".reveal").forEach((el) => {
              observerRef.current?.observe(el);
            });
          }
        });
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observerRef.current?.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return null;
}

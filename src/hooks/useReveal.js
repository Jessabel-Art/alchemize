import { useEffect, useRef } from "react";

export default function useReveal() {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const reveal = () => {
      node.dataset.revealed = "true";
    };
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      reveal();
      return undefined;
    }
    let observer;
    let failSafe;
    try {
      observer = new window.IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            reveal();
            observer.disconnect();
            window.clearTimeout(failSafe);
          }
        },
        { rootMargin: "0px 0px -8%", threshold: 0.12 },
      );
      observer.observe(node);
      // Insurance: content at or above the fold must never stay hidden if the
      // observer is slow or never reports (e.g. a fast jump past the element).
      failSafe = window.setTimeout(() => {
        if (node.getBoundingClientRect().top < window.innerHeight) {
          reveal();
          observer.disconnect();
        }
      }, 2500);
    } catch {
      reveal();
    }
    return () => {
      observer?.disconnect();
      window.clearTimeout(failSafe);
    };
  }, []);

  return ref;
}

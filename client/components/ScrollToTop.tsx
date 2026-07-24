"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const STORAGE_PREFIX = "scrollpos:";

export default function ScrollToTop() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const key = `${pathname}?${searchParams.toString()}`;
  const isPopNavigation = useRef(false);

  // Continuously remember how far down the user has scrolled on the
  // CURRENT page, so it's there to restore if they navigate away and
  // come back via Back/Forward.
  useEffect(() => {
    const onScroll = () => {
      sessionStorage.setItem(STORAGE_PREFIX + key, String(window.scrollY));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [key]);

  // popstate only fires for browser Back/Forward, never for <Link>
  // clicks or router.push — so it's a reliable way to tell them apart.
  useEffect(() => {
    const onPopState = () => {
      isPopNavigation.current = true;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (isPopNavigation.current) {
      isPopNavigation.current = false;
      const saved = sessionStorage.getItem(STORAGE_PREFIX + key);
      if (saved !== null) {
        const targetY = parseInt(saved, 10);
        // Don't scroll immediately — the route's real content (product
        // grids etc.) may not have painted at full height yet. Wait two
        // animation frames so layout has settled, then try. If the page
        // is still shorter than the target (content still streaming
        // in), retry a couple more times.
        let attempts = 0;
        const tryScroll = () => {
          attempts += 1;
          window.scrollTo(0, targetY);
          const closeEnough = Math.abs(window.scrollY - targetY) < 4;
          if (!closeEnough && attempts < 6) {
            setTimeout(() => requestAnimationFrame(tryScroll), 60);
          }
        };
        requestAnimationFrame(() => requestAnimationFrame(tryScroll));
      }
      return;
    }
    // Normal forward navigation — start the new page at the top.
    window.scrollTo(0, 0);
  }, [key]);

  return null;
}

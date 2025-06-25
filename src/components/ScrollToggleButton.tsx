import React, { useState, useEffect } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

interface ScrollToggleButtonProps {
  /** Optional container to scroll; defaults to page */
  containerSelector?: string;
  /** Offset from bottom */
  offset?: number;
}

const ScrollToggleButton: React.FC<ScrollToggleButtonProps> = ({
  containerSelector,
  offset = 0,
}) => {
  const [atBottom, setAtBottom] = useState(false);

  // Helper to get scroll container
  const getContainer = (): HTMLElement => {
    return (
      ((containerSelector
        ? document.querySelector<HTMLElement>(containerSelector)
        : document.scrollingElement) as HTMLElement) || document.documentElement
    );
  };

  // Check scroll position: prioritize top state
  const checkPosition = () => {
    const el = getContainer();
    const scrollTop = el.scrollTop;
    const clientHeight = el.clientHeight;
    const scrollHeight = el.scrollHeight;

    // If at top, always treat as not bottom
    if (scrollTop === 0) {
      setAtBottom(false);
      return;
    }
    // Otherwise, detect bottom
    const isBottom = scrollTop + clientHeight >= scrollHeight - offset - 1;
    setAtBottom(isBottom);
  };

  useEffect(() => {
    // Initial delayed check to ensure content loaded
    const rafId = requestAnimationFrame(checkPosition);

    const el = getContainer();
    const onScroll = () => checkPosition();

    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(rafId);
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [containerSelector, offset]);

  const handleClick = () => {
    const el = getContainer();
    if (atBottom) {
      el.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      el.scrollTo({ top: el.scrollHeight - offset, behavior: "smooth" });
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`absolute w-fit h-fit ${
        atBottom ? "bottom-6" : "top-0"
      } right-0 m-2 z-50 p-1 bg-white border-2 border-gray-600 rounded-full transition-transform transform hover:scale-110 cursor-pointer`}
      aria-label={atBottom ? "Scroll to top" : "Scroll to bottom"}
    >
      {atBottom ? (
        <ArrowUp className="w-6 h-6 text-gray-600" />
      ) : (
        <ArrowDown className="w-6 h-6 text-gray-600" />
      )}
    </button>
  );
};

export default ScrollToggleButton;

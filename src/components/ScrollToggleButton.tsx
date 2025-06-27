import React, { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

interface ScrollToggleButtonProps {
  containerSelector?: string;
  offset?: number;
}

const ScrollToggleButton: React.FC<ScrollToggleButtonProps> = ({
  containerSelector,
  offset = 0,
}) => {
  const [atBottom, setAtBottom] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const containerRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLElement | null>(null);

  const getContainer = () => {
    const container =
      (containerSelector
        ? document.querySelector<HTMLElement>(containerSelector)
        : document.scrollingElement) || document.documentElement;
    return container;
  };

  const checkScrollStatus = () => {
    const el = containerRef.current;
    if (!el) return;

    const scrollTop = el.scrollTop;
    const clientHeight = el.clientHeight;
    const scrollHeight = el.scrollHeight;

    setIsOverflowing(scrollHeight > clientHeight + 1);

    if (scrollTop === 0) {
      setAtBottom(false);
      return;
    }

    setAtBottom(scrollTop + clientHeight >= scrollHeight - offset - 1);
  };

  useEffect(() => {
    const el = getContainer();
    if (!el) return;

    containerRef.current = el as HTMLElement;

    // Try to get the first scrollable child as content reference
    contentRef.current = el.querySelector(":scope > *") as HTMLElement;

    // Setup scroll and resize listeners
    el.addEventListener("scroll", checkScrollStatus, { passive: true });
    window.addEventListener("resize", checkScrollStatus);

    // Observe changes in container size
    const resizeObserver = new ResizeObserver(checkScrollStatus);
    resizeObserver.observe(el);

    // Observe DOM mutations in content
    const mutationObserver = new MutationObserver(checkScrollStatus);
    if (contentRef.current) {
      mutationObserver.observe(contentRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });
    }

    // Initial check
    requestAnimationFrame(checkScrollStatus);

    return () => {
      el.removeEventListener("scroll", checkScrollStatus);
      window.removeEventListener("resize", checkScrollStatus);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [containerSelector, offset]);

  const handleClick = () => {
    const el = containerRef.current;
    if (!el) return;

    if (atBottom) {
      el.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      el.scrollTo({ top: el.scrollHeight - offset, behavior: "smooth" });
    }
  };

  if (!isOverflowing) return null;

  return (
    <button
      onClick={handleClick}
      className={`absolute w-fit h-fit ${
        atBottom ? "bottom-6" : "top-0"
      } right-0 m-2 z-50 p-1 bg-white border-2 border-gray-600 rounded-full transition-transform transform hover:scale-110 cursor-pointer`}
      aria-label={atBottom ? "Scroll to top" : "Scroll to bottom"}
    >
      {atBottom ? (
        <ArrowUp className="w-4 h-4 text-gray-600" />
      ) : (
        <ArrowDown className="w-4 h-4 text-gray-600" />
      )}
    </button>
  );
};

export default ScrollToggleButton;

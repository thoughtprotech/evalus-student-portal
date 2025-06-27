import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface ScrollXToggleButtonProps {
  containerSelector?: string;
  offset?: number;
}

const ScrollXToggleButton: React.FC<ScrollXToggleButtonProps> = ({
  containerSelector,
  offset = 0,
}) => {
  const [atRight, setAtRight] = useState(false);
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

    const scrollLeft = el.scrollLeft;
    const clientWidth = el.clientWidth;
    const scrollWidth = el.scrollWidth;

    setIsOverflowing(scrollWidth > clientWidth + 1);
    setAtRight(scrollLeft + clientWidth >= scrollWidth - offset - 1);
  };

  useEffect(() => {
    const el = getContainer();
    if (!el) return;

    containerRef.current = el as HTMLElement;
    contentRef.current = el.querySelector(":scope > *") as HTMLElement;

    el.addEventListener("scroll", checkScrollStatus, { passive: true });
    window.addEventListener("resize", checkScrollStatus);

    const resizeObserver = new ResizeObserver(checkScrollStatus);
    resizeObserver.observe(el);

    const mutationObserver = new MutationObserver(checkScrollStatus);
    if (contentRef.current) {
      mutationObserver.observe(contentRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });
    }

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

    if (atRight) {
      el.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      el.scrollTo({ left: el.scrollWidth - offset, behavior: "smooth" });
    }
  };

  if (!isOverflowing) return null;

  return (
    <button
      onClick={handleClick}
      className={`absolute h-fit w-fit bottom-10 ${
        atRight ? "right-6" : "left-0"
      } m-2 z-50 p-1 bg-white border-2 border-gray-600 rounded-full transition-transform transform hover:scale-110 cursor-pointer`}
      aria-label={atRight ? "Scroll to start" : "Scroll to end"}
    >
      {atRight ? (
        <ArrowLeft className="w-6 h-6 text-gray-600" />
      ) : (
        <ArrowRight className="w-6 h-6 text-gray-600" />
      )}
    </button>
  );
};

export default ScrollXToggleButton;

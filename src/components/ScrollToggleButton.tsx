import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const ScrollToggleButton: React.FC = () => {
  const [atBottom, setAtBottom] = useState(false);

  // Check if we're at the bottom of the page
  const checkScrollPosition = () => {
    const scrollY = window.scrollY || window.pageYOffset;
    const viewportHeight = window.innerHeight;
    const fullHeight = document.documentElement.scrollHeight;
    // threshold of 50px to consider bottom
    setAtBottom(scrollY + viewportHeight >= fullHeight - 50);
  };

  useEffect(() => {
    // initial check
    checkScrollPosition();
    // listen to scroll events
    window.addEventListener("scroll", checkScrollPosition);
    return () => window.removeEventListener("scroll", checkScrollPosition);
  }, []);

  const handleClick = () => {
    if (atBottom) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  return (
    <button
      onClick={handleClick}
      className="absolute bottom-4 right-4 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-opacity duration-300 opacity-80 hover:opacity-100 cursor-pointer"
      aria-label={atBottom ? "Scroll to top" : "Scroll to bottom"}
    >
      {atBottom ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
    </button>
  );
};

export default ScrollToggleButton;

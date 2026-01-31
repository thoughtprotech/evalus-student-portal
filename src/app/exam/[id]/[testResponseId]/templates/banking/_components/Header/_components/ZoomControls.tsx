import React, { useState, useEffect } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";

const PageZoomControl: React.FC = () => {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    // Apply zoom to the entire document body
    document.body.style.zoom = String(zoom);
    // For other browsers, can use CSS transform as fallback if needed
  }, [zoom]);

  const zoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 3)); // max zoom 3x
  };

  const zoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5)); // min zoom 0.5x
  };

  return (
    <div className="flex space-x-2 z-50">
      <button
        onClick={zoomIn}
        className="px-2 bg-[#3973B7] text-white hover:bg-blue-700 transition flex items-center gap-2 text-sm"
        aria-label="Zoom In"
      >
        <h1>Zoom (+)</h1>
      </button>
      <button
        onClick={zoomOut}
        className="px-2 bg-[#3973B7] text-white hover:bg-blue-700 transition flex items-center gap-2 text-sm"
        aria-label="Zoom Out"
      >
        <h1>Zoom (-)</h1>
      </button>
    </div>
  );
};

export default PageZoomControl;

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
    <div className="flex space-x-2 bg-white rounded shadow-lg z-50">
      <button
        onClick={zoomIn}
        className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center gap-2"
        aria-label="Zoom In"
      >
        <h1>Zoom (+)</h1>
        <ZoomIn size={20} />
      </button>
      <button
        onClick={zoomOut}
        className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center gap-2"
        aria-label="Zoom Out"
      >
        <h1>Zoom (-)</h1>
        <ZoomOut size={20} />
      </button>
    </div>
  );
};

export default PageZoomControl;

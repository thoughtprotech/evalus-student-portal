import { useState, useEffect } from "react";
import CountdownTimer from "@/components/CountdownTimer";
import { Info, ShieldQuestion, ZoomIn, ZoomOut } from "lucide-react";

interface HeaderProps {
  setShowQuestionsModal: (open: boolean) => void;
  setShowInstructionsModal: (open: boolean) => void;
}

export default function Header({
  setShowQuestionsModal,
  setShowInstructionsModal,
}: HeaderProps) {
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.1, 0.5));
  };

  useEffect(() => {
    // Apply zoom to the root element
    document.documentElement.style.zoom = `${zoomLevel}`;
  }, [zoomLevel]);

  const handleTimeout = async () => {
    // TODO: implement timeout behavior
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-md p-4">
      <div className="mx-auto flex items-center justify-between">
        {/* Left: Title & Zoom Controls */}
        <div className="flex items-center space-x-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">
              SSC Mock Test
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleZoomIn}
              className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
              aria-label="Zoom In"
            >
              <ZoomIn className="w-5 h-5 text-gray-600 cursor-pointer" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-5 h-5 text-gray-600 cursor-pointer" />
            </button>
          </div>
        </div>

        {/* Center: Test Info */}
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-800">
            SSC Online Mock Test
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Roll No:{" "}
            <span className="font-medium text-gray-700">12344 [John Doe]</span>
          </p>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-6 text-gray-600 text-sm">
          <div className="flex flex-col items-center p-2 whitespace-nowrap">
            <h1 className="font-bold text-gray-600 text-xs">Time Left:</h1>
            <CountdownTimer
              initialTime="00:05:00"
              onComplete={handleTimeout}
              className="text-sm text-black"
            />
          </div>

          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 md:w-12 md:h-12 bg-gray-100 text-gray-800 rounded-full flex items-center justify-center font-bold text-xl shadow-inner">
              U
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-800">
                Welcome John Doe
              </h1>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

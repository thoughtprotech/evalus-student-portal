import { LoaderPinwheel } from "lucide-react";

export default function Loader() {
  return (
    <div className="w-full h-[80vh] flex items-center justify-center">
      <LoaderPinwheel className="w-10 h-10 animate-spin text-indigo-500" />
    </div>
  );
}

import { useEffect } from "react";
import { setExamMode } from "@/components/AutoLogout";

/**
 * Custom hook to automatically manage exam mode during component lifecycle
 * This prevents auto-logout during exam scenarios
 */
export const useExamMode = () => {
    useEffect(() => {
        console.log("🎯 useExamMode: Component mounted - activating exam mode");
        // Set exam mode when component mounts
        setExamMode(true);

        // Clear exam mode when component unmounts
        return () => {
            console.log("🎯 useExamMode: Component unmounting - deactivating exam mode");
            setExamMode(false);
        };
    }, []);
};

export default useExamMode;
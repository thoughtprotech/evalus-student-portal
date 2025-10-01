import { useEffect } from "react";
import { setExamMode } from "@/components/AutoLogout";

/**
 * Custom hook to automatically manage exam mode during component lifecycle
 * This prevents auto-logout during exam scenarios
 */
export const useExamMode = () => {
    useEffect(() => {
        // Only run on client-side
        if (typeof window === 'undefined') return;

        console.log("useExamMode: Activating exam mode to prevent auto-logout");

        // Set exam mode when component mounts
        setExamMode(true);

        // Clear exam mode when component unmounts
        return () => {
            console.log("useExamMode: Deactivating exam mode");
            setExamMode(false);
        };
    }, []);
};

export default useExamMode;
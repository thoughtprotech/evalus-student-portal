"use client";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/app/actions/authentication/logout";

// Storage keys (matching AutoLogout.tsx)
const SESSION_STATE_KEY = "__evalus_session_state";
const LOGOUT_TRIGGER_KEY = "__evalus_logout_trigger";

const SESSION_STATES = {
    ACTIVE: 'active',
    LOGGED_OUT: 'logged_out',
    EXPIRED: 'expired'
} as const;

/**
 * Hook for components to trigger manual logout across all tabs
 * This ensures consistent logout behavior throughout the application
 */
export function useAutoLogout() {
    const router = useRouter();

    const triggerLogout = useCallback(async (reason: string = 'manual') => {
        console.log(`🚪 Manual logout triggered: ${reason}`);

        try {
            // Set logout state immediately to inform all tabs
            localStorage.setItem(SESSION_STATE_KEY, SESSION_STATES.LOGGED_OUT);

            // Trigger logout across all tabs
            const trigger = {
                timestamp: Date.now(),
                reason,
                tabId: Math.random().toString(36).substr(2, 9)
            };
            localStorage.setItem(LOGOUT_TRIGGER_KEY, JSON.stringify(trigger));

            // Call logout action
            await logoutAction();

            // Navigate to login page
            router.push("/");
        } catch (e) {
            console.error("Manual logout error:", e);
            // Even if logout action fails, redirect to login
            router.push("/");
        }
    }, [router]);

    const getSessionState = useCallback(() => {
        try {
            const state = localStorage.getItem(SESSION_STATE_KEY);
            return state || SESSION_STATES.ACTIVE;
        } catch {
            return SESSION_STATES.ACTIVE;
        }
    }, []);

    const isSessionActive = useCallback(() => {
        return getSessionState() === SESSION_STATES.ACTIVE;
    }, [getSessionState]);

    return {
        triggerLogout,
        getSessionState,
        isSessionActive,
        SESSION_STATES
    };
}
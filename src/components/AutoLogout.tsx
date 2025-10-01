"use client";
import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/app/actions/authentication/logout";

// AutoLogout: logs out user after inactivity or when tab/browser is closed.
// - Idle timeout: 10 minutes (600_000 ms)
// - Uses navigator.sendBeacon, fetch keepalive, and a synchronous XHR fallback for unload.
// - Paused during exam scenarios to prevent accidental logout

const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const LAST_ACTIVITY_KEY = "__evalus_last_activity";
const EXAM_MODE_KEY = "__evalus_exam_mode";

// Cross-tab logout synchronization keys (matching useAutoLogout.ts)
const SESSION_STATE_KEY = "__evalus_session_state";
const LOGOUT_TRIGGER_KEY = "__evalus_logout_trigger";

// Utility functions for managing exam mode
export const setExamMode = (active: boolean) => {
    try {
        if (active) {
            localStorage.setItem(EXAM_MODE_KEY, "true");
        } else {
            localStorage.removeItem(EXAM_MODE_KEY);
        }
    } catch (e) {
        console.warn("Could not manage exam mode:", e);
    }
};

export const isExamModeActive = () => {
    try {
        const active = localStorage.getItem(EXAM_MODE_KEY) === 'true';
        return active;
    } catch {
        return false;
    }
};

export default function AutoLogout() {
    const timerRef = useRef<number | null>(null);
    const router = useRouter();

    const isExamMode = useCallback(() => {
        try {
            return localStorage.getItem(EXAM_MODE_KEY) === 'true';
        } catch {
            return false;
        }
    }, []);

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const startTimer = useCallback(() => {
        clearTimer();
        // set last activity timestamp
        try {
            localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
        } catch { }

        // Don't start logout timer during exam mode
        if (isExamMode()) {
            console.log("⏱️ Timer not started - Exam mode active");
            return;
        }

        console.log("⏱️ Starting 10-minute logout timer");

        // start idle countdown
        // @ts-ignore DOM setTimeout returns number in browser
        timerRef.current = window.setTimeout(async () => {
            // Double check exam mode before logging out
            if (isExamMode()) {
                console.log("⏰ Timer fired but exam in progress - logout blocked");
                return;
            }
            console.log("⏰ Idle timeout - logging out");
            try {
                const res = await logoutAction();
                if (res.status === 200) {
                    router.push("/");
                } else {
                    router.push("/");
                }
            } catch (e) {
                router.push("/");
            }
        }, IDLE_TIMEOUT);
    }, [clearTimer, router, isExamMode]);

    useEffect(() => {
        // helper to send logout request during unload or when browser closes
        const doBeaconLogout = () => {
            // Don't logout if exam is in progress
            if (isExamMode()) {
                console.log("🚫 Logout blocked - Exam in progress");
                return;
            }
            console.log("📤 Sending logout beacon");
            try {
                const url = "/api/auth/logout";
                const payload = JSON.stringify({ username: null });

                // Use sendBeacon (most reliable for page unload)
                if (navigator?.sendBeacon) {
                    const blob = new Blob([payload], { type: "application/json" });
                    navigator.sendBeacon(url, blob);
                    return;
                }

                // Fallback to fetch with keepalive
                if (typeof fetch === "function") {
                    fetch(url, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: payload,
                        keepalive: true,
                    }).catch(() => { });
                }
            } catch (e) {
                // ignore
            }
        };

        // Listen for cross-tab logout events
        const handleStorageChange = (e: StorageEvent) => {
            // Handle logout trigger from other tabs
            if (e.key === LOGOUT_TRIGGER_KEY && e.newValue) {
                try {
                    const trigger = JSON.parse(e.newValue);
                    console.log("🔄 Cross-tab logout triggered:", trigger.reason);
                    clearTimer();
                    router.push("/");
                } catch (err) {
                    console.warn("Failed to parse logout trigger:", err);
                }
            }

            // Handle session state changes from other tabs
            if (e.key === SESSION_STATE_KEY && e.newValue === 'logged_out') {
                console.log("🔄 Session marked as logged out from another tab");
                clearTimer();
                router.push("/");
            }
        };

        // Check if user was idle before page reload/reopen
        try {
            const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
            if (raw) {
                const ts = Number(raw);
                if (!Number.isNaN(ts)) {
                    const age = Date.now() - ts;
                    if (age >= IDLE_TIMEOUT && !isExamMode()) {
                        // User was idle before reload - logout immediately
                        doBeaconLogout();
                        logoutAction().catch(() => { });
                        router.push("/");
                        return;
                    }
                }
            }
        } catch { }

        startTimer();

        const events = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"];

        const onActivity = () => {
            try {
                localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
            } catch { }
            startTimer();
        };

        events.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));

        const onPageHide = () => {
            // Only logout if not in exam mode
            if (!isExamMode()) {
                doBeaconLogout();
            }
        };

        const onBeforeUnload = () => {
            // Only logout if not in exam mode
            if (!isExamMode()) {
                doBeaconLogout();
            }
        };

        window.addEventListener("pagehide", onPageHide, { passive: true });
        window.addEventListener("beforeunload", onBeforeUnload);
        window.addEventListener("storage", handleStorageChange);

        return () => {
            clearTimer();
            events.forEach((ev) => window.removeEventListener(ev, onActivity));
            window.removeEventListener("pagehide", onPageHide);
            window.removeEventListener("beforeunload", onBeforeUnload);
            window.removeEventListener("storage", handleStorageChange);
        };
    }, [startTimer, clearTimer, router]);

    return null;
}

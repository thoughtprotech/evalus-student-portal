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

        const onVisibilityChange = () => {
            // Don't logout on visibility change if exam is in progress
            if (document.visibilityState === "hidden" && !isExamMode()) {
                // Don't logout immediately when tab becomes hidden
                // This can happen when minimizing browser window, which is not the same as switching tabs
                // Only logout after a delay to distinguish between minimize/maximize vs actual tab switch
                console.log("👁️ Tab hidden - starting delayed logout check");

                // Set a timeout to check if the tab is still hidden after a delay
                setTimeout(() => {
                    // If still hidden after delay and not in exam mode, then likely a real tab switch
                    if (document.visibilityState === "hidden" && !isExamMode()) {
                        console.log("👁️ Tab still hidden after delay - logging out");
                        doBeaconLogout();
                    } else {
                        console.log("👁️ Tab became visible again - logout cancelled");
                    }
                }, 2000); // 2 second delay to allow for minimize/maximize cycles
            } else if (document.visibilityState === "hidden") {
                console.log("👁️ Tab hidden but exam in progress - logout blocked");
            }
        };

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

        document.addEventListener("visibilitychange", onVisibilityChange);
        window.addEventListener("pagehide", onPageHide, { passive: true });
        window.addEventListener("beforeunload", onBeforeUnload);

        return () => {
            clearTimer();
            events.forEach((ev) => window.removeEventListener(ev, onActivity));
            document.removeEventListener("visibilitychange", onVisibilityChange);
            window.removeEventListener("pagehide", onPageHide);
            window.removeEventListener("beforeunload", onBeforeUnload);
        };
    }, [startTimer, clearTimer, router]);

    return null;
}

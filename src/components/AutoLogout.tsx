"use client";
import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/app/actions/authentication/logout";

// AutoLogout: logs out user after inactivity or when tab/window is closed.
// - Idle timeout: 10 minutes (600_000 ms)
// - On pagehide/unload/visibilitychange -> attempts navigator.sendBeacon to /api/auth/logout

const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes

export default function AutoLogout() {
    const timerRef = useRef<number | null>(null);
    const router = useRouter();

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const startTimer = useCallback(() => {
        clearTimer();
        // @ts-ignore - window.setTimeout returns number
        timerRef.current = window.setTimeout(async () => {
            // perform logout via server action (Next.js server action)
            try {
                const res = await logoutAction();
                if (res.status === 200) {
                    router.push("/");
                }
            } catch (e) {
                // fallback: navigate to login
                router.push("/");
            }
        }, IDLE_TIMEOUT);
    }, [clearTimer, router]);

    useEffect(() => {
        startTimer();

        const activityEvents = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"];

        const onActivity = () => startTimer();

        activityEvents.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));

        // When the page is hidden or unloaded, attempt a logout using sendBeacon so it fires even when page is closing.
        const doBeaconLogout = () => {
            try {
                const url = "/api/auth/logout";
                const data = new Blob([JSON.stringify({ username: null })], { type: "application/json" });
                if (navigator.sendBeacon) {
                    navigator.sendBeacon(url, data);
                } else {
                    // fallback synchronous XHR (rare modern browsers)
                    const xhr = new XMLHttpRequest();
                    xhr.open("POST", url, false);
                    xhr.setRequestHeader("Content-Type", "application/json");
                    try {
                        xhr.send(JSON.stringify({ username: null }));
                    } catch { }
                }
            } catch (e) {
                // ignore failures
            }
        };

        const onVisibilityChange = () => {
            if (document.visibilityState === "hidden") {
                doBeaconLogout();
            }
        };

        const onPageHide = () => doBeaconLogout();

        document.addEventListener("visibilitychange", onVisibilityChange);
        window.addEventListener("pagehide", onPageHide);
        window.addEventListener("beforeunload", doBeaconLogout);

        return () => {
            clearTimer();
            activityEvents.forEach((ev) => window.removeEventListener(ev, onActivity));
            document.removeEventListener("visibilitychange", onVisibilityChange);
            window.removeEventListener("pagehide", onPageHide);
            window.removeEventListener("beforeunload", doBeaconLogout);
        };
    }, [startTimer, clearTimer]);

    return null;
}

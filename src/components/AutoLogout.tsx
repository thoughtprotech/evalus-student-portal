"use client";
import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/app/actions/authentication/logout";

// AutoLogout: logs out user after inactivity or when tab/browser is closed.
// - Idle timeout: 10 minutes (600_000 ms)
// - Uses navigator.sendBeacon, fetch keepalive, and a synchronous XHR fallback for unload.

const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const LAST_ACTIVITY_KEY = "__evalus_last_activity";

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
        // set last activity timestamp
        try {
            localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
        } catch { }

        // start idle countdown
        // @ts-ignore DOM setTimeout returns number in browser
        timerRef.current = window.setTimeout(async () => {
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
    }, [clearTimer, router]);

    useEffect(() => {
        // helper to send logout request during unload or when browser closes
        const doBeaconLogout = () => {
            try {
                const url = "/api/auth/logout";
                const payload = JSON.stringify({ username: null });

                // prefer sendBeacon
                if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
                    try {
                        const blob = new Blob([payload], { type: "application/json" });
                        navigator.sendBeacon(url, blob);
                        return;
                    } catch { }
                }

                // try fetch keepalive
                if (typeof fetch === "function") {
                    try {
                        fetch(url, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: payload,
                            keepalive: true,
                        }).catch(() => { });
                        return;
                    } catch { }
                }

                // last resort: synchronous XHR
                try {
                    const xhr = new XMLHttpRequest();
                    xhr.open("POST", url, false);
                    xhr.setRequestHeader("Content-Type", "application/json");
                    xhr.send(payload);
                } catch { }
            } catch (e) {
                // ignore
            }
        };

        // On mount check persisted last activity to detect full browser close + reopen
        try {
            const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
            if (raw) {
                const ts = Number(raw);
                if (!Number.isNaN(ts)) {
                    const age = Date.now() - ts;
                    if (age >= IDLE_TIMEOUT) {
                        // last activity older than threshold -> force logout immediately
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
            if (document.visibilityState === "hidden") doBeaconLogout();
        };

        const onPageHide = () => doBeaconLogout();

        document.addEventListener("visibilitychange", onVisibilityChange);
        window.addEventListener("pagehide", onPageHide, { passive: true });
        window.addEventListener("beforeunload", doBeaconLogout);

        return () => {
            clearTimer();
            events.forEach((ev) => window.removeEventListener(ev, onActivity));
            document.removeEventListener("visibilitychange", onVisibilityChange);
            window.removeEventListener("pagehide", onPageHide);
            window.removeEventListener("beforeunload", doBeaconLogout);
        };
    }, [startTimer, clearTimer, router]);

    return null;
}

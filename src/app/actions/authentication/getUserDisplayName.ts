"use server";

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { env } from "@/utils/env";

export async function getUserDisplayNameAction(): Promise<{
    username: string;
    displayName: string;
    userPhoto?: string | null;
    candidateId?: number | null;
} | null> {
    try {
        const token = (await cookies()).get("token")?.value;
        if (!token) {
            console.log("No token found");
            return null;
        }

        const decoded = jwt.decode(token) as any;
        const username = decoded?.userName;
        if (!username) {
            console.log("No username in token");
            return null;
        }

        console.log("Fetching display name for user:", username);

        // Fetch user data from API to get displayName, userPhoto, and candidateId
        try {
            const { API_BASE_URL: baseUrl } = env;
            console.log("API Base URL:", baseUrl);

            const res = await fetch(`${baseUrl}/api/Users/${username}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                // Add timeout to prevent hanging
                signal: AbortSignal.timeout(10000)
            });

            console.log("API response status:", res.status);

            if (res.ok) {
                const data = await res.json();
                console.log("API response data:", data);

                // Try different paths where displayName might be stored
                const displayName =
                    data?.user?.displayName ||
                    data?.candidateRegistration?.displayName ||
                    data?.displayName ||
                    data?.user?.DisplayName ||
                    data?.candidateRegistration?.DisplayName ||
                    username; // fallback to username

                // Try different paths where userPhoto might be stored
                const userPhoto =
                    data?.user?.userPhoto ||
                    data?.candidateRegistration?.userPhoto ||
                    data?.userPhoto ||
                    data?.user?.IUserPhoto ||
                    data?.candidateRegistration?.IUserPhoto ||
                    null;

                // Try different paths where candidateId might be stored
                const candidateId =
                    data?.user?.candidateId ||
                    data?.candidateRegistration?.candidateId ||
                    data?.candidateId ||
                    data?.user?.CandidateID ||
                    data?.candidateRegistration?.CandidateID ||
                    data?.user?.CandidateId ||
                    data?.candidateRegistration?.CandidateId ||
                    null;

                return {
                    username,
                    displayName,
                    userPhoto,
                    candidateId: candidateId ? Number(candidateId) : null
                };
            }
        } catch (apiError) {
            console.error("Error fetching user data from API:", apiError);
        }

        // Fallback: return username as displayName
        console.log("Falling back to username as displayName");
        return {
            username,
            displayName: username,
            userPhoto: null,
            candidateId: null
        };

    } catch (error) {
        console.error("Error in getUserDisplayNameAction:", error);
        return null;
    }
}
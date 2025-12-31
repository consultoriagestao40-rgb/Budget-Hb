import { Google } from "arctic";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";

if (!clientId || !clientSecret) {
    console.error("CRITICAL: Missig GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables.");
}

export const google = new Google(
    clientId,
    clientSecret,
    `${baseUrl}/api/oauth/google/callback`
);

import { generateState, generateCodeVerifier } from "arctic";
import { google } from "@/lib/google";
import { cookies } from "next/headers";

export async function GET(request: Request): Promise<Response> {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const url = await google.createAuthorizationURL(state, codeVerifier, ["profile", "email"]);

    const host = request.headers.get("host") ?? "";
    const isProductionDomain = host.includes("budgethub.com.br");
    const cookieDomain = isProductionDomain ? ".budgethub.com.br" : undefined;

    const cookieStore = await cookies();
    cookieStore.set("google_oauth_state", state, {
        path: "/",
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 60 * 10, // 10 minutes
        sameSite: "lax",
        domain: cookieDomain
    });
    cookieStore.set("google_oauth_code_verifier", codeVerifier, {
        path: "/",
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 60 * 10, // 10 minutes
        sameSite: "lax",
        domain: cookieDomain
    });

    return Response.redirect(url);
}

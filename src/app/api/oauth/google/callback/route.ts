import { google } from "@/lib/google";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { redirect } from "next/navigation";

export async function GET(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const cookieStore = await cookies();
    const storedState = cookieStore.get("google_oauth_state")?.value ?? null;
    const storedCodeVerifier = cookieStore.get("google_oauth_code_verifier")?.value ?? null;

    if (!code || !state || !storedState || !storedCodeVerifier || state !== storedState) {
        console.error("OAuth 400 Error Details:", {
            hasCode: !!code,
            hasState: !!state,
            hasStoredState: !!storedState,
            hasStoredVerifier: !!storedCodeVerifier,
            stateMatch: state === storedState,
            cookieState: storedState,
            paramState: state
        });
        return new Response(null, {
            status: 400
        });
    }

    try {
        const tokens = await google.validateAuthorizationCode(code, storedCodeVerifier);
        const accessToken = tokens.accessToken();

        const googleUserResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        const googleUser = await googleUserResponse.json();

        // 1. Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email: googleUser.email }
        });

        let userId = "";
        let tenantId = "";
        let role = "USER";
        let userName = googleUser.name;

        if (existingUser) {
            // Update Google ID if not present
            if (!existingUser.googleId) {
                await prisma.user.update({
                    where: { id: existingUser.id },
                    data: { googleId: googleUser.id }
                });
            }
            userId = existingUser.id;
            tenantId = existingUser.tenantId;
            tenantId = existingUser.tenantId;
            role = googleUser.email === 'consultoria.gestao4.0@gmail.com' ? 'SUPER_ADMIN' : existingUser.role;
            userName = existingUser.name;

            // Force update role in DB if it should be Super Admin but isn't
            if (googleUser.email === 'consultoria.gestao4.0@gmail.com' && existingUser.role !== 'SUPER_ADMIN') {
                await prisma.user.update({
                    where: { id: existingUser.id },
                    data: { role: 'SUPER_ADMIN' }
                });
            }
        } else {
            // New User -> Create Tenant + User
            const newTenant = await prisma.tenant.create({
                data: {
                    name: `Empresa de ${googleUser.name}`,
                    ownerName: googleUser.name,
                    ownerEmail: googleUser.email,
                    plan: 'FREE',
                    users: {
                        create: {
                            email: googleUser.email,
                            name: googleUser.name,
                            password: '', // No password for OAuth users
                            role: googleUser.email === 'consultoria.gestao4.0@gmail.com' ? 'SUPER_ADMIN' : 'ADMIN', // First user is Admin, specific email is Super Admin
                            googleId: googleUser.id
                        }
                    },
                    // Create default Budget Version
                    budgetVersions: {
                        create: {
                            name: 'Orçamento 2024 (Inicial)'
                        }
                    }
                },
                include: {
                    users: true
                }
            });
            const newUser = newTenant.users[0];
            userId = newUser.id;
            tenantId = newUser.tenantId;
            role = newUser.role;
        }

        // Create Session
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        session.isLoggedIn = true;
        session.userId = userId;
        session.email = googleUser.email;
        session.name = userName;
        session.tenantId = tenantId;
        session.role = role as any;
        await session.save();

        return new Response(null, {
            status: 302,
            headers: {
                Location: "/dashboard"
            }
        });
    } catch (e) {
        console.error(e);
        // If error, redirect to login with error
        return new Response(null, {
            status: 302,
            headers: {
                Location: "/login?error=auth_failed"
            }
        });
    }
}

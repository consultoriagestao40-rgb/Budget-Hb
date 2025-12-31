export type SessionData = {
    isLoggedIn: boolean
    userId: string
    email: string
    name: string
    tenantId: string
    role: string
    mustChangePassword?: boolean
}

export const sessionOptions = {
    password: 'complex_password_at_least_32_characters_long',
    cookieName: 'budget-hub-session',
    cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
    },
}

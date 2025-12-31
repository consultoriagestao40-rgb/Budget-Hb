import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'

export async function middleware(req: NextRequest) {
    const res = NextResponse.next()
    const session = await getIronSession<SessionData>(req, res, sessionOptions)

    const { isLoggedIn } = session

    // If trying to access dashboard but not logged in
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
        if (!isLoggedIn) {
            return NextResponse.redirect(new URL('/login', req.url))
        }
    }

    // If trying to access login but already logged in
    if (req.nextUrl.pathname.startsWith('/login')) {
        if (isLoggedIn) {
            return NextResponse.redirect(new URL('/dashboard/dre', req.url))
        }
    }

    return res
}

export const config = {
    matcher: ['/dashboard/:path*', '/login'],
}

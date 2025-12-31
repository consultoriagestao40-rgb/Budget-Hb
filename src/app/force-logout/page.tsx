'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ForceLogoutPage() {
    const router = useRouter()

    useEffect(() => {
        // Clear all cookies
        document.cookie.split(";").forEach((c) => {
            document.cookie = c
                .replace(/^ +/, "")
                .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });

        // Clear localStorage
        localStorage.clear()

        // Clear sessionStorage
        sessionStorage.clear()

        // Redirect to login after 1 second
        setTimeout(() => {
            window.location.href = '/login'
        }, 1000)
    }, [])

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: 'var(--bg-main)',
            color: 'var(--text-primary)',
            fontFamily: 'system-ui'
        }}>
            <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄 Limpando sessão...</h1>
                <p>Você será redirecionado para o login em instantes.</p>
            </div>
        </div>
    )
}

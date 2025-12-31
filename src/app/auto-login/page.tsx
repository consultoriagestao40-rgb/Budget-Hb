'use client'

import { useEffect, useState } from 'react'
import { forceLogin } from '../actions/auth'

export default function AutoLoginPage() {
    const [status, setStatus] = useState('Fazendo login automático...')

    useEffect(() => {
        async function doLogin() {
            try {
                await forceLogin()
                setStatus('Login realizado! Redirecionando...')
            } catch (error: any) {
                setStatus(`Erro: ${error.message}`)
            }
        }
        doLogin()
    }, [])

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: '#0a1929',
            color: '#fff',
            fontFamily: 'system-ui',
            flexDirection: 'column',
            gap: '1rem'
        }}>
            <h1 style={{ fontSize: '2rem' }}>🔐 Auto Login</h1>
            <p>{status}</p>
        </div>
    )
}

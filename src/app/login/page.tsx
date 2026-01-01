'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useState, Suspense } from 'react'
import { login } from '@/app/actions/auth'
import { useSearchParams } from 'next/navigation'

const initialState = {
    error: '',
}

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <button type="submit" disabled={pending} className="w-full btn btn-primary py-2 mt-4 disabled:opacity-50">
            {pending ? 'Entrando...' : 'Entrar'}
        </button>
    )
}

function LoginForm() {
    const searchParams = useSearchParams()
    const urlError = searchParams.get('error')

    // Auto-translate common error codes
    const getErrorMessage = (code: string | null) => {
        if (!code) return ''
        if (code === 'auth_failed') return 'Falha na autenticação via Google.'
        if (code === 'auth_error_state_mismatch') return 'Sessão espirada. Tente novamente.'
        return 'Ocorreu um erro. Tente novamente.'
    }

    const [showForgot, setShowForgot] = useState(false)
    const [state, formAction] = useFormState(async (prevState: any, formData: FormData) => {
        const result = await login(formData)
        if (result?.error) {
            return { error: result.error }
        }
        return prevState
    }, { error: getErrorMessage(urlError) })

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
            <div className="card w-full max-w-md p-8 shadow-xl">
                <h1 className="text-2xl font-bold mb-6 text-center text-[var(--text-primary)]">Budget Hub</h1>

                {state.error && (
                    <div className="p-3 mb-4 text-sm text-red-500 bg-red-100 rounded border border-red-200">
                        {state.error}
                    </div>
                )}

                <form action={formAction} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Email</label>
                        <input
                            name="email"
                            type="email"
                            required
                            className="w-full p-2 rounded border border-[var(--border-subtle)] bg-[var(--bg-secondary)]"
                            placeholder="admin@demo.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Senha</label>
                        <input
                            name="password"
                            type="password"
                            required
                            className="w-full p-2 rounded border border-[var(--border-subtle)] bg-[var(--bg-secondary)]"
                            placeholder="password123"
                        />
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={() => setShowForgot(true)}
                            className="text-sm text-blue-500 hover:text-blue-400 hover:underline"
                        >
                            Esqueci minha senha
                        </button>
                    </div>

                    <SubmitButton />

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-[var(--border-subtle)]"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-[var(--bg-surface)] text-[var(--text-secondary)]">Ou continue com</span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <a
                                href="/api/oauth/google"
                                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-[var(--border-subtle)] rounded-lg text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-main)] transition-colors"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                Entrar com Google
                            </a>
                        </div>
                    </div>

                    <div className="text-center mt-6">
                        <p className="text-sm text-[var(--text-secondary)]">
                            Ainda não tem conta?{' '}
                            <a href="/register" className="text-[var(--accent-primary)] hover:underline">
                                Começar teste grátis
                            </a>
                        </p>
                    </div>
                </form>
            </div>

            {showForgot && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full border border-gray-200 dark:border-gray-700">
                        <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Recuperação de Senha</h3>
                        <p className="text-sm mb-6 text-gray-600 dark:text-gray-300">
                            No momento, a recuperação automática está desativada. Por favor, entre em contato com o administrador do sistema (admin@demo.com) para solicitar uma nova senha temporária.
                        </p>
                        <button
                            onClick={() => setShowForgot(false)}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
                        >
                            Entendi
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function Login() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
            </div>
        }>
            <LoginForm />
        </Suspense>
    )
}

'use client'

import { registerTenant } from '@/app/actions/auth'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        setError('')

        const res = await registerTenant(formData)

        if (res?.error) {
            setError(res.error)
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0F172A] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px]" />

            <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl relative z-10">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block mb-4">
                        <div className="w-10 h-10 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg mx-auto">
                            B
                        </div>
                    </Link>
                    <h1 className="text-2xl font-bold mb-2">Crie sua conta</h1>
                    <p className="text-slate-400 text-sm">Comece a gerenciar seu orçamento hoje.</p>
                </div>

                <form action={handleSubmit} className="space-y-4">
                    {/* Company Info */}
                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Nome da Empresa</label>
                        <input
                            name="companyName"
                            type="text"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Ex: Minha Empresa S.A."
                            required
                        />
                    </div>

                    {/* User Info */}
                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Seu Nome</label>
                        <input
                            name="name"
                            type="text"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Ex: João Silva"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">E-mail Corporativo</label>
                        <input
                            name="email"
                            type="email"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="seu.email@empresa.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Senha</label>
                        <input
                            name="password"
                            type="password"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Criando conta...' : 'Criar Conta Grátis'}
                    </button>
                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-[var(--border-subtle)]"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-[var(--bg-surface)] text-[var(--text-secondary)]">Ou cadastre-se com</span>
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
                                Google
                            </a>
                        </div>
                    </div>

                    <div className="text-center mt-6">
                        <p className="text-sm text-[var(--text-secondary)]">
                            Já tem uma conta?{' '}
                            <Link href="/login" className="text-[var(--accent-primary)] hover:underline">
                                Fazer login
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    )
}

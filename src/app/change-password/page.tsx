'use client'

import { useState } from 'react'
import { changePassword } from '@/app/actions/auth'

export default function ChangePasswordPage() {
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (password !== confirm) {
            setError('As senhas não conferem')
            return
        }
        if (password.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres')
            return
        }

        setLoading(true)
        try {
            await changePassword(password)
        } catch (e: any) {
            // If redirect happens, this might not catch, which is good.
            // If error, it catches.
            setError(e.message || 'Erro ao alterar senha')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
            <div className="bg-[var(--bg-surface)] p-8 w-full max-w-md rounded-xl border border-[var(--border-subtle)] shadow-2xl space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Alterar Senha</h1>
                    <p className="text-sm text-[var(--text-secondary)]">
                        Por motivos de segurança, você precisa definir uma nova senha para continuar.
                    </p>
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Nova Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full px-4 py-2 rounded bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none"
                            placeholder="Mínimo 6 caracteres"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Confirmar Senha</label>
                        <input
                            type="password"
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            className="w-full px-4 py-2 rounded bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none"
                            placeholder="Repita a senha"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 px-4 bg-[var(--accent-primary)] hover:opacity-90 text-white font-bold rounded transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Salvando...' : 'Definir Nova Senha'}
                    </button>
                </form>
            </div>
        </div>
    )
}

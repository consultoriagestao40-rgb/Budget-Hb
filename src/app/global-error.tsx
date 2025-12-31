'use client'

import { useEffect } from "react"
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Global Critical Error:', error)
    }, [error])

    return (
        <html lang="pt-BR">
            <body className={inter.className}>
                <div className="flex min-h-screen flex-col items-center justify-center bg-[#0F172A] text-white p-4">
                    <h2 className="text-3xl font-bold mb-4 text-red-500">Erro Crítico do Sistema</h2>
                    <p className="text-slate-300 mb-8 max-w-lg text-center leading-relaxed">
                        Não foi possível carregar a estrutura principal da aplicação. Isso geralmente indica um erro de configuração ou falha no servidor.
                        {error.digest && (
                            <span className="block mt-4 text-xs font-mono bg-black/30 p-3 rounded text-red-400 border border-red-500/20">
                                Digest Code: {error.digest}
                            </span>
                        )}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-8 py-3 bg-red-600 rounded-lg hover:bg-red-500 transition-colors font-bold shadow-lg shadow-red-500/20"
                    >
                        Recarregar Sistema Completamente
                    </button>
                </div>
            </body>
        </html>
    )
}

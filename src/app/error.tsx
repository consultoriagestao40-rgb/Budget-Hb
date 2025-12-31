'use client' // Error components must be Client Components

import { useEffect } from 'react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Runtime Application Error:', error)
    }, [error])

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#0F172A] text-white p-4">
            <h2 className="text-2xl font-bold mb-4">Algo deu errado!</h2>
            <p className="text-slate-400 mb-8 max-w-md text-center">
                Ocorreu um erro inesperado ao carregar esta página.
                {error.digest && (
                    <span className="block mt-4 text-xs font-mono bg-black/30 p-2 rounded text-red-400">
                        Code: {error.digest}
                    </span>
                )}
            </p>
            <div className="flex gap-4">
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                >
                    Recarregar Página
                </button>
                <button
                    onClick={() => reset()}
                    className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors font-semibold shadow-lg shadow-blue-500/20"
                >
                    Tentar Novamente
                </button>
            </div>
        </div>
    )
}

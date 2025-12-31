'use client'

import { useState } from 'react'
import { repairSchema } from './actions'

export default function DiagPage() {
    const [status, setStatus] = useState('IDLE')
    const [message, setMessage] = useState('')

    async function handleRepair() {
        setStatus('REPAIRING')
        const res = await repairSchema()
        if (res.success) {
            setStatus('SUCCESS')
            setMessage(res.message!)
        } else {
            setStatus('ERROR')
            setMessage(res.error!)
        }
    }

    return (
        <div className="p-10 font-mono text-white bg-black min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Diagnostic & Repair</h1>

            <div className="mb-8 p-4 border border-blue-500 rounded bg-blue-900/20">
                <h2 className="text-xl font-bold mb-2">Repair Database Schema</h2>
                <p className="mb-4 text-sm text-gray-300">
                    Fix "Column does not exist" errors by adding missing columns manually.
                </p>
                <button
                    onClick={handleRepair}
                    disabled={status === 'REPAIRING'}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded font-bold disabled:opacity-50"
                >
                    {status === 'REPAIRING' ? 'Fixing...' : 'Run Auto-Repair'}
                </button>

                {status !== 'IDLE' && (
                    <div className={`mt-4 p-2 rounded ${status === 'SUCCESS' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                        <strong>{status}:</strong> {message}
                    </div>
                )}
            </div>

            <div className="text-xs text-gray-500 mt-10">
                Diag Tool v1.2
            </div>
        </div>
    )
}


import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export default async function DiagPage() {
    let status = 'UNKNOWN'
    let error: any = null
    let userCount = -1

    try {
        userCount = await prisma.user.count()
        status = 'SUCCESS'
    } catch (e: any) {
        status = 'ERROR'
        error = e
    }

    return (
        <div className="p-10 font-mono text-white bg-black min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Diagnostic Page</h1>

            <div className="mb-4">
                <strong>Status:</strong>
                <span className={status === 'SUCCESS' ? 'text-green-500 ml-2' : 'text-red-500 ml-2'}>{status}</span>
            </div>

            <div className="mb-4">
                <strong>User Count:</strong> {userCount}
            </div>

            <div className="mb-4">
                <strong>Database URL:</strong> {process.env.DATABASE_URL ? (process.env.DATABASE_URL.includes('pg') ? 'Configured (Hidden)' : 'Visible: ' + process.env.DATABASE_URL) : 'MISSING'}
            </div>

            {error && (
                <div className="mt-8 border border-red-500 p-4 rounded bg-red-900/20">
                    <h2 className="text-xl text-red-400 mb-2">Error Details:</h2>
                    <pre className="whitespace-pre-wrap break-all text-xs">
                        {error.message || JSON.stringify(error, null, 2)}
                    </pre>
                    {error.stack && (
                        <details className="mt-4">
                            <summary className="cursor-pointer text-gray-400">Stack Trace</summary>
                            <pre className="mt-2 text-[10px] text-gray-500">{error.stack}</pre>
                        </details>
                    )}
                </div>
            )}
        </div>
    )
}

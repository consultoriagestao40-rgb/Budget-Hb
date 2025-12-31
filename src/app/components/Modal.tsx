'use client'

import { useEffect, useRef } from 'react'

export function Modal({
    isOpen,
    onClose,
    title,
    children
}: {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
}) {
    const ref = useRef<HTMLDialogElement>(null)

    useEffect(() => {
        if (isOpen) {
            ref.current?.showModal()
        } else {
            ref.current?.close()
        }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <dialog
            ref={ref}
            className="p-0 rounded-xl shadow-2xl backdrop:bg-black/60 w-[480px] bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] open:animate-fade-in"
            onCancel={onClose}
        >
            <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-main)]/50">
                <h3 className="font-semibold text-lg">{title}</h3>
                <button
                    onClick={onClose}
                    className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-surface-hover)]"
                >
                    &times;
                </button>
            </div>
            <div className="p-6">
                {children}
            </div>
        </dialog>
    )
}

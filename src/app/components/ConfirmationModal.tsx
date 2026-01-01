'use client'

import { Modal } from './Modal'

export interface ConfirmationConfig {
    isOpen: boolean
    title: string
    message: React.ReactNode
    onConfirm: () => void
    variant?: 'danger' | 'warning' | 'info'
    confirmText?: string
    cancelText?: string
    isLoading?: boolean
}

export interface ConfirmationModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: React.ReactNode
    confirmText?: string
    cancelText?: string
    variant?: 'danger' | 'warning' | 'info'
    isLoading?: boolean
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'danger',
    isLoading = false
}: ConfirmationModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-6">
                <div className="text-[var(--text-secondary)] text-sm leading-relaxed whitespace-pre-line">
                    {message}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="btn btn-ghost"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`btn ${variant === 'danger' ? 'btn-error text-white' : 'btn-primary'} min-w-[100px]`}
                    >
                        {isLoading ? 'Processando...' : confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    )
}

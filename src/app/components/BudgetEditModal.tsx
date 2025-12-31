'use client'

import { useState, useEffect } from 'react'
import { Modal } from './Modal'

interface BudgetEditModalProps {
    isOpen: boolean
    onClose: () => void
    accountName: string
    initialValues: number[]
    onSave: (values: number[]) => Promise<void>
}

export function BudgetEditModal({ isOpen, onClose, accountName, initialValues, onSave }: BudgetEditModalProps) {
    const [values, setValues] = useState<string[]>(initialValues.map(v => v.toString()))
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        setValues(initialValues.map(v => v.toString()))
    }, [initialValues, isOpen])

    const handleChange = (index: number, val: string) => {
        const newValues = [...values]
        newValues[index] = val
        setValues(newValues)
    }

    const handleReplicateJan = () => {
        const janValue = values[0]
        setValues(Array(12).fill(janValue))
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const numValues = values.map(v => parseFloat(v.replace(',', '.') || '0'))
            // Check for NaN
            if (numValues.some(v => isNaN(v))) {
                alert('Por favor, insira apenas números válidos.')
                setIsSaving(false)
                return
            }
            await onSave(numValues)
            onClose()
        } catch (error) {
            console.error(error)
            alert('Erro ao salvar.')
        } finally {
            setIsSaving(false)
        }
    }

    const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Editar: ${accountName}`}>
            <div className="space-y-6">
                <div className="flex justify-end">
                    <button
                        onClick={handleReplicateJan}
                        className="text-xs text-[var(--accent-primary)] hover:underline font-medium"
                    >
                        Replicar Janeiro para todos
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    {MONTHS.map((month, idx) => (
                        <div key={idx}>
                            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1 uppercase">{month.slice(0, 3)}</label>
                            <div className="relative">
                                <span className="absolute left-2 top-1.5 text-[var(--text-tertiary)] text-xs">R$</span>
                                <input
                                    type="text"
                                    value={values[idx]}
                                    onChange={(e) => handleChange(idx, e.target.value)}
                                    className="w-full pl-6 pr-2 py-1.5 text-right text-sm bg-[var(--bg-main)] border border-[var(--border-subtle)] rounded focus:border-[var(--accent-primary)] focus:outline-none transition-colors"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pt-4 border-t border-[var(--border-subtle)] flex justify-end gap-2">
                    <button onClick={onClose} className="btn btn-ghost">Cancelar</button>
                    <button onClick={handleSave} disabled={isSaving} className="btn btn-primary min-w-[100px]">
                        {isSaving ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </div>
        </Modal>
    )
}

'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'

interface Option {
    id: string
    name: string
    code?: string | null
    fullCode?: string | null
}

interface MultiSelectProps {
    label: string
    options: Option[]
    selectedIds: string[]
    onChange: (ids: string[]) => void
    disabled?: boolean
    placeholder?: string
}

export function MultiSelect({
    label,
    options,
    selectedIds,
    onChange,
    disabled = false,
    placeholder = 'Todos'
}: MultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState('')
    const containerRef = useRef<HTMLDivElement>(null)

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const filteredOptions = options.filter(opt =>
        opt.name.toLowerCase().includes(search.toLowerCase()) ||
        (opt.code && opt.code.toLowerCase().includes(search.toLowerCase()))
    )

    const handleToggle = (id: string) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter(i => i !== id))
        } else {
            onChange([...selectedIds, id])
        }
    }

    const handleSelectAll = () => {
        if (selectedIds.length === filteredOptions.length) {
            onChange([])
        } else {
            onChange(filteredOptions.map(o => o.id))
        }
    }

    const handleClear = () => {
        onChange([])
        setSearch('')
    }

    // Display Text Logic
    const displayText = selectedIds.length === 0
        ? placeholder
        : selectedIds.length === 1
            ? options.find(o => o.id === selectedIds[0])?.name || placeholder
            : `${selectedIds.length} selecionados`

    return (
        <div className="flex flex-col gap-1 min-w-[200px] flex-1 relative" ref={containerRef}>
            <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">{label}</label>

            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg border 
                    bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-primary)]
                    hover:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20
                    disabled:opacity-50 disabled:cursor-not-allowed transition-all
                    ${isOpen ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/20' : ''}
                `}
            >
                <span className="truncate flex-1 text-left">{displayText}</span>
                <ChevronDown size={16} className={`text-[var(--text-secondary)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-[100%] left-0 w-full mt-1 z-50 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[300px]">

                    {/* Search Header */}
                    <div className="p-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-hover)]">
                        <div className="relative">
                            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Pesquisar..."
                                className="w-full pl-8 pr-2 py-1.5 text-sm bg-[var(--bg-main)] border border-[var(--border-subtle)] rounded focus:outline-none focus:border-[var(--accent-primary)]"
                                autoFocus
                            />
                        </div>
                        <div className="flex justify-between items-center mt-2 px-1">
                            <button
                                onClick={handleSelectAll}
                                className="text-xs font-medium text-[var(--accent-primary)] hover:underline"
                            >
                                {selectedIds.length === filteredOptions.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                            </button>
                            <button
                                onClick={handleClear}
                                className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--danger)]"
                            >
                                Limpar
                            </button>
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="overflow-y-auto flex-1 p-1">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(opt => {
                                const isSelected = selectedIds.includes(opt.id)
                                const label = opt.fullCode
                                    ? `${opt.fullCode} - ${opt.name}`
                                    : (opt.code ? `${opt.code} - ${opt.name}` : opt.name)

                                return (
                                    <label
                                        key={opt.id}
                                        className={`
                                            flex items-start gap-2 p-2 rounded cursor-pointer text-sm
                                            hover:bg-[var(--bg-surface-hover)] transition-colors
                                            ${isSelected ? 'bg-[var(--accent-primary)]/5 font-medium' : ''}
                                        `}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleToggle(opt.id)}
                                            className="checkbox checkbox-xs checkbox-primary rounded-sm mt-0.5"
                                        />
                                        <span className="text-[var(--text-primary)] leading-tight">{label}</span>
                                    </label>
                                )
                            })
                        ) : (
                            <div className="p-4 text-center text-xs text-[var(--text-muted)]">
                                Nenhuma opção encontrada.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

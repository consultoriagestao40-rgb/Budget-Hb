'use client'

import { useState } from 'react'

export function PricingSection({ title = "Escolha seu Plano" }: { title?: string }) {
    const [selectedPlan, setSelectedPlan] = useState<'MONTHLY' | 'ANNUAL'>('ANNUAL')
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD'>('PIX')

    const plans = {
        MONTHLY: {
            price: '99',
            period: '/mês',
            billing: 'Cobrado mensalmente',
            savings: ''
        },
        ANNUAL: {
            price: '89',
            period: '/mês',
            billing: 'Cobrado anualmente (R$ 1.068,00)',
            savings: 'Economize R$ 120,00/ano'
        }
    }

    const currentPlan = plans[selectedPlan]

    return (
        <div className="w-full max-w-4xl mx-auto p-6">
            <h2 className="text-3xl font-bold text-center mb-8">{title}</h2>

            {/* Toggle */}
            <div className="flex justify-center mb-10">
                <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-1 rounded-full flex relative">
                    <button
                        onClick={() => setSelectedPlan('MONTHLY')}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${selectedPlan === 'MONTHLY' ? 'bg-[var(--bg-main)] shadow text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    >
                        Mensal
                    </button>
                    <button
                        onClick={() => setSelectedPlan('ANNUAL')}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${selectedPlan === 'ANNUAL' ? 'bg-[var(--accent-primary)] text-white shadow' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    >
                        Anual
                        <span className="text-[10px] bg-white/20 px-1.5 rounded-full">Save 10%</span>
                    </button>
                </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-2 gap-8">
                {/* Standard Plan (Visual representation of features) */}
                <div className="border border-[var(--border-subtle)] rounded-2xl p-8 flex flex-col justify-between bg-[var(--bg-surface)]/50">
                    <div>
                        <h3 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">Plano PRO</h3>
                        <ul className="space-y-3 mb-8 text-[var(--text-secondary)] text-sm">
                            <li className="flex items-center gap-2">✓ Multi-usuários ilimitados</li>
                            <li className="flex items-center gap-2">✓ Gestão de Múltiplas Empresas</li>
                            <li className="flex items-center gap-2">✓ Controle de Versões de Orçamento</li>
                            <li className="flex items-center gap-2">✓ DRE Interativo e Dinâmico</li>
                            <li className="flex items-center gap-2">✓ Suporte Prioritário</li>
                        </ul>
                    </div>
                </div>

                {/* Selected Pricing Highlight */}
                <div className="border-2 border-[var(--accent-primary)] rounded-2xl p-8 relative bg-[var(--bg-surface)] shadow-2xl shadow-blue-500/10">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[var(--accent-primary)] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                        Recomendado
                    </div>

                    <div className="text-center mb-6">
                        <div className="flex justify-center items-baseline mb-2">
                            <span className="text-2xl text-[var(--text-secondary)] font-medium">R$</span>
                            <span className="text-5xl font-bold text-[var(--text-primary)] tracking-tight">{currentPlan.price}</span>
                            <span className="text-[var(--text-secondary)]">{currentPlan.period}</span>
                        </div>
                        <p className="text-sm text-[var(--text-muted)]">{currentPlan.billing}</p>
                        {currentPlan.savings && (
                            <p className="text-sm text-green-500 font-semibold mt-2">{currentPlan.savings}</p>
                        )}
                    </div>

                    <button
                        onClick={() => setShowPaymentModal(true)}
                        className="w-full btn btn-primary py-4 text-lg shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
                    >
                        Assinar Agora
                    </button>

                    <p className="text-xs text-center text-[var(--text-muted)] mt-4">
                        Cancelamento a qualquer momento. Garantia de 7 dias.
                    </p>
                </div>
            </div>

            {/* Payment Modal (Mock) */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-[var(--border-subtle)] flex justify-between items-center">
                            <h3 className="text-lg font-bold">Pagamento Seguro</h3>
                            <button onClick={() => setShowPaymentModal(false)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">&times;</button>
                        </div>

                        <div className="p-6">
                            <div className="flex gap-4 mb-6">
                                <button
                                    onClick={() => setPaymentMethod('PIX')}
                                    className={`flex-1 p-4 rounded-lg border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'PIX' ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' : 'border-[var(--border-subtle)] hover:border-[var(--text-secondary)]'}`}
                                >
                                    <span className="text-2xl">💠</span>
                                    <span className="font-semibold text-sm">PIX</span>
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('CREDIT_CARD')}
                                    className={`flex-1 p-4 rounded-lg border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'CREDIT_CARD' ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' : 'border-[var(--border-subtle)] hover:border-[var(--text-secondary)]'}`}
                                >
                                    <span className="text-2xl">💳</span>
                                    <span className="font-semibold text-sm">Cartão</span>
                                </button>
                            </div>

                            {paymentMethod === 'PIX' ? (
                                <div className="text-center space-y-4">
                                    <div className="bg-white p-4 rounded-lg inline-block">
                                        {/* Mock QR */}
                                        <div className="w-48 h-48 bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                                            QR CODE PIX <br />(Simulação)
                                        </div>
                                    </div>
                                    <div className="text-sm text-[var(--text-secondary)]">
                                        <p className="mb-2">Escaneie o QR Code ou use a chave abaixo:</p>
                                        <div className="bg-[var(--bg-main)] p-3 rounded flex justify-between items-center border border-[var(--border-subtle)]">
                                            <code className="text-xs truncate max-w-[250px]">00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3...</code>
                                            <button className="text-[var(--accent-primary)] text-xs font-bold hover:underline">Copiar</button>
                                        </div>
                                    </div>
                                    <div className="text-xs text-[var(--text-muted)] bg-blue-500/10 p-3 rounded">
                                        Após o pagamento, envie o comprovante para <strong>(11) 99999-9999</strong> para liberação imediata.
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center space-y-6 py-8">
                                    <div className="text-4xl">💳</div>
                                    <p className="text-[var(--text-secondary)]">
                                        Para pagar com Cartão de Crédito, utilizaremos um checkout seguro (Stripe).
                                    </p>
                                    <button className="btn btn-primary w-full" onClick={() => alert('Em produção, isso levaria ao Stripe Checkout.')}>
                                        Ir para Pagamento (Stripe)
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

import { PricingSection } from '@/app/components/PricingSection'

export default function PaymentRequiredPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-main)] flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-[var(--bg-surface)] border border-red-500/30 rounded-lg p-8 shadow-2xl text-center mb-12">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
                    🚫
                </div>
                <h1 className="text-2xl font-bold text-red-500 mb-2">Acesso Temporariamente Suspenso</h1>
                <p className="text-[var(--text-secondary)] mb-6">
                    A assinatura da sua empresa está <strong>BLOQUEADA</strong> ou pendente de pagamento.
                </p>

                <div className="bg-[var(--bg-main)] p-4 rounded text-xs text-[var(--text-muted)]">
                    Entre em contato com o administrador ou regularize abaixo.
                </div>
            </div>

            <PricingSection title="Regularize seu Acesso" />
        </div>
    )
}

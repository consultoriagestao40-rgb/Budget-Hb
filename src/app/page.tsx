import Link from 'next/link'
import { PricingSection } from '@/app/components/PricingSection'

export default function Home() {
    return (
        <div className="flex flex-col min-h-screen bg-[#0F172A] text-white">
            {/* Header / Navbar */}
            <header className="absolute top-0 w-full z-50 border-b border-white/10 backdrop-blur-sm"> // Fixed absolute positioning context
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    {/* Logo/Brand */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
                            B
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                            BudgetHub
                        </span>
                    </div>

                    {/* Nav Links - Hidden on mobile, but simple for now */}
                    <nav className="hidden md:flex items-center gap-8 text-sm text-slate-300">
                        <Link href="#features" className="hover:text-white transition-colors">Funcionalidades</Link>
                        <Link href="#about" className="hover:text-white transition-colors">Sobre</Link>
                        <Link href="#contact" className="hover:text-white transition-colors">Contato</Link>
                    </nav>

                    {/* Auth Buttons */}
                    <div className="flex items-center gap-4">
                        <Link
                            href="/login"
                            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
                        >
                            Login
                        </Link>
                        <Link
                            href="/register"
                            className="text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-full transition-all shadow-lg shadow-blue-500/30 ring-1 ring-white/10"
                        >
                            Criar Conta
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center relative pt-24 pb-16">
                {/* Background Effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] -z-10" />

                <div className="container mx-auto px-6 text-center z-10">
                    <div className="inline-block mb-6 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-300 text-sm font-medium tracking-wide animate-fade-in">
                        🚀 GESTÃO FINANCEIRA ESTRATÉGICA
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
                        Transforme seu <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                            Planejamento Orçamentário
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed">
                        Abandone as planilhas desconectadas. O <strong>BudgetHub</strong> centraliza sua gestão financeira, permitindo criar cenários, controlar múltiplas empresas e acompanhar seu DRE em tempo real.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                        <Link
                            href="/register"
                            className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold transition-all shadow-lg shadow-blue-500/30 hover:scale-105"
                        >
                            Começar Teste Grátis
                        </Link>
                        <Link
                            href="/login"
                            className="w-full sm:w-auto px-8 py-4 bg-slate-800 text-white border border-slate-700 rounded-full font-medium hover:bg-slate-700 transition-colors"
                        >
                            Fazer Login
                        </Link>
                    </div>

                    {/* Dashboard Preview Image */}
                    <div className="relative mx-auto max-w-6xl rounded-xl border border-slate-700/50 bg-slate-900/50 shadow-2xl overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-transparent z-10 h-32 bottom-0" />
                        <img
                            src="/hero-dashboard.png"
                            alt="Painel DRE do BudgetHub"
                            className="w-full h-auto object-cover opacity-90 transition-opacity group-hover:opacity-100"
                        />
                        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl" />
                    </div>
                </div>
            </main>

            {/* Why Budgeting Matters Section */}
            <section className="py-24 bg-slate-800/30 border-t border-white/5">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row gap-16 items-center">
                        <div className="md:w-1/2">
                            <h2 className="text-3xl md:text-4xl font-bold mb-6">Por que o Orçamento Empresarial é crucial?</h2>
                            <div className="space-y-6 text-slate-300 leading-relaxed">
                                <p>
                                    Um orçamento bem definido não é apenas uma previsão de gastos, é o <strong>mapa do sucesso</strong> da sua empresa. Sem ele, você navega no escuro.
                                </p>
                                <ul className="space-y-4 mt-4">
                                    <li className="flex gap-3">
                                        <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center shrink-0">✓</div>
                                        <span><strong>Previsibilidade:</strong> Antecipe fluxos de caixa e evite surpresas desagradáveis no final do mês.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">✓</div>
                                        <span><strong>Controle de Metas:</strong> Compare o planejado vs. realizado (Real vs Budget) para ajustar rotas rapidamente.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">✓</div>
                                        <span><strong>Crescimento Sustentável:</strong> Saiba exatamente quanto pode investir em expansão sem comprometer a operação.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="md:w-1/2 grid grid-cols-2 gap-4">
                            <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl">
                                <div className="text-4xl mb-2">📉</div>
                                <h3 className="font-bold text-lg mb-1">Redução de Custos</h3>
                                <p className="text-sm text-slate-400">Identifique gargalos e desperdícios imediatamente.</p>
                            </div>
                            <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl mt-8">
                                <div className="text-4xl mb-2">📈</div>
                                <h3 className="font-bold text-lg mb-1">Lucratividade</h3>
                                <p className="text-sm text-slate-400">Foque nos produtos e serviços que realmente dão retorno.</p>
                            </div>
                            <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl -mt-8">
                                <div className="text-4xl mb-2">🎯</div>
                                <h3 className="font-bold text-lg mb-1">Decisões Rápidas</h3>
                                <p className="text-sm text-slate-400">Dados estruturados para agir com confiança.</p>
                            </div>
                            <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl">
                                <div className="text-4xl mb-2">🛡️</div>
                                <h3 className="font-bold text-lg mb-1">Segurança</h3>
                                <p className="text-sm text-slate-400">Permissões granulares de acesso por usuário.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* Features Section */}
            <section id="features" className="py-24 bg-slate-900/50 border-t border-white/5">
                <div className="container mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center mb-16">Por que escolher o BudgetHub?</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { title: 'Multi-Empresa', desc: 'Gerencie múltiplos CNPJs e filiais em um único lugar.' },
                            { title: 'Controle de Versões', desc: 'Crie cenários otimistas e pessimistas e compare resultados.' },
                            { title: 'DRE Interativo', desc: 'Edite valores diretamente na grade, como no Excel, mas com segurança.' }
                        ].map((f, i) => (
                            <div key={i} className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-colors">
                                <h3 className="text-xl font-semibold mb-3 text-blue-300">{f.title}</h3>
                                <p className="text-slate-400 leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 border-t border-white/5">
                <PricingSection />
            </section>

            {/* Footer */}
            <footer className="py-8 border-t border-white/10 text-center text-slate-500 text-sm">
                <p>&copy; 2024 BudgetHub System. Todos os direitos reservados.</p>
            </footer>
        </div>
    )
}

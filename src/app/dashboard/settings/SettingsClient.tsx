'use client'

import { useState, useEffect } from 'react'
import { Company, CostCenter, Client, User, City, CostCenterGroup, CostCenterSegment, Grouping, Tenant, Segment } from '@/lib/prisma'
import { Modal } from '@/app/components/Modal'
import {
    createCompany, createCostCenter, createClient, deleteCompany, deleteCostCenter, deleteClient,
    createCity, deleteCity, createCostCenterGroup, deleteCostCenterGroup,
    createCostCenterSegment, deleteCostCenterSegment, createGrouping, deleteGrouping
} from '@/app/actions/settings'
import { createUser, deleteUser, getUserPermissions, updateUserPermissions, updateUser } from '@/app/actions/users'
import { updateTenantProfile } from '@/app/actions/tenant'
import { useRouter } from 'next/navigation'

interface SettingsClientProps {
    initialCompanies: Company[]
    initialCostCenters: CostCenter[]
    initialClients: Client[]
    initialUsers: User[]
    initialCities: City[]
    initialGroups: CostCenterGroup[]
    initialSegments: CostCenterSegment[]
    initialGroupings: Grouping[]
    initialExpenseCenters: Segment[]
    initialTenant: Tenant | null
}

type TabType = 'companies' | 'costCenters' | 'clients' | 'groupings' | 'cities' | 'groups' | 'segments' | 'users' | 'account'

interface Permission {
    type: 'COMPANY' | 'COST_CENTER' // | 'SEGMENT'
    entityId: string
    canView: boolean
    canEdit: boolean
    canCreate: boolean
    canDelete: boolean
}

export function SettingsClient({
    initialCompanies, initialCostCenters, initialClients, initialUsers,
    initialCities, initialGroups, initialSegments, initialGroupings, initialExpenseCenters, initialTenant
}: SettingsClientProps) {
    const [activeTab, setActiveTab] = useState<TabType>('companies')
    const router = useRouter()

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [formData, setFormData] = useState({ name: '', code: '', email: '', role: 'USER', password: '', state: '', companyId: '' })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    // Permission Management State
    const [permissionUser, setPermissionUser] = useState<User | null>(null)
    const [permissions, setPermissions] = useState<Permission[]>([])
    const [isLoadingPerms, setIsLoadingPerms] = useState(false)
    const [isSavingPerms, setIsSavingPerms] = useState(false)

    // Tenant Profile State
    const [tenantProfile, setTenantProfile] = useState({
        ownerName: initialTenant?.ownerName || '',
        website: initialTenant?.website || '',
        address: initialTenant?.address || '',
        cnpj: initialTenant?.cnpj || '',
        phone: initialTenant?.phone || '',
        logoUrl: initialTenant?.logoUrl || '',
        description: initialTenant?.description || ''
    })
    const [isSavingProfile, setIsSavingProfile] = useState(false)

    const handleOpenModal = () => {
        setFormData({ name: '', code: '', email: '', role: 'USER', password: '', state: '', companyId: '' })
        setEditingId(null)
        setIsModalOpen(true)
    }

    const handleEditUser = (user: User) => {
        setFormData({
            name: user.name,
            code: '',
            email: user.email,
            role: user.role,
            password: '',
            state: '',
            companyId: ''
        })
        setEditingId(user.id)
        setIsModalOpen(true)
    }

    const handleSubmit = async () => {
        if (!formData.name && activeTab !== 'users') return
        setIsSubmitting(true)

        try {
            if (editingId && activeTab === 'users') {
                await updateUser(editingId, {
                    name: formData.name,
                    email: formData.email,
                    role: formData.role,
                    password: formData.password || undefined
                })
            } else {
                if (activeTab === 'companies') await createCompany({ name: formData.name, code: formData.code })
                else if (activeTab === 'costCenters') await createCostCenter({ name: formData.name, code: formData.code })
                else if (activeTab === 'clients') await createClient(formData.name)
                else if (activeTab === 'groupings') await createGrouping({ name: formData.name, companyId: formData.companyId || undefined })
                else if (activeTab === 'cities') {
                    if (!formData.state) throw new Error('Estado (UF) é obrigatório')
                    await createCity(formData.name, formData.state)
                }
                else if (activeTab === 'groups') await createCostCenterGroup(formData.name)
                else if (activeTab === 'segments') await createCostCenterSegment(formData.name)
                else if (activeTab === 'users') {
                    if (!formData.email) throw new Error('Email é obrigatório')
                    await createUser({
                        name: formData.name,
                        email: formData.email,
                        role: formData.role,
                        password: formData.password
                    })
                }
            }
            setIsModalOpen(false)
            setEditingId(null)
        } catch (error: any) {
            alert(error.message || 'Erro ao salvar.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Tem certeza que deseja excluir "${name}"?`)) return

        try {
            if (activeTab === 'companies') await deleteCompany(id)
            else if (activeTab === 'costCenters') await deleteCostCenter(id)
            else if (activeTab === 'clients') await deleteClient(id)
            else if (activeTab === 'groupings') await deleteGrouping(id)
            else if (activeTab === 'cities') await deleteCity(id)
            else if (activeTab === 'groups') await deleteCostCenterGroup(id)
            else if (activeTab === 'segments') await deleteCostCenterSegment(id)
            else if (activeTab === 'users') await deleteUser(id)
        } catch (error: any) {
            alert(error.message || 'Erro ao excluir.')
        }
    }

    // Permission Logic
    const handleManagePermissions = async (user: User) => {
        setPermissionUser(user)
        setIsLoadingPerms(true)
        try {
            const userPerms: any[] = await getUserPermissions(user.id)
            const mapped: Permission[] = userPerms.map(p => ({
                type: p.companyId ? 'COMPANY' : 'COST_CENTER', // (p.costCenterId ? 'COST_CENTER' : 'SEGMENT'),
                entityId: p.companyId || p.costCenterId!, // || p.segmentId!,
                canView: p.canView,
                canEdit: p.canEdit,
                canCreate: p.canCreate,
                canDelete: p.canDelete
            }))
            setPermissions(mapped)
        } catch (e) {
            console.error(e)
            alert('Falha ao carregar permissões')
        } finally {
            setIsLoadingPerms(false)
        }
    }

    const togglePermission = (type: 'COMPANY' | 'COST_CENTER', entityId: string) => {
        const exists = permissions.find(p => p.type === type && p.entityId === entityId)
        if (exists) {
            setPermissions(permissions.filter(p => !(p.type === type && p.entityId === entityId)))
        } else {
            setPermissions([...permissions, {
                type,
                entityId,
                canView: true,
                canEdit: false,
                canCreate: false,
                canDelete: false
            }])
        }
    }

    const updatePermissionFlag = (type: 'COMPANY' | 'COST_CENTER', entityId: string, field: keyof Permission, value: boolean) => {
        setPermissions(permissions.map(p => {
            if (p.type === type && p.entityId === entityId) {
                return { ...p, [field]: value }
            }
            return p
        }))
    }

    const handleSavePermissions = async () => {
        if (!permissionUser) return
        setIsSavingPerms(true)
        try {
            await updateUserPermissions(permissionUser.id, permissions)
            alert('Permissões atualizadas com sucesso!')
            setPermissionUser(null)
        } catch (e: any) {
            alert('Erro: ' + e.message)
        } finally {
            setIsSavingPerms(false)
        }
    }

    const handleSaveProfile = async () => {
        setIsSavingProfile(true)
        try {
            await updateTenantProfile(tenantProfile)
            alert('Perfil atualizado com sucesso!')
            router.refresh()
        } catch (e: any) {
            alert('Erro ao atualizar perfil: ' + e.message)
        } finally {
            setIsSavingProfile(false)
        }
    }

    const getTabLabel = (tab: TabType) => {
        switch (tab) {
            case 'companies': return 'Empresas'
            case 'costCenters': return 'Centros de Custo'
            case 'clients': return 'Clientes'
            case 'groupings': return 'Departamentos'
            case 'cities': return 'Cidades'
            case 'groups': return 'Agrupamentos'
            case 'segments': return 'Seguimentos'
            case 'users': return 'Usuários'
            case 'account': return 'Dados da Conta'
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Configurações do Sistema</h1>

            {/* Tabs */}
            <div className="flex border-b border-[var(--border-subtle)] overflow-x-auto custom-scrollbar">
                <TabButton active={activeTab === 'companies'} onClick={() => setActiveTab('companies')} label="Empresas" />
                <TabButton active={activeTab === 'costCenters'} onClick={() => setActiveTab('costCenters')} label="CCs" />
                <TabButton active={activeTab === 'groupings'} onClick={() => setActiveTab('groupings')} label="Depto" />
                <TabButton active={activeTab === 'clients'} onClick={() => setActiveTab('clients')} label="Clientes" />
                <TabButton active={activeTab === 'cities'} onClick={() => setActiveTab('cities')} label="Cidades" />
                <TabButton active={activeTab === 'groups'} onClick={() => setActiveTab('groups')} label="Agrupadores" />
                <TabButton active={activeTab === 'segments'} onClick={() => setActiveTab('segments')} label="Seguimentos" />
                <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} label="Usuários" />
                <TabButton active={activeTab === 'account'} onClick={() => setActiveTab('account')} label="Dados da Conta" />
            </div>

            {/* Header + Add Button (Hidden for Account Tab) */}
            {activeTab !== 'account' && (
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-[var(--text-secondary)]">
                        Gerenciar {getTabLabel(activeTab)}
                    </h2>
                    <button onClick={handleOpenModal} className="btn btn-primary">
                        + Adicionar {activeTab === 'users' ? 'Usuário' : 'Novo'}
                    </button>
                </div>
            )}

            {/* Account Tab Content */}
            {activeTab === 'account' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
                    <div className="space-y-4">
                        <div className="bg-[var(--bg-surface)] p-6 rounded-lg border border-[var(--border-subtle)]">
                            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 border-b border-[var(--border-subtle)] pb-2">Informações da Empresa</h3>

                            <div className="grid gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Nome do Responsável</label>
                                    <input
                                        type="text"
                                        value={tenantProfile.ownerName}
                                        onChange={e => setTenantProfile({ ...tenantProfile, ownerName: e.target.value })}
                                        className="input-outline w-full"
                                        placeholder="Nome do contato principal"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">CNPJ</label>
                                    <input
                                        type="text"
                                        value={tenantProfile.cnpj}
                                        onChange={e => setTenantProfile({ ...tenantProfile, cnpj: e.target.value })}
                                        className="input-outline w-full"
                                        placeholder="00.000.000/0000-00"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Telefone / WhatsApp</label>
                                    <input
                                        type="text"
                                        value={tenantProfile.phone}
                                        onChange={e => setTenantProfile({ ...tenantProfile, phone: e.target.value })}
                                        className="input-outline w-full"
                                        placeholder="(00) 00000-0000"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Endereço Completo</label>
                                    <textarea
                                        value={tenantProfile.address}
                                        onChange={e => setTenantProfile({ ...tenantProfile, address: e.target.value })}
                                        className="input-outline w-full h-24 resize-none"
                                        placeholder="Rua, Número, Bairro, Cidade - UF, CEP"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-[var(--bg-surface)] p-6 rounded-lg border border-[var(--border-subtle)]">
                            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 border-b border-[var(--border-subtle)] pb-2">Identidade Visual & Web</h3>

                            <div className="grid gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Website</label>
                                    <input
                                        type="text"
                                        value={tenantProfile.website}
                                        onChange={e => setTenantProfile({ ...tenantProfile, website: e.target.value })}
                                        className="input-outline w-full"
                                        placeholder="https://www.suaempresa.com.br"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">URL do Logotipo</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={tenantProfile.logoUrl}
                                            onChange={e => setTenantProfile({ ...tenantProfile, logoUrl: e.target.value })}
                                            className="input-outline w-full"
                                            placeholder="https://exemplo.com/logo.png"
                                        />
                                    </div>
                                    <p className="text-xs text-[var(--text-muted)] mt-1">Cole o link direto da imagem da sua logo.</p>
                                </div>

                                {tenantProfile.logoUrl && (
                                    <div className="mt-4 p-4 border border-[var(--border-subtle)] rounded bg-[var(--bg-main)] flex flex-col items-center justify-center">
                                        <span className="text-xs text-[var(--text-muted)] mb-2">Pré-visualização</span>
                                        <img
                                            src={tenantProfile.logoUrl}
                                            alt="Logo Preview"
                                            className="max-h-24 max-w-full object-contain"
                                            onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=Erro+na+Imagem')}
                                        />
                                    </div>
                                )}

                                <div className="mt-4">
                                    <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Descrição Curta</label>
                                    <textarea
                                        value={tenantProfile.description}
                                        onChange={e => setTenantProfile({ ...tenantProfile, description: e.target.value })}
                                        className="input-outline w-full h-24 resize-none"
                                        placeholder="Breve descrição sobre a empresa..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                onClick={handleSaveProfile}
                                disabled={isSavingProfile}
                                className="btn btn-primary w-full md:w-auto px-8"
                            >
                                {isSavingProfile ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                /* Lists for other tabs */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeTab === 'companies' && initialCompanies.map(item => (
                        <ItemCard key={item.id} name={item.name} code={item.code} onDelete={() => handleDelete(item.id, item.name)} />
                    ))}
                    {activeTab === 'costCenters' && initialCostCenters.map(item => (
                        <ItemCard key={item.id} name={item.name} code={item.code} onDelete={() => handleDelete(item.id, item.name)} />
                    ))}
                    {activeTab === 'groupings' && initialGroupings.map(item => (
                        <ItemCard key={item.id} name={item.name} onDelete={() => handleDelete(item.id, item.name)} />
                    ))}
                    {activeTab === 'clients' && initialClients.map(item => (
                        <ItemCard key={item.id} name={item.name} onDelete={() => handleDelete(item.id, item.name)} />
                    ))}
                    {activeTab === 'cities' && initialCities.map(item => (
                        <ItemCard key={item.id} name={item.name} onDelete={() => handleDelete(item.id, item.name)} />
                    ))}
                    {activeTab === 'groups' && initialGroups.map(item => (
                        <ItemCard key={item.id} name={item.name} onDelete={() => handleDelete(item.id, item.name)} />
                    ))}
                    {activeTab === 'segments' && initialSegments.map(item => (
                        <ItemCard key={item.id} name={item.name} onDelete={() => handleDelete(item.id, item.name)} />
                    ))}
                    {activeTab === 'users' && initialUsers.map(item => (
                        <UserCard
                            key={item.id}
                            user={item}
                            onDelete={() => handleDelete(item.id, item.name)}
                            onManagePermissions={() => handleManagePermissions(item)}
                            onEdit={() => handleEditUser(item)}
                        />
                    ))}

                    {/* Empty States (Simplified) */}
                    {((activeTab === 'companies' && initialCompanies.length === 0) ||
                        (activeTab === 'costCenters' && initialCostCenters.length === 0) ||
                        (activeTab === 'clients' && initialClients.length === 0) ||
                        (activeTab === 'groupings' && initialGroupings.length === 0) ||
                        (activeTab === 'cities' && initialCities.length === 0) ||
                        (activeTab === 'groups' && initialGroups.length === 0) ||
                        (activeTab === 'segments' && initialSegments.length === 0) ||
                        (activeTab === 'users' && initialUsers.length === 0)) && <EmptyState />}
                </div>
            )}

            {/* Creation Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`${editingId ? 'Editar' : 'Novo'} ${getTabLabel(activeTab).slice(0, -1)}`}
            >
                <div className="space-y-4">
                    {activeTab === 'users' ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="input-outline"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Senha (Opcional)</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="input-outline"
                                    placeholder="Padrão: password123"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Função</label>
                                <select
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    className="input-outline"
                                >
                                    <option value="USER">Usuário Comum</option>
                                    <option value="ADMIN">Administrador</option>
                                </select>
                            </div>
                        </>
                    ) : (
                        <>
                            {(activeTab === 'companies' || activeTab === 'costCenters') && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Código (Opcional)</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                                        className="input-outline"
                                        placeholder="Ex: 001"
                                    />
                                </div>
                            )}
                            {activeTab === 'cities' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">UF (Estado)</label>
                                    <input
                                        type="text"
                                        maxLength={2}
                                        value={formData.state}
                                        onChange={e => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                                        className="input-outline"
                                        placeholder="SP"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium mb-1">Nome *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="input-outline"
                                    placeholder="Nome Oficial"
                                />
                            </div>

                            {activeTab === 'groupings' && (
                                <div className="mt-4">
                                    <label className="block text-sm font-medium mb-1">Empresa (Opcional, mas recomendado)</label>
                                    <select
                                        value={formData.companyId}
                                        onChange={e => setFormData({ ...formData, companyId: e.target.value })}
                                        className="input-outline"
                                    >
                                        <option value="">Selecione uma empresa...</option>
                                        {initialCompanies.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-[var(--text-muted)] mt-1">Vincular a uma empresa habilita os filtros corretamente.</p>
                                </div>
                            )}
                        </>
                    )}

                    <div className="flex justify-end gap-2 mt-6">
                        <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost">Cancelar</button>
                        <button onClick={handleSubmit} disabled={isSubmitting} className="btn btn-primary">
                            {isSubmitting ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </div>
            </Modal >

            {/* Permissions Modal */}
            {
                permissionUser && (
                    <Modal isOpen={!!permissionUser} onClose={() => setPermissionUser(null)} title={`Permissões: ${permissionUser.name}`}>
                        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                            {isLoadingPerms ? (
                                <div className="p-8 text-center text-[var(--text-secondary)]">Carregando permissões...</div>
                            ) : (
                                <>
                                    <p className="text-xs text-[var(--text-secondary)]">Marque as empresas e centros de custo que este usuário pode acessar. Use os ícones para refinar as permissões (Ver, Editar, Criar).</p>

                                    {/* Companies */}
                                    <div>
                                        <h3 className="font-bold text-[var(--text-primary)] mb-2 bg-[var(--bg-main)]/50 p-2 rounded backdrop-blur border border-[var(--border-subtle)] sticky top-0">Empresas</h3>
                                        <div className="space-y-1">
                                            {initialCompanies.map(comp => {
                                                const perm = permissions.find(p => p.type === 'COMPANY' && p.entityId === comp.id)
                                                return (
                                                    <div key={comp.id} className="flex items-center justify-between p-2 rounded hover:bg-[var(--bg-surface-hover)] border border-transparent hover:border-[var(--border-subtle)] transition-colors">
                                                        <label className="flex items-center gap-2 cursor-pointer flex-1 select-none">
                                                            <input
                                                                type="checkbox"
                                                                checked={!!perm}
                                                                onChange={() => togglePermission('COMPANY', comp.id)}
                                                                className="checkbox"
                                                            />
                                                            {comp.code && <span className="font-mono text-xs opacity-70">{comp.code}</span>}
                                                            <span className="text-sm">{comp.name}</span>
                                                        </label>
                                                        {perm && (
                                                            <div className="flex gap-4 text-xs bg-[var(--bg-main)] px-2 py-1 rounded">
                                                                <label className="flex items-center gap-1 cursor-pointer" title="Visualizar">
                                                                    <input type="checkbox" checked={perm.canView} onChange={(e) => updatePermissionFlag('COMPANY', comp.id, 'canView', e.target.checked)} />
                                                                    <span>Ver</span>
                                                                </label>
                                                                <label className="flex items-center gap-1 cursor-pointer" title="Editar">
                                                                    <input type="checkbox" checked={perm.canEdit} onChange={(e) => updatePermissionFlag('COMPANY', comp.id, 'canEdit', e.target.checked)} />
                                                                    <span>Edit</span>
                                                                </label>
                                                                {/* "Criar" might be confusing for Company level, usually means "Create Records associated to Company" */}
                                                                <label className="flex items-center gap-1 cursor-pointer" title="Criar novos registros">
                                                                    <input type="checkbox" checked={perm.canCreate} onChange={(e) => updatePermissionFlag('COMPANY', comp.id, 'canCreate', e.target.checked)} />
                                                                    <span>Criar</span>
                                                                </label>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Cost Centers */}
                                    <div>
                                        <h3 className="font-bold text-[var(--text-primary)] mb-2 mt-4 bg-[var(--bg-main)]/50 p-2 rounded backdrop-blur border border-[var(--border-subtle)] sticky top-0">Centros de Custo</h3>
                                        <div className="space-y-1">
                                            {initialCostCenters.map(cc => {
                                                const perm = permissions.find(p => p.type === 'COST_CENTER' && p.entityId === cc.id)
                                                return (
                                                    <div key={cc.id} className="flex items-center justify-between p-2 rounded hover:bg-[var(--bg-surface-hover)] border border-transparent hover:border-[var(--border-subtle)] transition-colors">
                                                        <label className="flex items-center gap-2 cursor-pointer flex-1 select-none">
                                                            <input
                                                                type="checkbox"
                                                                checked={!!perm}
                                                                onChange={() => togglePermission('COST_CENTER', cc.id)}
                                                                className="checkbox"
                                                            />
                                                            {cc.code && <span className="font-mono text-xs opacity-70">{cc.code}</span>}
                                                            <span className="text-sm">{cc.name}</span>
                                                        </label>
                                                        {perm && (
                                                            <div className="flex gap-4 text-xs bg-[var(--bg-main)] px-2 py-1 rounded">
                                                                <label className="flex items-center gap-1 cursor-pointer" title="Visualizar">
                                                                    <input type="checkbox" checked={perm.canView} onChange={(e) => updatePermissionFlag('COST_CENTER', cc.id, 'canView', e.target.checked)} />
                                                                    <span>Ver</span>
                                                                </label>
                                                                <label className="flex items-center gap-1 cursor-pointer" title="Editar">
                                                                    <input type="checkbox" checked={perm.canEdit} onChange={(e) => updatePermissionFlag('COST_CENTER', cc.id, 'canEdit', e.target.checked)} />
                                                                    <span>Edit</span>
                                                                </label>
                                                                {/* Cost Center Creation is usually structural, but maybe? */}
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Segments (Expense Centers) - Temporarily Disabled (Schema Revert)
                                    <div>
                                        <h3 className="font-bold text-[var(--text-primary)] mb-2 mt-4 bg-[var(--bg-main)]/50 p-2 rounded backdrop-blur border border-[var(--border-subtle)] sticky top-0">Centros de Despesa</h3>
                                        <div className="space-y-1">
                                            {initialExpenseCenters.map(seg => {
                                                const perm = permissions.find(p => p.type === 'SEGMENT' && p.entityId === seg.id)
                                                return (
                                                    <div key={seg.id} className="flex items-center justify-between p-2 rounded hover:bg-[var(--bg-surface-hover)] border border-transparent hover:border-[var(--border-subtle)] transition-colors">
                                                        <label className="flex items-center gap-2 cursor-pointer flex-1 select-none">
                                                            <input
                                                                type="checkbox"
                                                                checked={!!perm}
                                                                onChange={() => togglePermission('SEGMENT', seg.id)}
                                                                className="checkbox"
                                                            />
                                                            {seg.code && <span className="font-mono text-xs opacity-70">{seg.code}</span>}
                                                            <span className="text-sm">{seg.name}</span>
                                                        </label>
                                                        {perm && (
                                                            <div className="flex gap-4 text-xs bg-[var(--bg-main)] px-2 py-1 rounded">
                                                                <label className="flex items-center gap-1 cursor-pointer" title="Visualizar">
                                                                    <input type="checkbox" checked={perm.canView} onChange={(e) => updatePermissionFlag('SEGMENT', seg.id, 'canView', e.target.checked)} />
                                                                    <span>Ver</span>
                                                                </label>
                                                                <label className="flex items-center gap-1 cursor-pointer" title="Editar">
                                                                    <input type="checkbox" checked={perm.canEdit} onChange={(e) => updatePermissionFlag('SEGMENT', seg.id, 'canEdit', e.target.checked)} />
                                                                    <span>Edit</span>
                                                                </label>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                    */}
                                </>
                            )}
                        </div>
                        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-[var(--border-subtle)]">
                            <button onClick={() => setPermissionUser(null)} className="btn btn-ghost" disabled={isSavingPerms}>Cancelar</button>
                            <button onClick={handleSavePermissions} className="btn btn-primary" disabled={isSavingPerms || isLoadingPerms}>
                                {isSavingPerms ? 'Salvando...' : 'Salvar Permissões'}
                            </button>
                        </div>
                    </Modal>
                )
            }
        </div >
    )
}

function TabButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${active
                ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
        >
            {label}
        </button>
    )
}

function ItemCard({ name, code, onDelete }: { name: string, code?: string | null, onDelete: () => void }) {
    return (
        <div className="glass-panel p-4 flex justify-between items-center group">
            <div className="overflow-hidden">
                {code && <span className="text-xs font-mono text-[var(--text-tertiary)] block mb-1">{code}</span>}
                <span className="font-semibold text-[var(--text-primary)] truncate block" title={name}>{name}</span>
            </div>
            <button
                onClick={onDelete}
                className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-500/10 rounded transition-all flex-shrink-0 ml-2"
                title="Excluir"
            >
                &times;
            </button>
        </div>
    )
}

function UserCard({ user, onDelete, onManagePermissions, onEdit }: { user: User, onDelete: () => void, onManagePermissions: () => void, onEdit: () => void }) {
    return (
        <div className="glass-panel p-4 flex justify-between items-center group">
            <div className="overflow-hidden">
                <span className="font-semibold text-[var(--text-primary)] block truncate" title={user.name}>{user.name}</span>
                <span className="text-xs text-[var(--text-secondary)] block truncate" title={user.email}>{user.email}</span>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full mt-2 inline-block ${user.role === 'ADMIN' ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]' : 'bg-[var(--bg-surface-hover)] text-[var(--text-tertiary)]'}`}>
                    {user.role}
                </span>
            </div>
            <div className="flex gap-2">
                <button
                    onClick={onEdit}
                    className="opacity-0 group-hover:opacity-100 p-2 text-blue-500 hover:bg-blue-500/10 rounded transition-all flex-shrink-0"
                    title="Editar"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                </button>
                <button
                    onClick={onManagePermissions}
                    className="opacity-0 group-hover:opacity-100 p-2 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 rounded transition-all flex-shrink-0"
                    title="Gerenciar Permissões"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </button>
                <button
                    onClick={onDelete}
                    className="opacity-0 group-hover:opacity-100 p-2 text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded transition-all flex-shrink-0"
                    title="Excluir"
                >
                    &times;
                </button>
            </div>
        </div>
    )
}

function EmptyState() {
    return (
        <div className="col-span-full py-12 text-center text-[var(--text-tertiary)] border border-dashed border-[var(--border-subtle)] rounded-lg">
            Nenhum item cadastrado.
        </div>
    )
}

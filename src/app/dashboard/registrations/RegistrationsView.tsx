'use client'

import { useState } from 'react'
import { Modal } from '@/app/components/Modal'
import {
    createCompany, updateCompany, deleteCompany,
    createDepartment, updateDepartment, deleteDepartment,
    createCostCenter, updateCostCenter, deleteCostCenter,
    createClient, updateClient, deleteClient,
    createExpenseCenter, updateExpenseCenter, deleteExpenseCenter,
    createCity, updateCity, deleteCity,
    createCostCenterGroup, updateCostCenterGroup, deleteCostCenterGroup,
    createCostCenterSegment, updateCostCenterSegment, deleteCostCenterSegment
} from '@/app/actions/registrations'

type EntityType = 'COMPANY' | 'DEPARTMENT' | 'COST_CENTER' | 'CLIENT' | 'EXPENSE_CENTER' | 'CITY' | 'CC_GROUP' | 'CC_SEGMENT'

interface BaseEntity {
    id: string
    name: string
    code?: string | null
    companyId?: string | null
    groupingId?: string | null
    costCenterId?: string | null
    clientId?: string | null
    cityId?: string | null
    groupId?: string | null
    segmentId?: string | null
    state?: string | null // UF for cities
}

export function RegistrationsView({
    companies,
    departments,
    costCenters,
    clients,
    expenseCenters,
    cities,
    costCenterGroups,
    costCenterSegments
}: {
    companies: BaseEntity[]
    departments: BaseEntity[]
    costCenters: BaseEntity[]
    clients: BaseEntity[]
    expenseCenters: BaseEntity[]
    cities: BaseEntity[]
    costCenterGroups: BaseEntity[]
    costCenterSegments: BaseEntity[]
}) {
    const [activeTab, setActiveTab] = useState<EntityType>('COMPANY')
    const [searchTerm, setSearchTerm] = useState('')

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingEntity, setEditingEntity] = useState<BaseEntity | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        companyId: '',
        groupingId: '',
        costCenterId: '',
        clientId: '',
        cityId: '',
        groupId: '',
        segmentId: '',
        state: '' // UF
    })

    const tabs: { id: EntityType, label: string }[] = [
        { id: 'COMPANY', label: 'Empresas' },
        { id: 'DEPARTMENT', label: 'Departamentos' },
        { id: 'COST_CENTER', label: 'Centros de Custo' },
        { id: 'CLIENT', label: 'Clientes' },
        { id: 'EXPENSE_CENTER', label: 'Centros de Despesa' },
        { id: 'CITY', label: 'Cidades' },
        { id: 'CC_GROUP', label: 'Agrupamentos' },
        { id: 'CC_SEGMENT', label: 'Seguimentos' },
    ]

    const getCurrentList = () => {
        switch (activeTab) {
            case 'COMPANY': return companies
            case 'DEPARTMENT': return departments
            case 'COST_CENTER': return costCenters
            case 'CLIENT': return clients
            case 'EXPENSE_CENTER': return expenseCenters
            case 'CITY': return cities
            case 'CC_GROUP': return costCenterGroups
            case 'CC_SEGMENT': return costCenterSegments
            default: return []
        }
    }

    const filteredList = getCurrentList().filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.code && item.code.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    const handleOpenModal = (entity?: BaseEntity) => {
        if (entity) {
            setEditingEntity(entity)
            setFormData({
                name: entity.name,
                code: entity.code || '',
                companyId: entity.companyId || '',
                groupingId: entity.groupingId || '',
                costCenterId: entity.costCenterId || '',
                clientId: entity.clientId || '',
                cityId: entity.cityId || '',
                groupId: entity.groupId || '',
                segmentId: entity.segmentId || '',
                state: entity.state || ''
            })
        } else {
            setEditingEntity(null)
            setFormData({
                name: '',
                code: '',
                companyId: '',
                groupingId: '',
                costCenterId: '',
                clientId: '',
                cityId: '',
                groupId: '',
                segmentId: '',
                state: ''
            })
        }
        setIsModalOpen(true)
    }

    const handleSave = async () => {
        try {
            const isEdit = !!editingEntity
            const basicData = {
                name: formData.name,
                code: formData.code || undefined,
            }

            switch (activeTab) {
                case 'COMPANY':
                    isEdit ? await updateCompany(editingEntity!.id, basicData) : await createCompany(basicData)
                    break
                case 'DEPARTMENT':
                    if (!formData.companyId) throw new Error('Selecione uma Empresa.')
                    const deptData = { name: basicData.name, companyId: formData.companyId }
                    isEdit ? await updateDepartment(editingEntity!.id, deptData) : await createDepartment(deptData)
                    break
                case 'COST_CENTER':
                    if (!formData.groupingId) throw new Error('Selecione um Departamento.')
                    if (!formData.clientId) throw new Error('Selecione um Cliente.')
                    if (!formData.cityId) throw new Error('Selecione uma Cidade.')
                    if (!formData.groupId) throw new Error('Selecione um Agrupamento.')
                    if (!formData.segmentId) throw new Error('Selecione um Seguimento.')

                    const ccData = {
                        ...basicData,
                        groupingId: formData.groupingId,
                        clientId: formData.clientId,
                        cityId: formData.cityId,
                        groupId: formData.groupId,
                        segmentId: formData.segmentId
                    }
                    isEdit ? await updateCostCenter(editingEntity!.id, ccData) : await createCostCenter(ccData)
                    break
                case 'CLIENT':
                    isEdit ? await updateClient(editingEntity!.id, { name: basicData.name }) : await createClient({ name: basicData.name })
                    break
                case 'EXPENSE_CENTER':
                    if (!formData.groupingId) throw new Error('Selecione um Departamento.')
                    const expData = { name: basicData.name, groupingId: formData.groupingId }
                    isEdit ? await updateExpenseCenter(editingEntity!.id, expData) : await createExpenseCenter(expData)
                    break
                case 'CITY':
                    if (!formData.state) throw new Error('Informe o UF.')
                    const cityData = { name: basicData.name, state: formData.state }
                    isEdit ? await updateCity(editingEntity!.id, cityData) : await createCity(cityData)
                    break
                case 'CC_GROUP':
                    isEdit ? await updateCostCenterGroup(editingEntity!.id, { name: basicData.name }) : await createCostCenterGroup({ name: basicData.name })
                    break
                case 'CC_SEGMENT':
                    isEdit ? await updateCostCenterSegment(editingEntity!.id, { name: basicData.name }) : await createCostCenterSegment({ name: basicData.name })
                    break
            }
            setIsModalOpen(false)
        } catch (error: any) {
            alert(error.message || 'Erro ao salvar')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir?')) return
        try {
            switch (activeTab) {
                case 'COMPANY': await deleteCompany(id); break
                case 'DEPARTMENT': await deleteDepartment(id); break
                case 'COST_CENTER': await deleteCostCenter(id); break
                case 'CLIENT': await deleteClient(id); break
                case 'EXPENSE_CENTER': await deleteExpenseCenter(id); break
                case 'CITY': await deleteCity(id); break
                case 'CC_GROUP': await deleteCostCenterGroup(id); break
                case 'CC_SEGMENT': await deleteCostCenterSegment(id); break
            }
        } catch (error: any) {
            alert(error.message || 'Erro ao excluir')
        }
    }

    const getLinkedName = (id: string | null | undefined, list: BaseEntity[]) => {
        if (!id) return '-'
        return list.find(l => l.id === id)?.name || '-'
    }

    const showCodeField = ['COMPANY', 'COST_CENTER', 'DEPARTMENT', 'EXPENSE_CENTER'].includes(activeTab)

    return (
        <div className="flex flex-col h-full bg-[var(--bg-main)]">
            <div className="p-6 pb-0 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Cadastros</h1>
                <div className="flex gap-6 overflow-x-auto no-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id)
                                setSearchTerm('')
                            }}
                            className={`pb-3 px-1 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === tab.id
                                ? 'text-[var(--accent-primary)]'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                }`}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--accent-primary)] rounded-t-full" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-6 flex justify-between items-center">
                <div className="relative w-64">
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="input-outline w-full pl-8"
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">🔍</span>
                </div>
                <button onClick={() => handleOpenModal()} className="btn btn-primary">
                    + Novo Item
                </button>
            </div>

            <div className="flex-1 overflow-auto px-6 pb-6">
                <div className="bg-[var(--bg-surface)] rounded-lg border border-[var(--border-subtle)] overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[var(--bg-main)] text-xs uppercase tracking-wider text-[var(--text-secondary)] font-semibold border-b border-[var(--border-subtle)]">
                                {showCodeField && <th className="p-4 w-32 border-r border-[var(--border-subtle)]">Código</th>}
                                <th className="p-4">Nome</th>

                                {activeTab === 'CITY' && <th className="p-4 text-center border-l border-[var(--border-subtle)]">UF</th>}

                                {activeTab === 'DEPARTMENT' && <th className="p-4 border-l border-[var(--border-subtle)]">Empresa</th>}

                                {activeTab === 'COST_CENTER' && (
                                    <>
                                        <th className="p-4 border-l border-[var(--border-subtle)]">Depto</th>
                                        <th className="p-4 border-l border-[var(--border-subtle)]">Cliente</th>
                                        <th className="p-4 border-l border-[var(--border-subtle)]">Cidade/UF</th>
                                    </>
                                )}

                                {activeTab === 'EXPENSE_CENTER' && <th className="p-4 border-l border-[var(--border-subtle)]">Departamento</th>}

                                <th className="p-4 w-32 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-subtle)]">
                            {filteredList.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="p-8 text-center text-[var(--text-secondary)]">
                                        Nenhum registro encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredList.map(item => (
                                    <tr key={item.id} className="group hover:bg-[var(--bg-surface-hover)] transition-colors">
                                        {showCodeField && (
                                            <td className="p-4 font-mono text-sm text-[var(--text-secondary)] border-r border-[var(--border-subtle)]">
                                                {item.code || '-'}
                                            </td>
                                        )}
                                        <td className="p-4 font-medium text-[var(--text-primary)]">
                                            {item.name}
                                        </td>

                                        {activeTab === 'CITY' && (
                                            <td className="p-4 text-center text-[var(--text-secondary)] border-l border-[var(--border-subtle)] font-mono">
                                                {item.state}
                                            </td>
                                        )}

                                        {activeTab === 'DEPARTMENT' && (
                                            <td className="p-4 text-sm text-[var(--text-secondary)] border-l border-[var(--border-subtle)]">
                                                {getLinkedName(item.companyId, companies)}
                                            </td>
                                        )}

                                        {activeTab === 'COST_CENTER' && (
                                            <>
                                                <td className="p-4 text-sm text-[var(--text-secondary)] border-l border-[var(--border-subtle)]">
                                                    {getLinkedName(item.groupingId, departments)}
                                                </td>
                                                <td className="p-4 text-sm text-[var(--text-secondary)] border-l border-[var(--border-subtle)]">
                                                    {getLinkedName(item.clientId, clients)}
                                                </td>
                                                <td className="p-4 text-sm text-[var(--text-secondary)] border-l border-[var(--border-subtle)]">
                                                    {getLinkedName(item.cityId, cities)} / {cities.find(c => c.id === item.cityId)?.state || '-'}
                                                </td>
                                            </>
                                        )}

                                        {activeTab === 'EXPENSE_CENTER' && (
                                            <td className="p-4 text-sm text-[var(--text-secondary)] border-l border-[var(--border-subtle)]">
                                                {getLinkedName(item.groupingId, departments)}
                                            </td>
                                        )}

                                        <td className="p-4 text-right">
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(item)}
                                                    className="p-1 hover:bg-[var(--bg-main)] rounded text-[var(--text-secondary)] hover:text-[var(--accent-primary)]"
                                                    title="Editar"
                                                >
                                                    ✎
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-1 hover:bg-[var(--bg-main)] rounded text-[var(--text-secondary)] hover:text-[var(--danger)]"
                                                    title="Excluir"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`${editingEntity ? 'Editar' : 'Nova'} ${tabs.find(t => t.id === activeTab)?.label.slice(0, -1)}`}
            >
                <div className="space-y-4">
                    {activeTab === 'DEPARTMENT' && (
                        <div>
                            <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Empresa (Pai)</label>
                            <select
                                value={formData.companyId}
                                onChange={e => setFormData({ ...formData, companyId: e.target.value })}
                                className="input-outline w-full bg-[var(--bg-main)]"
                            >
                                <option value="">Selecione...</option>
                                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    )}

                    {activeTab === 'COST_CENTER' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Departamento (Pai)</label>
                                    <select
                                        value={formData.groupingId}
                                        onChange={e => setFormData({ ...formData, groupingId: e.target.value })}
                                        className="input-outline w-full bg-[var(--bg-main)]"
                                    >
                                        <option value="">Selecione...</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Cliente (Vínculo)</label>
                                    <select
                                        value={formData.clientId}
                                        onChange={e => setFormData({ ...formData, clientId: e.target.value })}
                                        className="input-outline w-full bg-[var(--bg-main)]"
                                    >
                                        <option value="">Selecione...</option>
                                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Cidade</label>
                                    <select
                                        value={formData.cityId}
                                        onChange={e => setFormData({ ...formData, cityId: e.target.value })}
                                        className="input-outline w-full bg-[var(--bg-main)]"
                                    >
                                        <option value="">Selecione...</option>
                                        {cities.map(c => <option key={c.id} value={c.id}>{c.name} ({c.state})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Agrupamento</label>
                                    <select
                                        value={formData.groupId}
                                        onChange={e => setFormData({ ...formData, groupId: e.target.value })}
                                        className="input-outline w-full bg-[var(--bg-main)]"
                                    >
                                        <option value="">Selecione...</option>
                                        {costCenterGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Seguimento</label>
                                <select
                                    value={formData.segmentId}
                                    onChange={e => setFormData({ ...formData, segmentId: e.target.value })}
                                    className="input-outline w-full bg-[var(--bg-main)]"
                                >
                                    <option value="">Selecione...</option>
                                    {costCenterSegments.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </>
                    )}

                    {activeTab === 'EXPENSE_CENTER' && (
                        <div>
                            <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Departamento (Pai)</label>
                            <select
                                value={formData.groupingId}
                                onChange={e => setFormData({ ...formData, groupingId: e.target.value })}
                                className="input-outline w-full bg-[var(--bg-main)]"
                            >
                                <option value="">Selecione...</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                    )}

                    {activeTab === 'CITY' && (
                        <div>
                            <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">UF (Estado)</label>
                            <input
                                type="text"
                                value={formData.state}
                                onChange={e => setFormData({ ...formData, state: e.target.value.toUpperCase().slice(0, 2) })}
                                className="input-outline"
                                placeholder="EX: SP"
                            />
                        </div>
                    )}

                    {showCodeField && (
                        <div>
                            <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Código</label>
                            <input
                                type="text"
                                value={formData.code}
                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                                className="input-outline"
                                placeholder="Ex: 001"
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Nome</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="input-outline"
                            placeholder="Nome..."
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost">Cancelar</button>
                        <button onClick={handleSave} className="btn btn-primary">Salvar</button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

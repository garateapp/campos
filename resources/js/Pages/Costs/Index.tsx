import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';

interface Cost {
    id: number;
    type: string;
    category: string;
    description: string;
    amount: number;
    currency: string;
    cost_date: string;
    field_name: string | null;
    planting_info: string | null;
}

interface CostsIndexProps {
    costs: Cost[];
    summary: {
        total: number;
        byType: Record<string, number>;
        byCategory: Record<string, number>;
    };
    fields: { id: number; name: string }[];
    filters: {
        type?: string;
        category?: string;
        field_id?: string;
        from?: string;
        to?: string;
    };
}

const typeLabels: Record<string, string> = {
    input: 'Insumos',
    labor: 'Mano de Obra',
    equipment: 'Maquinaria',
    transport: 'Transporte',
    other: 'Otros',
};

const categoryLabels: Record<string, string> = {
    fixed: 'Fijo',
    variable: 'Variable',
};

export default function Index({ costs, summary, fields, filters }: CostsIndexProps) {
    const [typeFilter, setTypeFilter] = useState(filters.type || '');
    const [fieldFilter, setFieldFilter] = useState(filters.field_id || '');

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value || undefined };
        router.get(route('costs.index'), newFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            Gestión de Costos
                        </h2>
                        <p className="text-sm text-gray-500">
                            Control de gastos por campo, cuartel y categoría
                        </p>
                    </div>
                    <Link
                        href={route('costs.create')}
                        className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-lg font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 transition ease-in-out duration-150"
                    >
                        + Registrar Gasto
                    </Link>
                </div>
            }
        >
            <Head title="Costos" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Gasto Total</p>
                            <p className="text-3xl font-black text-gray-900">${summary.total.toLocaleString()}</p>
                            <div className="mt-4 flex gap-4 text-xs font-medium">
                                <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded">Fijos: ${summary.byCategory.fixed?.toLocaleString() || '0'}</span>
                                <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded">Variables: ${summary.byCategory.variable?.toLocaleString() || '0'}</span>
                            </div>
                        </div>

                        <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Gasto por Tipo</p>
                            <div className="flex gap-8">
                                {Object.keys(typeLabels).map(type => (
                                    <div key={type}>
                                        <p className="text-xs text-gray-500">{typeLabels[type]}</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            ${(summary.byType[type] || 0).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="mb-6 flex flex-wrap gap-4">
                        <div className="w-full sm:w-48">
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Tipo</label>
                            <select
                                value={typeFilter}
                                onChange={(e) => {
                                    setTypeFilter(e.target.value);
                                    handleFilterChange('type', e.target.value);
                                }}
                                className="w-full border-gray-300 rounded-lg text-sm focus:ring-green-500 focus:border-green-500"
                            >
                                <option value="">Todos</option>
                                {Object.keys(typeLabels).map(type => <option key={type} value={type}>{typeLabels[type]}</option>)}
                            </select>
                        </div>
                        <div className="w-full sm:w-48">
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Campo</label>
                            <select
                                value={fieldFilter}
                                onChange={(e) => {
                                    setFieldFilter(e.target.value);
                                    handleFilterChange('field_id', e.target.value);
                                }}
                                className="w-full border-gray-300 rounded-lg text-sm focus:ring-green-500 focus:border-green-500"
                            >
                                <option value="">Todas</option>
                                {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Costs Table */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-xl border border-gray-100">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Descripción</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo/Categoaría</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Lugar / Cuartel</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Monto</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {costs.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-10 text-center text-gray-500">No se registraron costos con los filtros seleccionados.</td>
                                        </tr>
                                    ) : (
                                        costs.map((cost) => (
                                            <tr key={cost.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {cost.cost_date}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-bold text-gray-900">{cost.description}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                        {typeLabels[cost.type]}
                                                    </span>
                                                    <span className={`ml-2 text-xs ${cost.category === 'fixed' ? 'text-blue-600' : 'text-orange-600'}`}>
                                                        {categoryLabels[cost.category]}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{cost.field_name || 'General'}</div>
                                                    <div className="text-xs text-gray-500">{cost.planting_info}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-black text-gray-900">
                                                    ${cost.amount.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <Link href={route('costs.edit', cost.id)} className="text-green-600 hover:text-green-900 mr-4">
                                                        Editar
                                                    </Link>
                                                    <button
                                                        onClick={() => { if (confirm('¿Eliminar este registro?')) router.delete(route('costs.destroy', cost.id)) }}
                                                        className="text-red-400 hover:text-red-700"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

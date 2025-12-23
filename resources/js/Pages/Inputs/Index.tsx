import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';

interface Input {
    id: number;
    name: string;
    category_name: string;
    unit: string;
    current_stock: number;
    min_stock_alert: number | null;
    unit_cost: number | null;
    is_low_stock: boolean;
    total_value: number;
    field_name: string;
    field_id: number | null;
}

interface InputsIndexProps {
    inputs: Input[];
    filters: {
        input_category_id?: string;
        low_stock?: boolean;
        field_id?: string;
    };
    fields: Array<{ id: number; name: string }>;
    categories: Array<{ id: number; name: string }>;
}

export default function Index({ inputs, filters, fields, categories }: InputsIndexProps) {
    const [categoryFilter, setCategoryFilter] = useState(filters.input_category_id || '');
    const [lowStockOnly, setLowStockOnly] = useState(filters.low_stock || false);
    const [fieldFilter, setFieldFilter] = useState(filters.field_id || 'all');

    const handleFilterChange = (key: string, value: any) => {
        const newFilters = { ...filters, [key]: value || undefined };
        router.get(route('inputs.index'), newFilters, {
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
                            Inventario de Insumos
                        </h2>
                        <p className="text-sm text-gray-500">
                            Control de stock, costos y alertas de reposición
                        </p>
                    </div>
                    <Link
                        href={route('inputs.create')}
                        className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-lg font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 transition ease-in-out duration-150"
                    >
                        + Nuevo Insumo
                    </Link>
                </div>
            }
        >
            <Head title="Inventario" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Filters & Stats */}
                    <div className="flex flex-col md:flex-row justify-between gap-6 mb-6">
                        <div className="flex flex-wrap gap-4">
                            <div className="w-full sm:w-48">
                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Categoría</label>
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => {
                                        setCategoryFilter(e.target.value);
                                        handleFilterChange('input_category_id', e.target.value);
                                    }}
                                    className="w-full border-gray-300 rounded-lg text-sm focus:ring-green-500 focus:border-green-500"
                                >
                                    <option value="">Todas</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-full sm:w-48">
                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Parcela</label>
                                <select
                                    value={fieldFilter}
                                    onChange={(e) => {
                                        setFieldFilter(e.target.value);
                                        handleFilterChange('field_id', e.target.value);
                                    }}
                                    className="w-full border-gray-300 rounded-lg text-sm focus:ring-green-500 focus:border-green-500"
                                >
                                    <option value="all">Todas las parcelas</option>
                                    <option value="none">Bodega General</option>
                                    {fields.map(field => (
                                        <option key={field.id} value={field.id}>{field.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center pt-6">
                                <label className="inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={lowStockOnly}
                                        onChange={(e) => {
                                            setLowStockOnly(e.target.checked);
                                            handleFilterChange('low_stock', e.target.checked);
                                        }}
                                        className="rounded border-gray-300 text-red-600 shadow-sm focus:ring-red-500"
                                    />
                                    <span className="ml-2 text-sm font-medium text-gray-700">Solo stock bajo</span>
                                </label>
                            </div>
                        </div>

                        <div className="bg-white px-6 py-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-6">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Valor Total Inv.</p>
                                <p className="text-2xl font-black text-gray-900">
                                    ${inputs.reduce((sum, item) => sum + item.total_value, 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="h-10 w-px bg-gray-100"></div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Alertas</p>
                                <p className={`text-2xl font-black ${inputs.some(i => i.is_low_stock) ? 'text-red-600' : 'text-green-600'}`}>
                                    {inputs.filter(i => i.is_low_stock).length}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Inputs Grid */}
                    {inputs.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
                            No se encontraron insumos con los filtros aplicados.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {inputs.map((input) => (
                                <Link
                                    key={input.id}
                                    href={route('inputs.show', input.id)}
                                    className={`relative bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-all group ${input.is_low_stock ? 'border-red-200 ring-1 ring-red-100' : 'border-gray-100'
                                        }`}
                                >
                                    {input.is_low_stock && (
                                        <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">
                                            Stock Bajo
                                        </div>
                                    )}
                                    <div className="p-5">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{input.category_name}</p>
                                        <h3 className="font-bold text-gray-900 group-hover:text-green-600 transition-colors truncate mb-1" title={input.name}>
                                            {input.name}
                                        </h3>
                                        <p className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                                            <span>📍 {input.field_name}</span>
                                        </p>

                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-gray-500">Stock Actual:</span>
                                            <span className={`font-bold ${input.is_low_stock ? 'text-red-600' : 'text-gray-900'}`}>
                                                {input.current_stock} <span className="text-xs font-normal text-gray-400">{input.unit}</span>
                                            </span>
                                        </div>

                                        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-6 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${input.is_low_stock ? 'bg-red-500' : 'bg-green-500'}`}
                                                style={{ width: `${Math.min(100, (input.current_stock / (input.min_stock_alert || 1)) * 50)}%` }}
                                            ></div>
                                        </div>

                                        <div className="flex justify-between items-end border-t border-gray-50 pt-4">
                                            <div>
                                                <p className="text-[10px] text-gray-400 uppercase font-bold">Costo Unitario</p>
                                                <p className="font-bold text-gray-900">${input.unit_cost?.toLocaleString() || '0'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-gray-400 uppercase font-bold">Valor Stock</p>
                                                <p className="font-bold text-gray-900">${input.total_value.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

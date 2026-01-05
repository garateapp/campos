import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';

interface ProfitabilityRecord {
    field_id: number;
    field_name: string;
    crop_name: string | null;
    area: number | null;
    income: number;
    costs: {
        labor: number;
        inputs: number;
        other: number;
        total: number;
    };
    margin: number;
    margin_percent: number;
}

interface IndexProps {
    profitability: {
        by_field: ProfitabilityRecord[];
        total: {
            income: number;
            total_cost: number;
            margin: number;
            margin_percent: number;
        };
    };
    filters: {
        year: number;
    };
}

export default function Index({ profitability, filters }: IndexProps) {
    const [year, setYear] = useState(filters.year);

    const handleFilter = (newYear: number) => {
        setYear(newYear);
        router.get(route('profitability.index'), { year: newYear }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            Análisis de Rentabilidad
                        </h2>
                        <p className="text-sm text-gray-500">
                            Márgenes por Sector y Cultivo (Año {year})
                        </p>
                    </div>
                    <div>
                        <select
                            value={year}
                            onChange={(e) => handleFilter(Number(e.target.value))}
                            className="block w-32 rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                        >
                            {[2023, 2024, 2025, 2026].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
            }
        >
            <Head title="Rentabilidad" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Ingresos Totales (Venta)</p>
                            <p className="text-2xl font-bold text-blue-600">{formatCurrency(profitability.total.income)}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Costos Totales</p>
                            <p className="text-2xl font-bold text-red-600">{formatCurrency(profitability.total.total_cost)}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Margen Contribución</p>
                            <p className={`text-2xl font-bold ${profitability.total.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(profitability.total.margin)}
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">% Rentabilidad</p>
                            <p className={`text-2xl font-bold ${profitability.total.margin_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {profitability.total.margin_percent.toFixed(1)}%
                            </p>
                        </div>
                    </div>

                    {/* Detailed Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-800">Detalle por Sector</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sector / Cultivo</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Superficie</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-blue-600 uppercase tracking-wider bg-blue-50/30">Ingresos (+)</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-red-600 uppercase tracking-wider bg-red-50/30">Labor (-)</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-red-600 uppercase tracking-wider bg-red-50/30">Insumos (-)</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-red-600 uppercase tracking-wider bg-red-50/30">Otros (-)</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Margen ($)</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">%</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {profitability.by_field.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500">
                                                No hay datos registrados para este año.
                                            </td>
                                        </tr>
                                    ) : (
                                        profitability.by_field.map((record) => (
                                            <tr key={record.field_id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{record.field_name}</div>
                                                    <div className="text-xs text-gray-500">{record.crop_name}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                                    {record.area ? `${Number(record.area).toFixed(1)} ha` : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-blue-700 bg-blue-50/10">
                                                    {formatCurrency(record.income)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600 bg-red-50/10">
                                                    {formatCurrency(record.costs.labor)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600 bg-red-50/10">
                                                    {formatCurrency(record.costs.inputs)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600 bg-red-50/10">
                                                    {formatCurrency(record.costs.other)}
                                                </td>
                                                <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-bold ${record.margin >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                                    {formatCurrency(record.margin)}
                                                </td>
                                                <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-bold ${record.margin_percent >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                                    {record.margin_percent.toFixed(1)}%
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

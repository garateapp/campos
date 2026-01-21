import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';

interface HarvestCollectionRow {
    collection_date: string;
    field_id: number;
    field_name: string;
    container_id: number;
    container_name: string;
    total_quantity: number;
}

interface Props {
    rows: HarvestCollectionRow[];
    fields: { id: number; name: string }[];
    filters: {
        start_date: string;
        end_date: string;
        field_id: number | string | null;
    };
}

export default function HarvestCollectionsDaily({ rows, fields, filters }: Props) {
    const [form, setForm] = useState({
        start_date: filters.start_date,
        end_date: filters.end_date,
        field_id: filters.field_id ?? '',
    });

    const totalQuantity = rows.reduce((sum, row) => sum + Number(row.total_quantity || 0), 0);

    const applyFilters = () => {
        router.get(
            route('reports.harvest-collections'),
            {
                start_date: form.start_date,
                end_date: form.end_date,
                field_id: form.field_id || undefined,
            },
            { preserveScroll: true, preserveState: true }
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={route('reports.index')} className="text-gray-500 hover:text-gray-700">
                            Volver
                        </Link>
                        <div>
                            <h2 className="text-xl font-semibold leading-tight text-gray-800">
                                Cosecha Recolectada por Dia
                            </h2>
                            <p className="text-sm text-gray-500">
                                Totales diarios por sector y envase.
                            </p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Cosecha Recolectada por Dia" />

            <div className="py-6">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg border border-gray-100 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Fecha Inicio</label>
                                <input
                                    type="date"
                                    value={form.start_date}
                                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Fecha Fin</label>
                                <input
                                    type="date"
                                    value={form.end_date}
                                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Sector</label>
                                <select
                                    value={form.field_id}
                                    onChange={(e) => setForm({ ...form, field_id: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                >
                                    <option value="">Todos</option>
                                    {fields.map((field) => (
                                        <option key={field.id} value={field.id}>
                                            {field.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex md:justify-end">
                                <button
                                    onClick={applyFilters}
                                    className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-lg font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 transition ease-in-out duration-150"
                                >
                                    Aplicar
                                </button>
                            </div>
                        </div>

                        <div className="mt-6 border-t border-gray-100 pt-4">
                            <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                                <div>
                                    <span className="font-semibold text-gray-900">
                                        {totalQuantity.toLocaleString('es-CL', { maximumFractionDigits: 2 })}
                                    </span>{' '}
                                    total recolectado
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sector</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Envase</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {rows.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                                                No hay registros para el periodo seleccionado.
                                            </td>
                                        </tr>
                                    ) : (
                                        rows.map((row, index) => (
                                            <tr key={`${row.collection_date}-${row.field_id}-${row.container_id}-${index}`} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {row.collection_date}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {row.field_name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {row.container_name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-700 font-semibold">
                                                    {Number(row.total_quantity).toLocaleString('es-CL', { maximumFractionDigits: 2 })}
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

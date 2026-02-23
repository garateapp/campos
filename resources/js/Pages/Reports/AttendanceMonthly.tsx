import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';

interface AttendanceMonthlyRow {
    worker_id: number;
    worker_name: string;
    contractor_id: number | null;
    contractor_name: string;
    field_id: number | null;
    field_name: string;
    attendances_count: number;
    first_attendance_date: string | null;
    last_attendance_date: string | null;
}

interface Props {
    rows: AttendanceMonthlyRow[];
    fields: { id: number; name: string }[];
    contractors: { id: number; business_name: string }[];
    filters: {
        month: string;
        field_id: number | string | null;
        contractor_id: number | string | null;
    };
}

export default function AttendanceMonthly({ rows, fields, contractors, filters }: Props) {
    const [form, setForm] = useState({
        month: filters.month,
        field_id: filters.field_id ?? '',
        contractor_id: filters.contractor_id ?? '',
    });

    const totalAttendances = rows.reduce((sum, row) => sum + Number(row.attendances_count || 0), 0);
    const totalWorkers = rows.length;

    const applyFilters = () => {
        router.get(
            route('reports.attendance-monthly'),
            {
                month: form.month,
                field_id: form.field_id || undefined,
                contractor_id: form.contractor_id || undefined,
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
                                Asistencia Mensual Acumulada
                            </h2>
                            <p className="text-sm text-gray-500">
                                Totales del mes por trabajador.
                            </p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Asistencia Mensual Acumulada" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg border border-gray-100 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Mes</label>
                                <input
                                    type="month"
                                    value={form.month}
                                    onChange={(e) => setForm({ ...form, month: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Predio</label>
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Contratista</label>
                                <select
                                    value={form.contractor_id}
                                    onChange={(e) => setForm({ ...form, contractor_id: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                >
                                    <option value="">Todos</option>
                                    {contractors.map((contractor) => (
                                        <option key={contractor.id} value={contractor.id}>
                                            {contractor.business_name}
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
                                        {totalAttendances.toLocaleString('es-CL')}
                                    </span>{' '}
                                    asistencias acumuladas
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-900">
                                        {totalWorkers.toLocaleString('es-CL')}
                                    </span>{' '}
                                    trabajadores
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Predio</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contratista</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trabajador</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Asistencias Mes</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Primera Fecha</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ultima Fecha</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {rows.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                                No hay asistencias para el mes seleccionado.
                                            </td>
                                        </tr>
                                    ) : (
                                        rows.map((row) => (
                                            <tr key={`${row.worker_id}-${row.field_id ?? 'sin-predio'}`} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {row.field_name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {row.contractor_name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {row.worker_name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-700 font-semibold">
                                                    {Number(row.attendances_count).toLocaleString('es-CL')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {row.first_attendance_date ?? '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {row.last_attendance_date ?? '-'}
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

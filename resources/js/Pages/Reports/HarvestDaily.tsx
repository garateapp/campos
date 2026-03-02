import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useMemo, useState } from 'react';

interface HarvestDailyRow {
    harvest_date: string;
    field_id: number;
    field_name: string;
    total_kg: number;
    total_value: number;
}

interface Props {
    rows: HarvestDailyRow[];
    fields: { id: number; name: string }[];
    filters: {
        start_date: string;
        end_date: string;
        field_id: number | string | null;
    };
}

const formatNumber = (value: number, maximumFractionDigits = 2) =>
    new Intl.NumberFormat('es-CL', { maximumFractionDigits }).format(value);

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        maximumFractionDigits: 0,
    }).format(value);

const formatDate = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) {
        return value;
    }

    return new Intl.DateTimeFormat('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(year, month - 1, day));
};

export default function HarvestDaily({ rows, fields, filters }: Props) {
    const [form, setForm] = useState({
        start_date: filters.start_date,
        end_date: filters.end_date,
        field_id: filters.field_id ?? '',
    });

    const summary = useMemo(() => {
        let totalKg = 0;
        let totalValue = 0;
        const uniqueDates = new Set<string>();
        const uniqueFields = new Set<number>();
        const byField = new Map<number, {
            fieldId: number;
            fieldName: string;
            totalKg: number;
            totalValue: number;
            records: number;
        }>();
        const byDate = new Map<string, {
            date: string;
            totalKg: number;
            totalValue: number;
        }>();

        rows.forEach((row) => {
            const kg = Number(row.total_kg || 0);
            const value = Number(row.total_value || 0);

            totalKg += kg;
            totalValue += value;
            uniqueDates.add(row.harvest_date);
            uniqueFields.add(row.field_id);

            const fieldSummary = byField.get(row.field_id) ?? {
                fieldId: row.field_id,
                fieldName: row.field_name,
                totalKg: 0,
                totalValue: 0,
                records: 0,
            };
            fieldSummary.totalKg += kg;
            fieldSummary.totalValue += value;
            fieldSummary.records += 1;
            byField.set(row.field_id, fieldSummary);

            const dateSummary = byDate.get(row.harvest_date) ?? {
                date: row.harvest_date,
                totalKg: 0,
                totalValue: 0,
            };
            dateSummary.totalKg += kg;
            dateSummary.totalValue += value;
            byDate.set(row.harvest_date, dateSummary);
        });

        const fieldRanking = Array.from(byField.values()).sort((a, b) => b.totalKg - a.totalKg);
        const dateRanking = Array.from(byDate.values()).sort((a, b) => b.totalKg - a.totalKg);
        const totalDays = uniqueDates.size;
        const totalFields = uniqueFields.size;

        return {
            totalKg,
            totalValue,
            totalDays,
            totalFields,
            averageKgPerDay: totalDays > 0 ? totalKg / totalDays : 0,
            averageValuePerDay: totalDays > 0 ? totalValue / totalDays : 0,
            topField: fieldRanking[0] ?? null,
            topDate: dateRanking[0] ?? null,
            fieldRanking,
        };
    }, [rows]);

    const applyFilters = () => {
        router.get(
            route('reports.harvest-daily'),
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
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('reports.index')}
                            className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700"
                        >
                            <span className="material-symbols-outlined text-base">arrow_back</span>
                            Volver
                        </Link>
                        <div>
                            <h2 className="text-xl font-semibold leading-tight text-gray-800">
                                Cosecha por Campo y Dia
                            </h2>
                            <p className="text-sm text-gray-500">
                                Analisis diario de produccion y valor estimado.
                            </p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Cosecha por Campo y Dia" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <section className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-white p-5 shadow-sm">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-5 md:items-end">
                            <div className="md:col-span-1">
                                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Fecha Inicio</label>
                                <input
                                    type="date"
                                    value={form.start_date}
                                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                                    className="mt-1 block h-11 w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-green-500 focus:ring-green-500"
                                />
                            </div>

                            <div className="md:col-span-1">
                                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Fecha Fin</label>
                                <input
                                    type="date"
                                    value={form.end_date}
                                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                                    className="mt-1 block h-11 w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-green-500 focus:ring-green-500"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Campo</label>
                                <select
                                    value={form.field_id}
                                    onChange={(e) => setForm({ ...form, field_id: e.target.value })}
                                    className="mt-1 block h-11 w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-green-500 focus:ring-green-500"
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
                                    className="inline-flex h-11 items-center justify-center rounded-lg border border-transparent bg-green-600 px-5 text-sm font-semibold text-white transition hover:bg-green-700"
                                >
                                    Aplicar filtros
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <p>
                                Periodo:{' '}
                                <span className="font-semibold text-gray-900">
                                    {formatDate(form.start_date)} - {formatDate(form.end_date)}
                                </span>
                            </p>
                            <p>
                                Registros:{' '}
                                <span className="font-semibold text-gray-900">{formatNumber(rows.length, 0)}</span>
                            </p>
                        </div>
                    </section>

                    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Kg Totales</p>
                            <p className="mt-2 text-2xl font-bold text-gray-900">{formatNumber(summary.totalKg)} kg</p>
                        </article>
                        <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Valor Estimado</p>
                            <p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(summary.totalValue)}</p>
                        </article>
                        <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Dias con Cosecha</p>
                            <p className="mt-2 text-2xl font-bold text-gray-900">{formatNumber(summary.totalDays, 0)}</p>
                        </article>
                        <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Campos Reportados</p>
                            <p className="mt-2 text-2xl font-bold text-gray-900">{formatNumber(summary.totalFields, 0)}</p>
                        </article>
                    </section>

                    {rows.length === 0 ? (
                        <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
                            <p className="text-lg font-semibold text-gray-800">Sin datos para el periodo seleccionado</p>
                            <p className="mt-2 text-sm text-gray-500">
                                Ajusta las fechas o el campo para consultar registros de cosecha.
                            </p>
                        </section>
                    ) : (
                        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm xl:col-span-2">
                                <div className="border-b border-gray-100 px-5 py-4">
                                    <h3 className="text-base font-semibold text-gray-900">Detalle Diario</h3>
                                    <p className="text-sm text-gray-500">Rendimiento por campo y fecha.</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Fecha</th>
                                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Campo</th>
                                                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Kilos</th>
                                                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Valor</th>
                                                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">$ / Kg</th>
                                                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">% Kg</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white">
                                            {rows.map((row, index) => {
                                                const kg = Number(row.total_kg || 0);
                                                const value = Number(row.total_value || 0);
                                                const valuePerKg = kg > 0 ? value / kg : 0;
                                                const participation = summary.totalKg > 0 ? (kg / summary.totalKg) * 100 : 0;

                                                return (
                                                    <tr
                                                        key={`${row.harvest_date}-${row.field_id}-${index}`}
                                                        className="transition-colors hover:bg-gray-50"
                                                    >
                                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                                                            {formatDate(row.harvest_date)}
                                                        </td>
                                                        <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-gray-900">
                                                            {row.field_name}
                                                        </td>
                                                        <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-emerald-700">
                                                            {formatNumber(kg)} kg
                                                        </td>
                                                        <td className="whitespace-nowrap px-5 py-4 text-right text-sm text-gray-700">
                                                            {formatCurrency(value)}
                                                        </td>
                                                        <td className="whitespace-nowrap px-5 py-4 text-right text-sm text-gray-700">
                                                            {formatCurrency(valuePerKg)}
                                                        </td>
                                                        <td className="whitespace-nowrap px-5 py-4 text-right text-sm text-gray-700">
                                                            {formatNumber(participation, 1)}%
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                                    <h3 className="text-base font-semibold text-gray-900">Insights Rapidos</h3>
                                    <div className="mt-4 space-y-3 text-sm text-gray-600">
                                        <div className="rounded-lg bg-emerald-50 p-3">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Campo Lider</p>
                                            <p className="mt-1 font-semibold text-gray-900">
                                                {summary.topField?.fieldName ?? '-'}
                                            </p>
                                            <p className="text-emerald-700">
                                                {summary.topField ? `${formatNumber(summary.topField.totalKg)} kg` : 'Sin datos'}
                                            </p>
                                        </div>
                                        <div className="rounded-lg bg-blue-50 p-3">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Mejor Dia</p>
                                            <p className="mt-1 font-semibold text-gray-900">
                                                {summary.topDate ? formatDate(summary.topDate.date) : '-'}
                                            </p>
                                            <p className="text-blue-700">
                                                {summary.topDate ? `${formatNumber(summary.topDate.totalKg)} kg` : 'Sin datos'}
                                            </p>
                                        </div>
                                        <div className="rounded-lg bg-amber-50 p-3">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Promedio Diario</p>
                                            <p className="mt-1 font-semibold text-gray-900">
                                                {formatNumber(summary.averageKgPerDay)} kg
                                            </p>
                                            <p className="text-amber-700">
                                                {formatCurrency(summary.averageValuePerDay)}
                                            </p>
                                        </div>
                                    </div>
                                </article>

                                <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                                    <h3 className="text-base font-semibold text-gray-900">Resumen por Campo</h3>
                                    <ul className="mt-4 space-y-3">
                                        {summary.fieldRanking.slice(0, 6).map((field) => (
                                            <li
                                                key={field.fieldId}
                                                className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2"
                                            >
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{field.fieldName}</p>
                                                    <p className="text-xs text-gray-500">{formatNumber(field.records, 0)} dias reportados</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-emerald-700">{formatNumber(field.totalKg)} kg</p>
                                                    <p className="text-xs text-gray-500">{formatCurrency(field.totalValue)}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </article>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

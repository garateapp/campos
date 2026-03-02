import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useMemo, useState } from 'react';

interface HarvestCollectionRow {
    collection_date: string;
    field_id: number;
    field_name: string;
    worker_name: string;
    container_id: number;
    container_name: string;
    total_quantity: number;
    total_bins: number;
}

interface Props {
    rows: HarvestCollectionRow[];
    fields: { id: number; name: string }[];
    filters: {
        date: string;
        field_id: number | string | null;
    };
}

const formatNumber = (value: number, maximumFractionDigits = 2) =>
    new Intl.NumberFormat('es-CL', { maximumFractionDigits }).format(value);

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

export default function HarvestCollectionsDaily({ rows, fields, filters }: Props) {
    const [form, setForm] = useState({
        date: filters.date,
        field_id: filters.field_id ?? '',
    });

    const summary = useMemo(() => {
        let totalQuantity = 0;
        let totalBins = 0;
        const uniqueFields = new Set<number>();
        const uniqueWorkers = new Set<string>();
        const uniqueContainers = new Set<number>();
        const byWorker = new Map<string, {
            workerName: string;
            totalQuantity: number;
            totalBins: number;
            records: number;
        }>();
        const byContainer = new Map<number, {
            containerId: number;
            containerName: string;
            totalQuantity: number;
            totalBins: number;
        }>();
        const byField = new Map<number, {
            fieldId: number;
            fieldName: string;
            totalQuantity: number;
            totalBins: number;
        }>();

        rows.forEach((row) => {
            const quantity = Number(row.total_quantity || 0);
            const bins = Number(row.total_bins || 0);

            totalQuantity += quantity;
            totalBins += bins;
            uniqueFields.add(row.field_id);
            uniqueWorkers.add(row.worker_name);
            uniqueContainers.add(row.container_id);

            const workerSummary = byWorker.get(row.worker_name) ?? {
                workerName: row.worker_name,
                totalQuantity: 0,
                totalBins: 0,
                records: 0,
            };
            workerSummary.totalQuantity += quantity;
            workerSummary.totalBins += bins;
            workerSummary.records += 1;
            byWorker.set(row.worker_name, workerSummary);

            const containerSummary = byContainer.get(row.container_id) ?? {
                containerId: row.container_id,
                containerName: row.container_name,
                totalQuantity: 0,
                totalBins: 0,
            };
            containerSummary.totalQuantity += quantity;
            containerSummary.totalBins += bins;
            byContainer.set(row.container_id, containerSummary);

            const fieldSummary = byField.get(row.field_id) ?? {
                fieldId: row.field_id,
                fieldName: row.field_name,
                totalQuantity: 0,
                totalBins: 0,
            };
            fieldSummary.totalQuantity += quantity;
            fieldSummary.totalBins += bins;
            byField.set(row.field_id, fieldSummary);
        });

        const workerRanking = Array.from(byWorker.values()).sort((a, b) => b.totalQuantity - a.totalQuantity);
        const containerRanking = Array.from(byContainer.values()).sort((a, b) => b.totalQuantity - a.totalQuantity);
        const fieldRanking = Array.from(byField.values()).sort((a, b) => b.totalQuantity - a.totalQuantity);
        const totalWorkers = uniqueWorkers.size;

        return {
            totalQuantity,
            totalBins,
            totalFields: uniqueFields.size,
            totalWorkers,
            totalContainers: uniqueContainers.size,
            averageQuantityPerWorker: totalWorkers > 0 ? totalQuantity / totalWorkers : 0,
            averageBinsPerWorker: totalWorkers > 0 ? totalBins / totalWorkers : 0,
            topWorker: workerRanking[0] ?? null,
            topContainer: containerRanking[0] ?? null,
            workerRanking,
            containerRanking,
            fieldRanking,
        };
    }, [rows]);

    const applyFilters = () => {
        router.get(
            route('reports.harvest-collections'),
            {
                date: form.date,
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
                                Cosecha Recolectada por Dia
                            </h2>
                            <p className="text-sm text-gray-500">
                                Productividad diaria por campo, trabajador y envase.
                            </p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Cosecha Recolectada por Dia" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <section className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-white p-5 shadow-sm">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:items-end">
                            <div className="md:col-span-1">
                                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Fecha</label>
                                <input
                                    type="date"
                                    value={form.date}
                                    onChange={(e) => setForm({ ...form, date: e.target.value })}
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
                                Fecha consultada:{' '}
                                <span className="font-semibold text-gray-900">{formatDate(form.date)}</span>
                            </p>
                            <p>
                                Registros:{' '}
                                <span className="font-semibold text-gray-900">{formatNumber(rows.length, 0)}</span>
                            </p>
                        </div>
                    </section>

                    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Recolectado</p>
                            <p className="mt-2 text-2xl font-bold text-gray-900">{formatNumber(summary.totalQuantity)}</p>
                        </article>
                        <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Bins Estimados</p>
                            <p className="mt-2 text-2xl font-bold text-gray-900">{formatNumber(summary.totalBins)}</p>
                        </article>
                        <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Trabajadores</p>
                            <p className="mt-2 text-2xl font-bold text-gray-900">{formatNumber(summary.totalWorkers, 0)}</p>
                        </article>
                        <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Envases Usados</p>
                            <p className="mt-2 text-2xl font-bold text-gray-900">{formatNumber(summary.totalContainers, 0)}</p>
                        </article>
                    </section>

                    {rows.length === 0 ? (
                        <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
                            <p className="text-lg font-semibold text-gray-800">Sin registros para la fecha seleccionada</p>
                            <p className="mt-2 text-sm text-gray-500">
                                Revisa el campo o selecciona otra fecha para visualizar datos.
                            </p>
                        </section>
                    ) : (
                        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm xl:col-span-2">
                                <div className="border-b border-gray-100 px-5 py-4">
                                    <h3 className="text-base font-semibold text-gray-900">Detalle de Cosecha Recolectada</h3>
                                    <p className="text-sm text-gray-500">Consolidado por campo, trabajador y tipo de envase.</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Campo</th>
                                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Trabajador</th>
                                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Envase</th>
                                                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Cantidad</th>
                                                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Bins</th>
                                                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">% del Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white">
                                            {rows.map((row, index) => {
                                                const quantity = Number(row.total_quantity || 0);
                                                const bins = Number(row.total_bins || 0);
                                                const participation = summary.totalQuantity > 0
                                                    ? (quantity / summary.totalQuantity) * 100
                                                    : 0;

                                                return (
                                                    <tr
                                                        key={`${row.collection_date}-${row.field_id}-${row.container_id}-${index}`}
                                                        className="transition-colors hover:bg-gray-50"
                                                    >
                                                        <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-gray-900">
                                                            {row.field_name}
                                                        </td>
                                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                                                            {row.worker_name}
                                                        </td>
                                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                                                            {row.container_name}
                                                        </td>
                                                        <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-emerald-700">
                                                            {formatNumber(quantity)}
                                                        </td>
                                                        <td className="whitespace-nowrap px-5 py-4 text-right text-sm text-gray-700">
                                                            {formatNumber(bins)}
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
                                            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Trabajador Lider</p>
                                            <p className="mt-1 font-semibold text-gray-900">
                                                {summary.topWorker?.workerName ?? '-'}
                                            </p>
                                            <p className="text-emerald-700">
                                                {summary.topWorker ? `${formatNumber(summary.topWorker.totalQuantity)} recolectado` : 'Sin datos'}
                                            </p>
                                        </div>
                                        <div className="rounded-lg bg-blue-50 p-3">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Envase Principal</p>
                                            <p className="mt-1 font-semibold text-gray-900">
                                                {summary.topContainer?.containerName ?? '-'}
                                            </p>
                                            <p className="text-blue-700">
                                                {summary.topContainer ? `${formatNumber(summary.topContainer.totalQuantity)} total` : 'Sin datos'}
                                            </p>
                                        </div>
                                        <div className="rounded-lg bg-amber-50 p-3">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Promedio por Trabajador</p>
                                            <p className="mt-1 font-semibold text-gray-900">
                                                {formatNumber(summary.averageQuantityPerWorker)} recolectado
                                            </p>
                                            <p className="text-amber-700">
                                                {formatNumber(summary.averageBinsPerWorker)} bins
                                            </p>
                                        </div>
                                    </div>
                                </article>

                                <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                                    <h3 className="text-base font-semibold text-gray-900">Ranking de Trabajadores</h3>
                                    <ul className="mt-4 space-y-3">
                                        {summary.workerRanking.slice(0, 6).map((worker, index) => (
                                            <li
                                                key={`${worker.workerName}-${index}`}
                                                className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2"
                                            >
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{worker.workerName}</p>
                                                    <p className="text-xs text-gray-500">{formatNumber(worker.records, 0)} registros</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-emerald-700">{formatNumber(worker.totalQuantity)}</p>
                                                    <p className="text-xs text-gray-500">{formatNumber(worker.totalBins)} bins</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </article>
                            </div>
                        </section>
                    )}

                    {rows.length > 0 && (
                        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                                <h3 className="text-base font-semibold text-gray-900">Totales por Envase</h3>
                                <ul className="mt-4 space-y-3">
                                    {summary.containerRanking.slice(0, 6).map((container) => (
                                        <li
                                            key={container.containerId}
                                            className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2"
                                        >
                                            <p className="text-sm font-semibold text-gray-900">{container.containerName}</p>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-emerald-700">{formatNumber(container.totalQuantity)}</p>
                                                <p className="text-xs text-gray-500">{formatNumber(container.totalBins)} bins</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </article>

                            <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                                <h3 className="text-base font-semibold text-gray-900">Totales por Campo</h3>
                                <ul className="mt-4 space-y-3">
                                    {summary.fieldRanking.slice(0, 6).map((field) => (
                                        <li
                                            key={field.fieldId}
                                            className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2"
                                        >
                                            <p className="text-sm font-semibold text-gray-900">{field.fieldName}</p>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-emerald-700">{formatNumber(field.totalQuantity)}</p>
                                                <p className="text-xs text-gray-500">{formatNumber(field.totalBins)} bins</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </article>
                        </section>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';
import { analyzeWorkVideo } from '@/Services/geminiService';

interface LaborPlanning {
    id: number;
    year: number;
    month: number;
    field?: { id: number; name: string };
    planting?: {
        crop?: {
            name: string;
            species?: { id: number; name: string };
            varietyEntity?: { id: number; name: string };
            variety?: string | null;
            varieties?: { id: number; name: string }[];
        };
    };
    species?: { id: number; name: string };
    varieties?: { id: number; name: string }[];
    planting_year: number | null;
    cc: string | null;
    hectares: number | null;
    num_plants: number | null;
    kilos: number | null;
    meters: number | null;
    num_jh_planned: number | null;
    avg_yield_planned: number | null;
    total_jh_planned: number | null;
    effective_days_planned: number | null;
    taskType?: { id: number; name: string };
    laborType?: { id: number; name: string };
    unitOfMeasure?: { id: number; name: string; code?: string };
    value_planned: number | null;
    total_value_planned: number | null;
    avg_yield_actual: number | null;
    total_jh_actual: number | null;
    jh_ha_actual: number | null;
    value_actual: number | null;
    total_value_actual: number | null;
}

interface IndexProps {
    plannings: LaborPlanning[];
    filters: {
        year: number;
        month: number;
    };
    summary: {
        total_jh_planned: number;
        total_jh_actual: number;
        total_value_planned: number;
        total_value_actual: number;
    };
}

const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function Index({ plannings, filters, summary }: IndexProps) {
    const [year, setYear] = useState(filters.year);
    const [month, setMonth] = useState(filters.month);
    const [isAuditing, setIsAuditing] = useState(false);
    const [auditResult, setAuditResult] = useState<string | null>(null);
    const { flash, errors } = usePage().props as any;

    const handleFilter = (newYear: number, newMonth: number) => {
        router.get(route('labor-plannings.index'), { year: newYear, month: newMonth }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDelete = (id: number, labor: string) => {
        if (confirm(`¿Estás seguro de eliminar la planificación de "${labor}"?`)) {
            router.delete(route('labor-plannings.destroy', id));
        }
    };

    const handleAIAudit = async () => {
        setIsAuditing(true);
        setAuditResult(null);
        try {
            const prompt = `Analiza la eficiencia de las siguientes labores planificadas para ${months[month - 1]} ${year}: ${JSON.stringify(plannings.map(p => ({ labor: p.taskType?.name, planned_jh: p.total_jh_planned, actual_jh: p.total_jh_actual })))}. Identifica posibles ineficiencias o desviaciones significativas y sugiere mejoras en español.`;
            const result = await analyzeWorkVideo("", prompt);
            setAuditResult(result);
        } catch (err) {
            console.error(err);
            setAuditResult("Error al realizar la auditoría. Verifica tu API Key.");
        } finally {
            setIsAuditing(false);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            Planificación de Labores
                        </h2>
                        <p className="text-sm text-gray-500">
                            Contraste de datos planificados vs. reales
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleAIAudit}
                            disabled={isAuditing}
                            className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-lg font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 transition ease-in-out duration-150 disabled:opacity-50"
                        >
                            {isAuditing ? 'Auditando...' : 'Auditoría IA'}
                        </button>
                        <label className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition ease-in-out duration-150 cursor-pointer">
                            Importar CSV
                            <input
                                type="file"
                                accept=".csv,text/csv"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        const file = e.target.files[0];
                                        router.post(route('labor-plannings.import'), { file }, {
                                            forceFormData: true,
                                            onFinish: () => { e.target.value = ''; },
                                        });
                                    }
                                }}
                            />
                        </label>
                        {errors?.file && <div className="text-xs text-red-600 self-center">{errors.file}</div>}
                        <Link
                            href={route('labor-plannings.create')}
                            className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-lg font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 transition ease-in-out duration-150"
                        >
                            + Nueva Planificación
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Planificación de Labores" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                    {(flash?.success || flash?.error || flash?.import_errors) && (
                        <div className="mb-4 space-y-2">
                            {flash?.success && <div className="p-3 rounded bg-green-100 text-green-800 text-sm">{flash.success}</div>}
                            {flash?.error && <div className="p-3 rounded bg-red-100 text-red-800 text-sm">{flash.error}</div>}
                            {flash?.import_errors && Array.isArray(flash.import_errors) && (
                                <div className="p-3 rounded bg-yellow-100 text-yellow-800 text-sm">
                                    <div className="font-semibold mb-1">Errores de importacion:</div>
                                    <ul className="list-disc list-inside space-y-1">
                                        {flash.import_errors.map((err: string, idx: number) => (
                                            <li key={idx}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Total JH Planificados</p>
                            <p className="text-2xl font-bold text-gray-800">{Number(summary.total_jh_planned).toFixed(2)}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Total JH Reales</p>
                            <p className="text-2xl font-bold text-green-600">{Number(summary.total_jh_actual).toFixed(2)}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Costo Planificado</p>
                            <p className="text-2xl font-bold text-gray-800">${Number(summary.total_value_planned).toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Costo Real</p>
                            <p className="text-2xl font-bold text-green-600">${Number(summary.total_value_actual).toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-end">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Año</label>
                            <select
                                value={year}
                                onChange={(e) => { setYear(Number(e.target.value)); handleFilter(Number(e.target.value), month); }}
                                className="block w-32 rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                            >
                                {[2024, 2025, 2026].map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Mes</label>
                            <select
                                value={month}
                                onChange={(e) => { setMonth(Number(e.target.value)); handleFilter(year, Number(e.target.value)); }}
                                className="block w-40 rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                            >
                                {months.map((m, i) => (
                                    <option key={i + 1} value={i + 1}>{m}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* AI Audit Result */}
                    {auditResult && (
                        <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-xl mb-6 shadow-sm relative animate-in fade-in slide-in-from-top-4 duration-500">
                            <button onClick={() => setAuditResult(null)} className="absolute top-4 right-4 text-indigo-400 hover:text-indigo-600 transition-colors">×</button>
                            <div className="flex items-center gap-2 mb-3 text-indigo-700">
                                <span className="material-symbols-outlined font-black">smart_toy</span>
                                <h3 className="font-bold text-sm uppercase tracking-widest">Resultado de Auditoría IA</h3>
                            </div>
                            <p className="text-sm text-indigo-900 leading-relaxed whitespace-pre-wrap">{auditResult}</p>
                        </div>
                    )}

                    {/* Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th rowSpan={2} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sector/Labor</th>
                                        <th rowSpan={2} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Especie/Var</th>
                                        <th colSpan={3} className="px-3 py-2 text-center text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50/50">Planificado</th>
                                        <th colSpan={3} className="px-3 py-2 text-center text-xs font-bold text-green-600 uppercase tracking-wider bg-green-50/50">Real</th>
                                        <th rowSpan={2} className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                    <tr>
                                        <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase bg-blue-50/20">JH</th>
                                        <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase bg-blue-50/20">Rend</th>
                                        <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase bg-blue-50/20">Total $</th>
                                        <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase bg-green-50/20">JH</th>
                                        <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase bg-green-50/20">Rend</th>
                                        <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase bg-green-50/20">Total $</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {plannings.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="px-6 py-10 text-center text-sm text-gray-500">
                                                No hay planificaciones para este periodo.
                                            </td>
                                        </tr>
                                    ) : (

                                        plannings.map((p) => (

                                            <tr key={p.id} className="hover:bg-gray-50">
                                                <td className="px-3 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{p.field?.name || 'N/A'}</div>
                                                    <div className="text-xs text-gray-900 font-bold">{p.taskType?.name}</div>
                                                    <div className="text-[10px] text-gray-500 uppercase">{p.laborType?.name}</div>
                                                </td>
                                                <td className="px-3 py-4 whitespace-nowrap">
                                                    <div className="text-xs font-medium text-gray-900">
                                                        {p.planting?.crop?.species?.name || p.species?.name || 'N/A'}
                                                    </div>
                                                    <div className="text-[10px] text-gray-500">
                                                        {p.planting?.crop?.varietyEntity?.name
                                                            || (p.planting?.crop?.varieties?.length ? p.planting.crop.varieties.map(v => v.name).join(', ') : '')
                                                            || (p.varieties?.length ? p.varieties.map(v => v.name).join(', ') : '')
                                                            || p.planting?.crop?.variety
                                                            || 'N/A'}
                                                    </div>
                                                </td>
                                                {/* Planned */}
                                                <td className="px-3 py-4 whitespace-nowrap text-center text-sm font-medium text-blue-700 bg-blue-50/10">
                                                    {p.total_jh_planned}
                                                </td>
                                                <td className="px-3 py-4 whitespace-nowrap text-center text-sm text-gray-600 bg-blue-50/10">
                                                    {p.avg_yield_planned} <span className="text-[10px]">{p.unitOfMeasure?.code || p.unitOfMeasure?.name}</span>
                                                </td>
                                                <td className="px-3 py-4 whitespace-nowrap text-center text-sm font-semibold text-gray-700 bg-blue-50/10">
                                                    ${Number(p.total_value_planned).toLocaleString()}
                                                </td>
                                                {/* Actual */}
                                                <td className="px-3 py-4 whitespace-nowrap text-center text-sm font-bold text-green-700 bg-green-50/10">
                                                    {p.total_jh_actual ?? '-'}
                                                </td>
                                                <td className="px-3 py-4 whitespace-nowrap text-center text-sm text-gray-700 bg-green-50/10">
                                                    {p.avg_yield_actual ?? '-'} <span className="text-[10px]">{p.unitOfMeasure?.code || p.unitOfMeasure?.name}</span>
                                                </td>
                                                <td className="px-3 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-900 bg-green-50/10">
                                                    {p.total_value_actual ? `$${Number(p.total_value_actual).toLocaleString()}` : '-'}
                                                </td>
                                                <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end gap-2">
                                                        <Link
                                                            href={route('labor-plannings.edit', p.id)}
                                                            className="text-green-600 hover:text-green-900 px-2 py-1 bg-green-50 rounded"
                                                        >
                                                            {p.total_jh_actual ? 'Editar' : 'Llenar Real'}
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(p.id, p.taskType?.name || 'Labor')}
                                                            className="text-red-400 hover:text-red-700"
                                                        >
                                                            Eliminar
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
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

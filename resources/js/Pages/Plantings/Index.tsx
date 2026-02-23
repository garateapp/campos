import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';

interface Planting {
    id: number;
    field_name: string;
    crop_name: string;
    family_name: string | null;
    species_name: string;
    variety_name: string;
    season: string;
    planted_date: string;
    status: string;
    total_harvested_kg: number;
    planted_area_hectares: number;
    cc?: string | null;
}

interface PlantingsIndexProps {
    plantings: Planting[];
    seasons: string[];
    filters: {
        season?: string;
        status?: string;
    };
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    planted: { label: 'Plantado', color: 'text-blue-700', bg: 'bg-blue-100' },
    growing: { label: 'En Crecimiento', color: 'text-green-700', bg: 'bg-green-100' },
    flowering: { label: 'Floración', color: 'text-indigo-700', bg: 'bg-indigo-100' },
    fruiting: { label: 'Fructificación', color: 'text-purple-700', bg: 'bg-purple-100' },
    harvesting: { label: 'Cosechando', color: 'text-orange-700', bg: 'bg-orange-100' },
    completed: { label: 'Finalizado', color: 'text-gray-700', bg: 'bg-gray-100' },
    failed: { label: 'Fallido', color: 'text-red-700', bg: 'bg-red-100' },
};

export default function Index({ plantings, seasons, filters }: PlantingsIndexProps) {
    const [seasonFilter, setSeasonFilter] = useState(filters.season || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const { flash, errors } = usePage().props as any;

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value || undefined };
        router.get(route('plantings.index'), newFilters, {
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
                            Registro de Labores
                        </h2>
                        <p className="text-sm text-gray-500">
                            Seguimiento de cuarteles por campo y temporada
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <label className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition ease-in-out duration-150 cursor-pointer">
                            Importar CSV
                            <input
                                type="file"
                                accept=".csv,text/csv"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        const file = e.target.files[0];
                                        router.post(route('plantings.import'), { file }, {
                                            forceFormData: true,
                                            onFinish: () => { e.target.value = ''; }
                                        });
                                    }
                                }}
                            />
                        </label>
                        {errors?.file && <div className="text-xs text-red-600 self-center">{errors.file}</div>}
                        <Link
                            href={route('plantings.create')}
                            className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-lg font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 transition ease-in-out duration-150"
                        >
                            + Nueva Labor
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Labores" />

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

                    {/* Filters */}
                    <div className="mb-6 flex flex-wrap gap-4">
                        <div className="w-full sm:w-48">
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Temporada</label>
                            <select
                                value={seasonFilter}
                                onChange={(e) => {
                                    setSeasonFilter(e.target.value);
                                    handleFilterChange('season', e.target.value);
                                }}
                                className="w-full border-gray-300 rounded-lg text-sm focus:ring-green-500 focus:border-green-500"
                            >
                                <option value="">Todas</option>
                                {seasons.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="w-full sm:w-48">
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Estado</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    handleFilterChange('status', e.target.value);
                                }}
                                className="w-full border-gray-300 rounded-lg text-sm focus:ring-green-500 focus:border-green-500"
                            >
                                <option value="">Todos</option>
                                {Object.keys(statusConfig).map(status => (
                                    <option key={status} value={status}>{statusConfig[status].label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Plantings Grid */}
                    {plantings.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                            <div className="text-4xl mb-4">🌱</div>
                            <h3 className="text-lg font-medium text-gray-900">Sin Labores registradas</h3>
                            <p className="text-gray-500 mt-2 mb-4">Comienza registrando un cuartel en una de tus campos</p>
                            <Link
                                href={route('plantings.create')}
                                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                Registrar Primera Labor
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {plantings.map((p) => (
                                <Link
                                    key={p.id}
                                    href={route('plantings.show', p.id)}
                                    className="block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                                >
                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">
                                                    {p.family_name || 'Sin Familia'}
                                                </div>
                                                <h3 className="font-bold text-gray-900 text-lg">
                                                    {p.species_name}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    {p.variety_name}
                                                </p>
                                            </div>
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusConfig[p.status]?.bg} ${statusConfig[p.status]?.color}`}>
                                                {statusConfig[p.status]?.label || p.status}
                                            </span>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center text-sm">
                                                <span className="text-gray-500 w-24">📍 Campo:</span>
                                                <span className="font-medium text-gray-900">{p.field_name}</span>
                                            </div>
                                            <div className="flex items-center text-sm">
                                                <span className="text-gray-500 w-24"> CC:</span>
                                                <span className="font-medium text-gray-900">{p.cc || "-"}</span>
                                            </div>
                                            <div className="flex items-center text-sm">
                                                <span className="text-gray-500 w-24">📅 Fecha:</span>
                                                <span className="font-medium text-gray-900">{p.planted_date}</span>
                                            </div>
                                            <div className="flex items-center text-sm">
                                                <span className="text-gray-500 w-24">🏹 Temporada:</span>
                                                <span className="font-medium text-gray-900">{p.season}</span>
                                            </div>
                                        </div>

                                        <div className="mt-5 pt-4 border-t border-gray-50 flex justify-between items-end">
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-medium">Cosecha Total</p>
                                                <p className="text-lg font-bold text-green-600">
                                                    {p.total_harvested_kg.toLocaleString()} <span className="text-sm font-normal text-gray-500">kg</span>
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500 uppercase font-medium">Área</p>
                                                <p className="font-semibold text-gray-900">{p.planted_area_hectares} ha</p>
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



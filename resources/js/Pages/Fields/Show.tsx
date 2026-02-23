import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';

interface Planting {
    id: number;
    crop_name: string;
    variety: string | null;
    season: string;
    planted_date: string;
    status: string;
    planted_area_hectares: number;
    total_harvested_kg: number;
}

interface Task {
    id: number;
    title: string;
    status: string;
    due_date: string;
}

interface FieldShowProps {
    field: {
        id: number;
        name: string;
        code: string | null;
        area_hectares: number;
        soil_type: string | null;
        status: string;
        coordinates: any;
        notes: string | null;
        plantings: Planting[];
        recent_tasks: Task[];
    };
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    active: { label: 'Activo', color: 'text-green-700', bg: 'bg-green-100' },
    fallow: { label: 'En Barbecho', color: 'text-orange-700', bg: 'bg-orange-100' },
    preparing: { label: 'Preparación', color: 'text-blue-700', bg: 'bg-blue-100' },
};

const plantingStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
    planted: { label: 'Plantado', color: 'text-blue-700', bg: 'bg-blue-100' },
    growing: { label: 'En Crecimiento', color: 'text-green-700', bg: 'bg-green-100' },
    flowering: { label: 'Floración', color: 'text-indigo-700', bg: 'bg-indigo-100' },
    fruiting: { label: 'Fructificación', color: 'text-purple-700', bg: 'bg-purple-100' },
    harvesting: { label: 'Cosechando', color: 'text-orange-700', bg: 'bg-orange-100' },
    completed: { label: 'Finalizado', color: 'text-gray-700', bg: 'bg-gray-100' },
    failed: { label: 'Fallido', color: 'text-red-700', bg: 'bg-red-100' },
};

export default function Show({ field }: FieldShowProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'plantings' | 'tasks'>('overview');

    const handleDelete = () => {
        if (confirm('¿Estás seguro de que deseas eliminar esta campo? Esta acción no se puede deshacer.')) {
            router.delete(route('fields.destroy', field.id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href={route('fields.index')} className="text-gray-500 hover:text-gray-700">
                            ← Volver
                        </Link>
                        <div>
                            <h2 className="text-xl font-semibold leading-tight text-gray-800">
                                {field.name}
                            </h2>
                            <p className="text-sm text-gray-500">
                                {field.code ? `Código: ${field.code} • ` : ''}{field.area_hectares} hectáreas
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href={route('fields.edit', field.id)}
                            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-xs text-gray-700 uppercase tracking-widest hover:bg-gray-50 transition ease-in-out duration-150"
                        >
                            Editar
                        </Link>
                        <button
                            onClick={handleDelete}
                            className="inline-flex items-center px-4 py-2 bg-red-50 border border-red-200 rounded-lg font-semibold text-xs text-red-600 uppercase tracking-widest hover:bg-red-100 transition ease-in-out duration-150"
                        >
                            Eliminar
                        </button>
                    </div>
                </div>
            }
        >
            <Head title={`Campo: ${field.name}`} />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Status Ribbon */}
                    <div className="mb-6 flex gap-4">
                        <div className={`px-4 py-2 rounded-lg flex items-center gap-2 font-bold ${statusConfig[field.status]?.bg} ${statusConfig[field.status]?.color}`}>
                            <span className="w-2 h-2 rounded-full bg-current"></span>
                            {statusConfig[field.status]?.label || field.status}
                        </div>
                        {field.plantings.some(p => !['completed', 'failed'].includes(p.status)) && (
                            <div className="px-4 py-2 rounded-lg bg-green-50 text-green-700 flex items-center gap-2 font-bold border border-green-100">
                                🌱 Con cuarteles activos
                            </div>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="border-b border-gray-100">
                            <nav className="flex">
                                <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="Resumen" />
                                <TabButton active={activeTab === 'plantings'} onClick={() => setActiveTab('plantings')} label="Historial de Cuarteles" count={field.plantings.length} />
                                <TabButton active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} label="Tareas Recientes" count={field.recent_tasks.length} />
                            </nav>
                        </div>

                        <div className="p-6">
                            {activeTab === 'overview' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Información Terreno</h3>
                                        <dl className="grid grid-cols-2 gap-4">
                                            <DetailItem label="Tipo de Suelo" value={field.soil_type || 'No especificado'} />
                                            <DetailItem label="Superficie" value={`${field.area_hectares} ha`} />
                                            <DetailItem label="Ubicación" value={field.coordinates ? '📍 Coordenadas registradas' : 'Sin mapa'} />
                                        </dl>

                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mt-8 mb-4">Notas</h3>
                                        <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 min-h-[100px]">
                                            {field.notes || 'No hay notas para esta campo.'}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Cuartel Actual</h3>
                                        {field.plantings.filter(p => !['completed', 'failed'].includes(p.status)).length === 0 ? (
                                            <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl">
                                                <p className="text-gray-400 text-sm">No hay cuarteles activos en esta campo.</p>
                                                <Link href={route('plantings.create', { field_id: field.id })} className="text-green-600 text-sm font-bold mt-2 inline-block">
                                                    + Plantar algo aquí
                                                </Link>
                                            </div>
                                        ) : (
                                            field.plantings.filter(p => !['completed', 'failed'].includes(p.status)).map(p => (
                                                <Link
                                                    key={p.id}
                                                    href={route('plantings.show', p.id)}
                                                    className="block p-4 bg-green-50 rounded-xl border border-green-100 hover:shadow-sm transition-shadow"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-bold text-green-900">{p.crop_name}</p>
                                                            <p className="text-xs text-green-700">{p.variety || 'Variedad estándar'}</p>
                                                        </div>
                                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${plantingStatusConfig[p.status]?.bg} ${plantingStatusConfig[p.status]?.color}`}>
                                                            {plantingStatusConfig[p.status]?.label}
                                                        </span>
                                                    </div>
                                                    <div className="mt-4 flex justify-between text-[10px] font-bold text-green-600 uppercase tracking-widest">
                                                        <span>Desde: {p.planted_date}</span>
                                                        <span>{p.season}</span>
                                                    </div>
                                                </Link>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'plantings' && (
                                <div className="space-y-4">
                                    {field.plantings.length === 0 ? (
                                        <p className="text-center text-gray-500 py-8">Historial vacío.</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Cuartel</th>
                                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Temporada</th>
                                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Estado</th>
                                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Cosecha Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-100">
                                                    {field.plantings.map(p => (
                                                        <tr key={p.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.get(route('plantings.show', p.id))}>
                                                            <td className="px-6 py-4">
                                                                <div className="text-sm font-bold text-gray-900">{p.crop_name}</div>
                                                                <div className="text-xs text-gray-500">{p.variety}</div>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-600">{p.season}</td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${plantingStatusConfig[p.status]?.bg} ${plantingStatusConfig[p.status]?.color}`}>
                                                                    {plantingStatusConfig[p.status]?.label}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                                                {p.total_harvested_kg.toLocaleString()} kg
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'tasks' && (
                                <div className="space-y-4">
                                    {field.recent_tasks.length === 0 ? (
                                        <p className="text-center text-gray-500 py-8">No hay tareas recientes para esta campo.</p>
                                    ) : (
                                        field.recent_tasks.map(task => (
                                            <Link
                                                key={task.id}
                                                href={route('tasks.show', task.id)}
                                                className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-2 h-2 rounded-full ${task.status === 'completed' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{task.title}</p>
                                                        <p className="text-xs text-gray-500">Vence: {task.due_date}</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-bold text-gray-400">Ver →</span>
                                            </Link>
                                        ))
                                    )}
                                    <div className="pt-4 border-t flex justify-center">
                                        <Link href={route('tasks.index', { field_id: field.id })} className="text-sm font-bold text-green-600 hover:underline">
                                            Ver todas las tareas de la campo
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function TabButton({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count?: number }) {
    return (
        <button
            onClick={onClick}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${active
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                }`}
        >
            {label}
            {count !== undefined && (
                <span className={`px-2 py-0.5 text-xs rounded-full ${active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {count}
                </span>
            )}
        </button>
    );
}

function DetailItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</dt>
            <dd className="text-sm font-bold text-gray-900 mt-1">{value}</dd>
        </div>
    );
}

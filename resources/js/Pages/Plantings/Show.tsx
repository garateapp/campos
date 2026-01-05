import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FormEventHandler, useState } from 'react';

interface Activity {
    id: number;
    type: string;
    activity_date: string;
    description: string | null;
    performer_name: string;
    metadata: any;
}

interface Harvest {
    id: number;
    harvest_date: string;
    quantity_kg: number;
    quality_grade: string | null;
    price_per_kg: number | null;
    notes: string | null;
}

interface PlantingShowProps {
    planting: {
        id: number;
        field: any;
        crop: any;
        family_name?: string | null;
        season: string;
        planted_date: string;
        expected_harvest_date: string | null;
        planted_area_hectares: number;
        plants_count: number | null;
        status: string;
        expected_yield_kg: number | null;
        notes: string | null;
        activities: Activity[];
        harvests: Harvest[];
        total_harvested_kg: number;
    };
}

const typeLabels: Record<string, string> = {
    irrigation: 'Riego',
    fertilization: 'Fertilización',
    pest_control: 'Control de Plagas',
    pruning: 'Poda',
    scouting: 'Monitoreo',
    other: 'Otro',
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    planted: { label: 'Plantado', color: 'text-blue-700', bg: 'bg-blue-100' },
    growing: { label: 'En Crecimiento', color: 'text-green-700', bg: 'bg-green-100' },
    flowering: { label: 'Floración', color: 'text-indigo-700', bg: 'bg-indigo-100' },
    fruiting: { label: 'Fructificación', color: 'text-purple-700', bg: 'bg-purple-100' },
    harvesting: { label: 'Cosechando', color: 'text-orange-700', bg: 'bg-orange-100' },
    completed: { label: 'Finalizado', color: 'text-gray-700', bg: 'bg-gray-100' },
    failed: { label: 'Fallido', color: 'text-red-700', bg: 'bg-red-100' },
};

export default function Show({ planting }: PlantingShowProps) {
    const [activeTab, setActiveTab] = useState<'info' | 'activities' | 'harvests'>('info');

    const activityForm = useForm({
        type: 'irrigation',
        activity_date: new Date().toISOString().split('T')[0],
        description: '',
    });

    const harvestForm = useForm({
        harvest_date: new Date().toISOString().split('T')[0],
        quantity_kg: '',
        quality_grade: '',
        price_per_kg: '',
        notes: '',
    });

    const submitActivity: FormEventHandler = (e) => {
        e.preventDefault();
        activityForm.post(route('plantings.activities.store', planting.id), {
            onSuccess: () => activityForm.reset(),
        });
    };

    const submitHarvest: FormEventHandler = (e) => {
        e.preventDefault();
        harvestForm.post(route('plantings.harvests.store', planting.id), {
            onSuccess: () => harvestForm.reset(),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href={route('plantings.index')} className="text-gray-500 hover:text-gray-700">
                            ← Volver
                        </Link>
                        <div>
                            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">
                                {planting.crop.species?.family?.name || 'Sin Familia'}
                            </div>
                            <h2 className="text-xl font-semibold leading-tight text-gray-800">
                                {planting.crop.name} - {planting.field.name}
                            </h2>
                            <p className="text-sm text-gray-500">Temporada {planting.season}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusConfig[planting.status]?.bg} ${statusConfig[planting.status]?.color}`}>
                            {statusConfig[planting.status]?.label || planting.status}
                        </span>
                        <Link
                            href={route('plantings.edit', planting.id)}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            ✏️ Editar
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`Siembra ${planting.crop.name}`} />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Summary Bar */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <SummaryItem label="Área Plantada" value={`${planting.planted_area_hectares} ha`} icon="🗺️" />
                        <SummaryItem label="Fecha Plantación" value={planting.planted_date} icon="📅" />
                        <SummaryItem label="Rendimiento Esperado" value={planting.expected_yield_kg ? `${planting.expected_yield_kg.toLocaleString()} kg` : 'N/A'} icon="🎯" />
                        <SummaryItem label="Total Cosechado" value={`${planting.total_harvested_kg.toLocaleString()} kg`} icon="🍎" color="text-green-600" />
                    </div>

                    {/* Tabs */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="border-b border-gray-100">
                            <nav className="flex">
                                <TabButton active={activeTab === 'info'} onClick={() => setActiveTab('info')} label="Más Información" />
                                <TabButton active={activeTab === 'activities'} onClick={() => setActiveTab('activities')} label="Actividades" count={planting.activities.length} />
                                <TabButton active={activeTab === 'harvests'} onClick={() => setActiveTab('harvests')} label="Cosechas" count={planting.harvests.length} />
                            </nav>
                        </div>

                        <div className="p-6">
                            {activeTab === 'info' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Detalles del Cultivo</h3>
                                        <dl className="space-y-3">
                                            <DetailItem label="Familia" value={planting.crop.species?.family?.name || 'No especificada'} />
                                            <DetailItem label="Especie" value={planting.crop.species?.name || 'No especificada'} />
                                            <DetailItem
                                                label="Variedad"
                                                value={(planting.crop.variety_entity?.name as string) || planting.crop.variety || 'No especificada'}
                                            />
                                            <DetailItem label="Centro de Costo" value={(planting as any).cc || '-'} />
                                            <DetailItem label="Nombre Científico" value={planting.crop.scientific_name || '-'} />
                                            <DetailItem label="Cantidad de Plantas" value={planting.plants_count?.toString() || '-'} />
                                            <DetailItem label="Fecha Est. Cosecha" value={planting.expected_harvest_date || 'No definida'} />
                                        </dl>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Notas</h3>
                                        <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 min-h-[100px]">
                                            {planting.notes || 'No hay notas para esta siembra.'}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'activities' && (
                                <div>
                                    <div className="mb-8 p-4 bg-green-50 rounded-xl border border-green-100">
                                        <h4 className="font-semibold text-green-800 mb-4 flex items-center gap-2">
                                            <span>➕</span> Registrar Nueva Actividad
                                        </h4>
                                        <form onSubmit={submitActivity} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                            <div>
                                                <label className="text-xs font-medium text-gray-500 uppercase">Tipo</label>
                                                <select
                                                    value={activityForm.data.type}
                                                    onChange={e => activityForm.setData('type', e.target.value)}
                                                    className="mt-1 block w-full border-gray-300 rounded-lg text-sm focus:ring-green-500 focus:border-green-500"
                                                >
                                                    {Object.keys(typeLabels).map(type => (
                                                        <option key={type} value={type}>{typeLabels[type]}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-gray-500 uppercase">Fecha</label>
                                                <input
                                                    type="date"
                                                    value={activityForm.data.activity_date}
                                                    onChange={e => activityForm.setData('activity_date', e.target.value)}
                                                    className="mt-1 block w-full border-gray-300 rounded-lg text-sm focus:ring-green-500 focus:border-green-500"
                                                />
                                            </div>
                                            <div>
                                                <button
                                                    type="submit"
                                                    disabled={activityForm.processing}
                                                    className="w-full py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                                                >
                                                    {activityForm.processing ? 'Registrando...' : 'Registrar'}
                                                </button>
                                            </div>
                                            <div className="md:col-span-3">
                                                <label className="text-xs font-medium text-gray-500 uppercase">Descripción</label>
                                                <textarea
                                                    value={activityForm.data.description}
                                                    onChange={e => activityForm.setData('description', e.target.value)}
                                                    className="mt-1 block w-full border-gray-300 rounded-lg text-sm focus:ring-green-500 focus:border-green-500"
                                                    rows={1}
                                                    placeholder="Breve detalle de lo realizado..."
                                                />
                                            </div>
                                        </form>
                                    </div>

                                    <div className="space-y-4">
                                        {planting.activities.length === 0 ? (
                                            <p className="text-center text-gray-500 py-8">No se han registrado actividades aún.</p>
                                        ) : (
                                            planting.activities.map(activity => (
                                                <div key={activity.id} className="flex gap-4 p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                                                        {activity.type === 'irrigation' ? '💧' : activity.type === 'fertilization' ? '🧪' : '🚜'}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start">
                                                            <h5 className="font-bold text-gray-900">{typeLabels[activity.type]}</h5>
                                                            <span className="text-xs text-gray-500 font-medium">{activity.activity_date}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 mt-1">{activity.description || 'Sin descripción'}</p>
                                                        <p className="text-xs text-gray-400 mt-2">Realizado por: {activity.performer_name}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'harvests' && (
                                <div>
                                    <div className="mb-8 p-4 bg-orange-50 rounded-xl border border-orange-100">
                                        <h4 className="font-semibold text-orange-800 mb-4 flex items-center gap-2">
                                            <span>🍎</span> Registrar Nueva Cosecha
                                        </h4>
                                        <form onSubmit={submitHarvest} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                            <div>
                                                <label className="text-xs font-medium text-gray-500 uppercase">Fecha</label>
                                                <input
                                                    type="date"
                                                    value={harvestForm.data.harvest_date}
                                                    onChange={e => harvestForm.setData('harvest_date', e.target.value)}
                                                    className="mt-1 block w-full border-gray-300 rounded-lg text-sm focus:ring-orange-500 focus:border-orange-500"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-gray-500 uppercase">Kilos (kg)</label>
                                                <input
                                                    type="number"
                                                    value={harvestForm.data.quantity_kg}
                                                    onChange={e => harvestForm.setData('quantity_kg', e.target.value)}
                                                    className="mt-1 block w-full border-gray-300 rounded-lg text-sm focus:ring-orange-500 focus:border-orange-500"
                                                    required
                                                    step="0.01"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-gray-500 uppercase">Calidad</label>
                                                <input
                                                    type="text"
                                                    value={harvestForm.data.quality_grade}
                                                    onChange={e => harvestForm.setData('quality_grade', e.target.value)}
                                                    className="mt-1 block w-full border-gray-300 rounded-lg text-sm focus:ring-orange-500 focus:border-orange-500"
                                                    placeholder="Ej: Exportación"
                                                />
                                            </div>
                                            <div>
                                                <button
                                                    type="submit"
                                                    disabled={harvestForm.processing}
                                                    className="w-full py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
                                                >
                                                    {harvestForm.processing ? 'Registrando...' : 'Registrar'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>

                                    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calidad</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P. Unitario</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Est.</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {planting.harvests.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">No hay registros de cosecha.</td>
                                                    </tr>
                                                ) : (
                                                    planting.harvests.map(harvest => (
                                                        <tr key={harvest.id}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{harvest.harvest_date}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700 font-bold">{harvest.quantity_kg.toLocaleString()} kg</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{harvest.quality_grade || '-'}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{harvest.price_per_kg ? `$${harvest.price_per_kg}` : '-'}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                                                {harvest.price_per_kg ? `$${(harvest.price_per_kg * harvest.quantity_kg).toLocaleString()}` : '-'}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
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

function SummaryItem({ label, value, icon, color = 'text-gray-900' }: { label: string; value: string; icon: string; color?: string }) {
    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{label}</p>
            <div className="flex items-center gap-2">
                <span className="text-xl">{icon}</span>
                <span className={`text-lg font-bold ${color}`}>{value}</span>
            </div>
        </div>
    );
}

function DetailItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-center py-2 border-b border-gray-50">
            <dt className="text-sm text-gray-500">{label}:</dt>
            <dd className="text-sm font-semibold text-gray-900">{value}</dd>
        </div>
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

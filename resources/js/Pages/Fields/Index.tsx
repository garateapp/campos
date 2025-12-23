import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';

interface Field {
    id: number;
    name: string;
    code: string | null;
    area_hectares: number;
    soil_type: string | null;
    status: 'active' | 'fallow' | 'preparing';
    active_plantings_count: number;
    notes: string | null;
}

interface FieldsIndexProps {
    fields: Field[];
}

const statusLabels: Record<string, { label: string; color: string }> = {
    active: { label: 'Activa', color: 'bg-green-100 text-green-700' },
    fallow: { label: 'En Descanso', color: 'bg-yellow-100 text-yellow-700' },
    preparing: { label: 'En Preparación', color: 'bg-blue-100 text-blue-700' },
};

export default function Index({ fields }: FieldsIndexProps) {
    const [search, setSearch] = useState('');

    const filteredFields = fields.filter(field =>
        field.name.toLowerCase().includes(search.toLowerCase()) ||
        field.code?.toLowerCase().includes(search.toLowerCase())
    );

    const totalHectares = fields.reduce((sum, f) => sum + Number(f.area_hectares), 0);

    const handleDelete = (id: number, name: string) => {
        if (confirm(`¿Estás seguro de eliminar la parcela "${name}"?`)) {
            router.delete(route('fields.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            Parcelas
                        </h2>
                        <p className="text-sm text-gray-500">
                            {fields.length} parcelas • {totalHectares.toFixed(2)} hectáreas en total
                        </p>
                    </div>
                    <Link
                        href={route('fields.create')}
                        className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-lg font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 transition ease-in-out duration-150"
                    >
                        + Nueva Parcela
                    </Link>
                </div>
            }
        >
            <Head title="Parcelas" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Search */}
                    <div className="mb-6">
                        <input
                            type="text"
                            placeholder="Buscar parcelas..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                        />
                    </div>

                    {/* Fields Grid */}
                    {filteredFields.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                            <div className="text-4xl mb-4">🗺️</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {search ? 'No se encontraron parcelas' : 'Sin parcelas registradas'}
                            </h3>
                            <p className="text-gray-500 mb-4">
                                {search ? 'Intenta con otro término de búsqueda' : 'Comienza agregando tu primera parcela'}
                            </p>
                            {!search && (
                                <Link
                                    href={route('fields.create')}
                                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    Crear Primera Parcela
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredFields.map((field) => (
                                <div
                                    key={field.id}
                                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                                >
                                    <div className="p-5">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{field.name}</h3>
                                                {field.code && (
                                                    <p className="text-sm text-gray-500">Código: {field.code}</p>
                                                )}
                                            </div>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusLabels[field.status].color}`}>
                                                {statusLabels[field.status].label}
                                            </span>
                                        </div>

                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Área:</span>
                                                <span className="font-medium">{field.area_hectares} ha</span>
                                            </div>
                                            {field.soil_type && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Tipo de suelo:</span>
                                                    <span className="font-medium">{field.soil_type}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Siembras activas:</span>
                                                <span className="font-medium">{field.active_plantings_count}</span>
                                            </div>
                                        </div>

                                        {field.notes && (
                                            <p className="mt-3 text-sm text-gray-500 line-clamp-2">{field.notes}</p>
                                        )}
                                    </div>

                                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between">
                                        <Link
                                            href={route('fields.show', field.id)}
                                            className="text-sm text-green-600 hover:text-green-700 font-medium"
                                        >
                                            Ver detalles
                                        </Link>
                                        <div className="flex gap-3">
                                            <Link
                                                href={route('fields.edit', field.id)}
                                                className="text-sm text-gray-600 hover:text-gray-900"
                                            >
                                                Editar
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(field.id, field.name)}
                                                className="text-sm text-red-600 hover:text-red-700"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

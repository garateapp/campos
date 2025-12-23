import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';

interface Crop {
    id: number;
    name: string;
    family_name: string | null;
    species_name: string;
    variety_name: string;
    scientific_name: string | null;
    days_to_harvest: number | null;
    plantings_count: number;
}

interface CropsIndexProps {
    crops: Crop[];
}

export default function Index({ crops }: CropsIndexProps) {
    const [search, setSearch] = useState('');

    const filteredCrops = crops.filter(crop =>
        crop.name.toLowerCase().includes(search.toLowerCase()) ||
        crop.species_name.toLowerCase().includes(search.toLowerCase()) ||
        crop.variety_name.toLowerCase().includes(search.toLowerCase())
    );

    const handleDelete = (id: number, name: string) => {
        if (confirm(`¿Estás seguro de eliminar el cultivo "${name}"?`)) {
            router.delete(route('crops.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            Catálogo de Cultivos
                        </h2>
                        <p className="text-sm text-gray-500">
                            Gestiona las especies y variedades que cultivas
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href={route('families.index')}
                            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-25 transition ease-in-out duration-150"
                        >
                            Gestionar Familias
                        </Link>
                        <Link
                            href={route('crops.create')}
                            className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-lg font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 transition ease-in-out duration-150"
                        >
                            + Nuevo Cultivo
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Cultivos" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Search */}
                    <div className="mb-6">
                        <input
                            type="text"
                            placeholder="Buscar por nombre, especie o variedad..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 shadow-sm"
                        />
                    </div>

                    {/* Crops Table */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg border border-gray-100">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Familia / Especie</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variedad</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre Científico</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Días Cosecha</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Siembras</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredCrops.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                                No se encontraron cultivos.
                                                <Link href={route('crops.create')} className="text-green-600 hover:text-green-700 ml-1">Crear uno nuevo</Link>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredCrops.map((crop) => (
                                            <tr key={crop.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{crop.family_name || 'Sin Familia'}</div>
                                                    <div className="text-sm font-medium text-gray-900">{crop.name}</div>
                                                    <div className="text-xs text-gray-500">{crop.species_name}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {crop.variety_name || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 italic">
                                                    {crop.scientific_name || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                    {crop.days_to_harvest || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${crop.plantings_count > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {crop.plantings_count}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <Link
                                                        href={route('crops.edit', crop.id)}
                                                        className="text-green-600 hover:text-green-900 mr-4"
                                                    >
                                                        Editar
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(crop.id, crop.name)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Eliminar
                                                    </button>
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

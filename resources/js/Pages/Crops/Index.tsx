import { Head, Link, router, usePage } from '@inertiajs/react';
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
    field_name?: string;
    cost_center_code?: string | null;
}

interface IndexProps {
    crops: Crop[];
}

export default function Index({ crops }: IndexProps) {
    const [search, setSearch] = useState('');
    const { flash, errors } = usePage().props as any;

    const filteredCrops = crops.filter(crop =>
        crop.name.toLowerCase().includes(search.toLowerCase()) ||
        crop.species_name.toLowerCase().includes(search.toLowerCase()) ||
        crop.variety_name.toLowerCase().includes(search.toLowerCase()) ||
        (crop.field_name && crop.field_name.toLowerCase().includes(search.toLowerCase())) ||
        (crop.cost_center_code && crop.cost_center_code.toLowerCase().includes(search.toLowerCase()))
    );

    const handleDelete = (id: number, name: string) => {
        if (confirm(`¿Estás seguro de eliminar el cuartel "${name}"?`)) {
            router.delete(route('crops.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            Catálogo de Cuarteles
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
                        <label className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition ease-in-out duration-150 cursor-pointer">
                            Importar CSV
                            <input
                                type="file"
                                accept=".csv,text/csv"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        const file = e.target.files[0];
                                        router.post(route('crops.import'), { file }, {
                                            forceFormData: true,
                                            onFinish: () => {
                                                e.target.value = '';
                                            },
                                        });
                                    }
                                }}
                            />
                        </label>
                        {errors?.file && (
                            <div className="text-xs text-red-600 self-center">{errors.file}</div>
                        )}
                        <Link
                            href={route('crops.create')}
                            className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-lg font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 transition ease-in-out duration-150"
                        >
                            + Nuevo Cuartel
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Cuarteles" />

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

                    {/* Search */}
                    <div className="mb-6">
                        <input
                            type="text"
                            placeholder="Buscar por nombre, especie, variedad o campo..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 shadow-sm"
                        />
                        <div className="mt-3 text-xs text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-md p-3">
                            Formato CSV esperado: <code>species_name,field_name,variety_names,name,scientific_name,days_to_harvest,notes</code>. 
                            Las variedades van separadas por <code>|</code> (pipe) y deben pertenecer a la especie; la primera se usa como primaria.
                        </div>
                    </div>

                    {/* Crops Table */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg border border-gray-100">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campo</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Centro de Costo</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Familia / Especie</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variedad</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre Científico</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Días Cosecha</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Labores</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredCrops.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                                                No se encontraron cuarteles.
                                                <Link href={route('crops.create')} className="text-green-600 hover:text-green-700 ml-1">Crear uno nuevo</Link>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredCrops.map((crop) => (
                                            <tr key={crop.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                                                    {crop.field_name || <span className="text-gray-400 italic">No asignada</span>}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {crop.cost_center_code || <span className="text-gray-400 italic">Sin CC</span>}
                                                </td>
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
                                                    {crop.plantings_count > 0 && (
                                                        <div className="mt-2">
                                                            <Link
                                                                href={route('plantings.index', { crop_id: crop.id })}
                                                                className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                                                            >
                                                                Ver Labores
                                                            </Link>
                                                        </div>
                                                    )}
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

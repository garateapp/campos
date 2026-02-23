import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

interface CostCenter {
    id: number;
    code: string;
    name: string;
    species: string | null;
    variety: string | null;
    status: string | null;
    plant_year: number | null;
    planting_frame: string | null;
    plants_count: number | null;
    hectares: number | null;
    crops_count: number;
    plantings_count: number;
    tasks_count: number;
}

interface CostCentersIndexProps {
    costCenters: CostCenter[];
}

export default function Index({ costCenters }: CostCentersIndexProps) {
    const { flash, errors } = usePage().props as any;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href={route('dashboard')} className="text-gray-500 hover:text-gray-700">
                            ← Volver
                        </Link>
                        <div>
                            <h2 className="text-xl font-semibold leading-tight text-gray-800">
                                Centros de Costo
                            </h2>
                            <p className="text-sm text-gray-500">
                                Catálogo cargado desde CeCo para asociar campos, cuarteles y labores.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Link
                            href={route('cost-centers.template')}
                            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition ease-in-out duration-150"
                        >
                            Descargar Plantilla
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
                                        router.post(route('cost-centers.import'), { file }, {
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
                    </div>
                </div>
            }
        >
            <Head title="Centros de Costo" />

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
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg border border-gray-100">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Especie / Variedad</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ha</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Plantas</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Relaciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {costCenters.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                            No hay centros de costo cargados.
                                        </td>
                                    </tr>
                                ) : (
                                    costCenters.map((cc) => (
                                        <tr key={cc.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-semibold text-gray-900">{cc.code}</td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-900">{cc.name}</div>
                                                <div className="text-xs text-gray-500">
                                                    {cc.plant_year ? `Año ${cc.plant_year}` : 'Año n/d'} • {cc.status || 'Estado n/d'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">
                                                {(cc.species || 'Todas') + (cc.variety ? ` / ${cc.variety}` : '')}
                                                <div className="text-xs text-gray-500">{cc.planting_frame || 'Marco n/d'}</div>
                                            </td>
                                            <td className="px-4 py-3 text-center">{cc.hectares ?? '-'}</td>
                                            <td className="px-4 py-3 text-center">{cc.plants_count ?? '-'}</td>
                                            <td className="px-4 py-3 text-center text-xs text-gray-500">
                                                <span className="font-semibold text-gray-700">{cc.crops_count}</span> cuarteles •{' '}
                                                <span className="font-semibold text-gray-700">{cc.plantings_count}</span> labores •{' '}
                                                <span className="font-semibold text-gray-700">{cc.tasks_count}</span> tareas
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

interface Lot {
    id: number;
    input_name: string;
    category_name: string | null;
    field_name: string;
    unit: string;
    quantity: number;
    remaining_quantity: number;
    created_at: string;
}

interface LotsIndexProps {
    lots: Lot[];
}

export default function LotsIndex({ lots }: LotsIndexProps) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            Lotes FIFO de Insumos
                        </h2>
                        <p className="text-sm text-gray-500">
                            Control de entradas por lote y remanentes disponibles.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href={route('inputs.index')}
                            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 transition ease-in-out duration-150"
                        >
                            Volver a Insumos
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Lotes FIFO" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg border border-gray-100">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Insumo</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campo</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha ingreso</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remanente</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {lots.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-gray-500 text-sm">
                                                No hay lotes registrados.
                                            </td>
                                        </tr>
                                    ) : (
                                        lots.map((lot) => (
                                            <tr key={lot.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{lot.input_name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{lot.category_name || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{lot.field_name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{lot.created_at}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{lot.quantity} {lot.unit}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{lot.remaining_quantity} {lot.unit}</td>
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

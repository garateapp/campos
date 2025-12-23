import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FormEventHandler } from 'react';

interface Usage {
    id: number;
    usage_date: string;
    quantity: number;
    total_cost: number;
    field_name: string | null;
    notes: string | null;
}

interface InputShowProps {
    input: {
        id: number;
        name: string;
        category_name: string;
        unit: string;
        current_stock: number;
        min_stock_alert: number | null;
        unit_cost: number | null;
        notes: string | null;
        field_name: string | null;
        field_id: number | null;
    };
    recentUsages: Usage[];
    fields: any[];
}



export default function Show({ input, recentUsages, fields = [] }: InputShowProps) {
    const { data, setData, post, processing, reset, errors } = useForm({
        usage_date: new Date().toISOString().split('T')[0],
        quantity: '',
        field_id: input.field_id?.toString() || '',
        notes: '',
    });

    const submitUsage: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('inputs.usage.store', input.id), {
            onSuccess: () => reset(),
        });
    };

    const isLowStock = input.min_stock_alert && input.current_stock <= input.min_stock_alert;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={route('inputs.index')} className="text-gray-500 hover:text-gray-700">
                            ← Volver
                        </Link>
                        <div>
                            <p className="text-sm text-gray-500">
                                {input.category_name} • 📍 {input.field_name || 'Bodega General'}
                            </p>
                        </div>
                    </div>
                    <Link
                        href={route('inputs.edit', input.id)}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                    >
                        ✏️ Editar
                    </Link>
                </div>
            }
        >
            <Head title={`Insumo: ${input.name}`} />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Stats Sidebar */}
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Estado de Inventario</h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Stock Disponible</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className={`text-3xl font-black ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                                                {input.current_stock}
                                            </span>
                                            <span className="text-gray-500 font-medium">{input.unit}</span>
                                        </div>
                                        {isLowStock && (
                                            <p className="mt-1 text-xs text-red-600 font-bold flex items-center gap-1">
                                                ⚠️ Reponer pronto (Mín. {input.min_stock_alert})
                                            </p>
                                        )}
                                    </div>
                                    <div className="h-px bg-gray-50"></div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Valorización</p>
                                        <p className="text-xl font-bold text-gray-900">
                                            ${((input.unit_cost || 0) * input.current_stock).toLocaleString()}
                                        </p>
                                        <p className="text-xs text-gray-400 font-medium">${input.unit_cost?.toLocaleString()} por {input.unit}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Record Usage Form */}
                            <div className="bg-green-50 p-6 rounded-xl border border-green-100 shadow-sm">
                                <h3 className="font-bold text-green-800 mb-4 flex items-center gap-2">
                                    <span>📤</span> Registrar Salida
                                </h3>
                                <form onSubmit={submitUsage} className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Cantidad</label>
                                        <div className="mt-1 relative rounded-md shadow-sm">
                                            <input
                                                type="number"
                                                value={data.quantity}
                                                onChange={e => setData('quantity', e.target.value)}
                                                className="block w-full border-green-200 rounded-lg pl-3 pr-12 focus:ring-green-500 focus:border-green-500 text-sm"
                                                required
                                                step="0.01"
                                                min="0.01"
                                            />
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                <span className="text-gray-400 text-xs">{input.unit}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Fecha</label>
                                        <input
                                            type="date"
                                            value={data.usage_date}
                                            onChange={e => setData('usage_date', e.target.value)}
                                            className="mt-1 block w-full border-green-200 rounded-lg text-sm focus:ring-green-500 focus:border-green-500"
                                            required
                                        />
                                    </div>

                                    {!input.field_id && (
                                        <div>
                                            <label className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Parcela Destino</label>
                                            <select
                                                value={data.field_id}
                                                onChange={e => setData('field_id', e.target.value)}
                                                className="mt-1 block w-full border-green-200 rounded-lg text-sm focus:ring-green-500 focus:border-green-500"
                                                required
                                            >
                                                <option value="">Seleccionar parcela...</option>
                                                {fields.map(f => (
                                                    <option key={f.id} value={f.id}>{f.name}</option>
                                                ))}
                                            </select>
                                            <p className="mt-1 text-[10px] text-green-600">Requerido para salidas de bodega general.</p>
                                        </div>
                                    )}

                                    <div>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="w-full py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors shadow-sm"
                                        >
                                            {processing ? 'Procesando...' : 'Confirmar Salida'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Usage History */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center">
                                    <h3 className="font-bold text-gray-900">Historial de Salidas / Consumos</h3>
                                    <span className="text-xs text-gray-400 font-medium">Últimos {recentUsages.length} registros</span>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {recentUsages.length === 0 ? (
                                        <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                                            <span className="text-4xl mb-2">📉</span>
                                            Este insumo no tiene registros de uso aún.
                                        </div>
                                    ) : (
                                        recentUsages.map(usage => (
                                            <div key={usage.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                                                        ↓
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">
                                                            -{usage.quantity} <span className="text-xs font-normal text-gray-400">{input.unit}</span>
                                                        </p>
                                                        <p className="text-xs text-gray-500">{usage.usage_date} • {usage.field_name || 'Almacén'}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-gray-900">-${usage.total_cost.toLocaleString()}</p>
                                                    <p className="text-[10px] text-gray-400 uppercase font-black">Costo Imputado</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {input.notes && (
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Observaciones</h4>
                                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{input.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

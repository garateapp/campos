import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';

interface Props {
    fields: { id: number; name: string }[];
}

export default function Index({ fields }: Props) {
    const today = new Date().toISOString().split('T')[0];
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const [form, setForm] = useState({
        report_type: 'harvest-logs',
        start_date: firstDay,
        end_date: today,
        field_id: '',
    });

    const reports = [
        { id: 'harvest-logs', name: 'Bitácora de Cosechas', description: 'Registro detallado de todas las recepciones de fruta, kilos, calidad y destino.' },
        { id: 'application-logs', name: 'Registro de Aplicaciones (GlobalGAP)', description: 'Historial de uso de insumos, fertilizantes y agroquímicos por campo.' },
    ];

    const handleDownload = () => {
        const params = new URLSearchParams({
            start_date: form.start_date,
            end_date: form.end_date,
            field_id: form.field_id,
        });

        window.location.href = route('reports.' + form.report_type) + '?' + params.toString();
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Centro de Reportes
                </h2>
            }
        >
            <Head title="Reportes" />

            <div className="py-12">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <div className="mb-6 flex flex-wrap items-center gap-3">
                                <Link
                                    href={route('reports.harvest-daily')}
                                    className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                    Ver Cosecha por Campo y Dia
                                </Link>
                                <Link
                                    href={route('reports.harvest-collections')}
                                    className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                    Ver Cosecha Recolectada
                                </Link>
                                <Link
                                    href={route('reports.attendance-daily')}
                                    className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                    Ver Asistencia Diaria
                                </Link>
                                <Link
                                    href={route('reports.attendance-monthly')}
                                    className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                    Ver Asistencia Mensual
                                </Link>
                            </div>

                            <div className="mb-8">
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Generar Informe</h3>
                                <p className="text-sm text-gray-500">Seleccione el tipo de reporte y los filtros necesarios para exportar los datos en formato compatible con Excel (CSV UTF-8).</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Type Selection */}
                                <div className="col-span-1 md:col-span-2 space-y-4">
                                    <label className="block text-sm font-medium text-gray-700">Tipo de Reporte</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {reports.map((report) => (
                                            <div
                                                key={report.id}
                                                onClick={() => setForm({ ...form, report_type: report.id })}
                                                className={`p-4 border rounded-xl cursor-pointer transition-all ${form.report_type === report.id ? 'border-green-500 bg-green-50 ring-2 ring-green-200' : 'border-gray-200 hover:border-green-300'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-full ${form.report_type === report.id ? 'bg-green-200 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                        <span className="material-symbols-outlined text-xl">description</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-gray-900">{report.name}</p>
                                                        <p className="text-xs text-gray-500 mt-1 leading-snug">{report.description}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Filters */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Fecha Inicio</label>
                                    <input
                                        type="date"
                                        value={form.start_date}
                                        onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Fecha Fin</label>
                                    <input
                                        type="date"
                                        value={form.end_date}
                                        onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                    />
                                </div>

                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Filtrar por Campo (Opcional)</label>
                                    <select
                                        value={form.field_id}
                                        onChange={(e) => setForm({ ...form, field_id: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                    >
                                        <option value="">Todos los campos</option>
                                        {fields.map(f => (
                                            <option key={f.id} value={f.id}>{f.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end pt-6 border-t border-gray-100">
                                <button
                                    onClick={handleDownload}
                                    className="inline-flex items-center px-6 py-3 bg-green-600 border border-transparent rounded-lg font-semibold text-white uppercase tracking-widest hover:bg-green-700 focus:bg-green-700 active:bg-green-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150 gap-2 shadow-lg hover:shadow-green-500/30"
                                >
                                    <span className="material-symbols-outlined">download</span>
                                    Descargar Excel (CSV)
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

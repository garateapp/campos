import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import React from 'react';

interface Props {
    fields: { id: number; name: string }[];
    plantings: {
        id: number;
        label: string;
        field_id: number;
        species_id?: number | null;
        variety_id?: number | null;
        cc?: string | null;
        hectares?: number | null;
        num_plants?: number | null;
        season?: string | null;
    }[];
    taskTypes: { id: number; name: string }[];
    laborTypes: { id: number; name: string }[];
    units: { id: number; name: string; code?: string }[];
}

interface CreateProps extends Props {
    initialData?: {
        year?: number;
        month?: number;
        field_id?: string;
        species_id?: string;
        variety_ids?: string[];
        planting_year?: string;
        planting_id?: string;
        cc?: string;
        hectares?: string;
        num_plants?: string;
        meters?: string;
    };
}

export default function Create({ fields, plantings, taskTypes, laborTypes, units, initialData = {} }: CreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        year: initialData.year || new Date().getFullYear(),
        month: initialData.month || new Date().getMonth() + 1,
        field_id: initialData.field_id || '',
        planting_id: initialData.planting_id || '',
        species_id: initialData.species_id || '',
        variety_ids: initialData.variety_ids || [],
        planting_year: initialData.planting_year || '',
        cc: initialData.cc || '',
        hectares: initialData.hectares || '',
        num_plants: initialData.num_plants || '',
        kilos: '',
        meters: initialData.meters || '',
        task_type_id: '',
        labor_type_id: '',
        unit_of_measure_id: '',
        num_jh_planned: '',
        avg_yield_planned: '',
        total_jh_planned: '',
        effective_days_planned: '',
        value_planned: '',
        total_value_planned: '',
        create_another: false,
    });

    const submit = (e: React.FormEvent, createAnother = false) => {
        e.preventDefault();
        data.create_another = createAnother;
        post(route('labor-plannings.store'), {
            onFinish: () => setData('create_another', false),
        });
    };

    const handlePlantingSelect = (plantingId: string) => {
        setData('planting_id', plantingId);
        if (!plantingId) return;
        const selected = plantings.find((p) => p.id.toString() === plantingId);
        if (selected) {
            if (selected.field_id) setData('field_id', selected.field_id.toString());
            if (selected.species_id) setData('species_id', selected.species_id.toString());
            if (selected.variety_id) setData('variety_ids', [selected.variety_id.toString()]);
            if (selected.cc) setData('cc', selected.cc);
            if (selected.hectares) setData('hectares', selected.hectares.toString());
            if (selected.num_plants) setData('num_plants', selected.num_plants.toString());
            if (selected.season) setData('planting_year', selected.season.split('-')[0]);
        }
    };

    React.useEffect(() => {
        if (!data.labor_type_id) return;

        const laborType = laborTypes.find((lt) => lt.id === Number(data.labor_type_id));
        if (!laborType) return;

        const name = laborType.name.toLowerCase();
        let total = 0;
        const val = Number(data.value_planned) || 0;

        if (name.includes('trato')) {
            const plants = Number(data.num_plants) || 0;
            total = plants * val;
        } else if (name.includes('d¡a') || name.includes('dia')) {
            const jh = Number(data.total_jh_planned) || 0;
            total = jh * val;
        }

        if (total > 0) {
            setData('total_value_planned', total.toFixed(2));
        }
    }, [data.labor_type_id, data.num_plants, data.total_jh_planned, data.value_planned]);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Nueva Planificación de Labor
                    </h2>
                    <Link href={route('labor-plannings.index')} className="text-sm text-gray-500 hover:text-gray-700">
                        Volver al listado
                    </Link>
                </div>
            }
        >
            <Head title="Nueva Planificación" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <form onSubmit={(e) => submit(e, false)} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-3 border-b pb-2 mb-2">
                                    <h3 className="font-bold text-gray-800 uppercase text-xs">Periodo y Ubicación</h3>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Año *</label>
                                    <input
                                        type="number"
                                        value={data.year}
                                        onChange={(e) => setData('year', Number(e.target.value))}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                        required
                                    />
                                    {errors.year && <div className="text-red-500 text-xs mt-1">{errors.year}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Mes *</label>
                                    <select
                                        value={data.month}
                                        onChange={(e) => setData('month', Number(e.target.value))}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                        required
                                    >
                                        {[
                                            'Enero',
                                            'Febrero',
                                            'Marzo',
                                            'Abril',
                                            'Mayo',
                                            'Junio',
                                            'Julio',
                                            'Agosto',
                                            'Septiembre',
                                            'Octubre',
                                            'Noviembre',
                                            'Diciembre',
                                        ].map((m, i) => (
                                            <option key={i + 1} value={i + 1}>
                                                {m}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.month && <div className="text-red-500 text-xs mt-1">{errors.month}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Sector (Campo)</label>
                                    <select
                                        value={data.field_id}
                                        onChange={(e) => setData('field_id', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                    >
                                        <option value="">Seleccione Sector</option>
                                        {fields.map((f) => (
                                            <option key={f.id} value={f.id}>
                                                {f.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="md:col-span-3 border-b pb-2 mb-2 mt-4">
                                    <h3 className="font-bold text-gray-800 uppercase text-xs">Datos del Cultivo</h3>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Siembra (opcional)</label>
                                    <select
                                        value={data.planting_id}
                                        onChange={(e) => handlePlantingSelect(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                    >
                                        <option value="">Sin seleccionar</option>
                                        {plantings.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.label}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Si corresponde a una siembra, selecciónala para autocompletar datos.
                                    </p>
                                </div>

                                <div className="md:col-span-3 border-b pb-2 mb-2 mt-4">
                                    <h3 className="font-bold text-gray-800 uppercase text-xs">Detalles de la Labor</h3>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Labor (Tipo de Tarea) *</label>
                                    <select
                                        value={data.task_type_id}
                                        onChange={(e) => setData('task_type_id', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                        required
                                    >
                                        <option value="">Seleccione Labor</option>
                                        {taskTypes.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.task_type_id && <div className="text-red-500 text-xs mt-1">{errors.task_type_id}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Tipo Labor *</label>
                                    <select
                                        value={data.labor_type_id}
                                        onChange={(e) => setData('labor_type_id', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                        required
                                    >
                                        <option value="">Seleccione Tipo</option>
                                        {laborTypes.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.labor_type_id && <div className="text-red-500 text-xs mt-1">{errors.labor_type_id}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nø JH (Jornada Hombre)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.num_jh_planned}
                                        onChange={(e) => setData('num_jh_planned', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Rendimiento Promedio</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.avg_yield_planned}
                                        onChange={(e) => setData('avg_yield_planned', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Unidad Medida</label>
                                    <select
                                        value={data.unit_of_measure_id}
                                        onChange={(e) => setData('unit_of_measure_id', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                    >
                                        <option value="">Seleccione Unidad</option>
                                        {units.map((u) => (
                                            <option key={u.id} value={u.id}>
                                                {u.name} {u.code ? `(${u.code})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">JH Totales (P)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.total_jh_planned}
                                        onChange={(e) => setData('total_jh_planned', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">D¡as Efectivos</label>
                                    <input
                                        type="number"
                                        value={data.effective_days_planned}
                                        onChange={(e) => setData('effective_days_planned', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                    />
                                </div>

                                <div className="md:col-span-3 border-b pb-2 mb-2 mt-4">
                                    <h3 className="font-bold text-gray-800 uppercase text-xs">Costos Planificados</h3>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Valor Unitario</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.value_planned}
                                        onChange={(e) => setData('value_planned', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Valor Total (P)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.total_value_planned}
                                        onChange={(e) => setData('total_value_planned', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                    />
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end gap-3">
                                <Link
                                    href={route('labor-plannings.index')}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Cancelar
                                </Link>
                                <button
                                    type="button"
                                    disabled={processing}
                                    onClick={(e) => submit(e, true)}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition"
                                >
                                    Guardar y Agregar Otra
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 transition"
                                >
                                    Guardar y Finalizar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

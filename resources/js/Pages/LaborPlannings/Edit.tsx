import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import React, { FormEventHandler } from 'react';

interface LaborPlanning {
    id: number;
    year: number;
    month: number;
    field_id: number | null;
    species_id: number | null;
    variety_id: number | null;
    planting_year: number | null;
    cc: string | null;
    hectares: number | null;
    num_plants: number | null;
    kilos: number | null;
    meters: number | null;
    num_jh_planned: number | null;
    avg_yield_planned: number | null;
    total_jh_planned: number | null;
    effective_days_planned: number | null;
    task_type_id: number | null;
    labor_type_id: number | null;
    unit_of_measure_id: number | null;
    value_planned: number | null;
    total_value_planned: number | null;
    avg_yield_actual: number | null;
    total_jh_actual: number | null;
    jh_ha_actual: number | null;
    value_actual: number | null;
    total_value_actual: number | null;
}

interface Props {
    planning: LaborPlanning;
    fields: { id: number; name: string }[];
    species: { id: number; name: string }[];
    varieties: { id: number; name: string; species_id: number }[];
    taskTypes: { id: number; name: string }[];
    laborTypes: { id: number; name: string }[];
    units: { id: number; name: string; code?: string }[];
}

export default function Edit({ planning, fields, species, varieties, taskTypes, laborTypes, units }: Props) {
    const { data, setData, patch, processing, errors } = useForm({
        year: planning.year,
        month: planning.month,
        field_id: planning.field_id || '',
        species_id: planning.species_id || '',
        variety_id: planning.variety_id || '',
        planting_year: planning.planting_year || '',
        cc: planning.cc || '',
        hectares: planning.hectares || '',
        num_plants: planning.num_plants || '',
        kilos: planning.kilos || '',
        meters: planning.meters || '',
        task_type_id: planning.task_type_id || '',
        labor_type_id: planning.labor_type_id || '',
        unit_of_measure_id: planning.unit_of_measure_id || '',
        num_jh_planned: planning.num_jh_planned || '',
        avg_yield_planned: planning.avg_yield_planned || '',
        total_jh_planned: planning.total_jh_planned || '',
        effective_days_planned: planning.effective_days_planned || '',
        value_planned: planning.value_planned || '',
        total_value_planned: planning.total_value_planned || '',
        // Actuals
        avg_yield_actual: planning.avg_yield_actual || '',
        total_jh_actual: planning.total_jh_actual || '',
        jh_ha_actual: planning.jh_ha_actual || '',
        value_actual: planning.value_actual || '',
        total_value_actual: planning.total_value_actual || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('labor-plannings.update', planning.id));
    };

    const filteredVarieties = varieties.filter(v => v.species_id === Number(data.species_id));

    // Dynamic Total Calculation
    React.useEffect(() => {
        if (!data.labor_type_id) return;

        const laborType = laborTypes.find(lt => lt.id === Number(data.labor_type_id));
        if (!laborType) return;

        const name = laborType.name.toLowerCase();
        let total = 0;
        const val = Number(data.value_planned) || 0;

        if (name.includes('trato')) {
            const plants = Number(data.num_plants) || 0;
            total = plants * val;
        } else if (name.includes('día') || name.includes('dia')) {
            const jh = Number(data.total_jh_planned) || 0;
            total = jh * val;
        }

        // If total calculated, update state.
        // Note: checking > 0 to avoid overwriting existing data with 0 if inputs are missing during initial load, 
        // though we want it to react to changes. 
        if (total > 0) {
            setData('total_value_planned', total.toFixed(2));
        }

    }, [data.labor_type_id, data.num_plants, data.total_jh_planned, data.value_planned]);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Editar Planificación
                    </h2>
                    <Link href={route('labor-plannings.index')} className="text-sm text-gray-500 hover:text-gray-700">
                        Volver al listado
                    </Link>
                </div>
            }
        >
            <Head title="Editar Planificación" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <form onSubmit={submit} className="p-6">

                            {/* TAB NAVIGATION COULD GO HERE, but let's stick to a clean scrollable form */}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                                {/* Section 1: Planning Data */}
                                <div className="md:col-span-3 border-b-2 border-blue-100 pb-2 mb-2">
                                    <h3 className="font-bold text-blue-800 uppercase text-sm">1. Datos Planificados (Presupuesto)</h3>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Año *</label>
                                    <input type="number" value={data.year} onChange={(e) => setData('year', Number(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" required />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Mes *</label>
                                    <select value={data.month} onChange={(e) => setData('month', Number(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" required>
                                        {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((m, i) => (
                                            <option key={i + 1} value={i + 1}>{m}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Sector</label>
                                    <select value={data.field_id} onChange={(e) => setData('field_id', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500">
                                        <option value="">Seleccione Sector</option>
                                        {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Especie</label>
                                    <select value={data.species_id} onChange={(e) => setData('species_id', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500">
                                        <option value="">Seleccione Especie</option>
                                        {species.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Variedad</label>
                                    <select value={data.variety_id} onChange={(e) => setData('variety_id', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" disabled={!data.species_id}>
                                        <option value="">Seleccione Variedad</option>
                                        {filteredVarieties.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                    </select>
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
                                        {taskTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
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
                                        {laborTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                    {errors.labor_type_id && <div className="text-red-500 text-xs mt-1">{errors.labor_type_id}</div>}
                                </div>
                                <div className="col-span-1 md:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700">Unidad Medida</label>
                                    <select
                                        value={data.unit_of_measure_id}
                                        onChange={(e) => setData('unit_of_measure_id', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                    >
                                        <option value="">Seleccione Unidad</option>
                                        {units.map(u => <option key={u.id} value={u.id}>{u.name} {u.code ? `(${u.code})` : ''}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">JH Totales (P)</label>
                                    <input type="number" step="0.01" value={data.total_jh_planned} onChange={(e) => setData('total_jh_planned', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Rendimiento (P)</label>
                                    <input type="number" step="0.01" value={data.avg_yield_planned} onChange={(e) => setData('avg_yield_planned', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Costo Total (P)</label>
                                    <input type="number" step="0.01" value={data.total_value_planned} onChange={(e) => setData('total_value_planned', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 font-bold text-blue-600" />
                                </div>

                                {/* Section 2: Actual Data (The Contrast) */}
                                <div className="md:col-span-3 border-b-2 border-green-100 pb-2 mb-2 mt-8">
                                    <h3 className="font-bold text-green-800 uppercase text-sm">2. Datos Reales (Ejecución)</h3>
                                    <p className="text-xs text-green-600">Complete estos campos con los resultados obtenidos en el campo.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-800 font-bold">Rendimiento Promedio Real</label>
                                    <input
                                        type="number" step="0.01"
                                        value={data.avg_yield_actual}
                                        onChange={(e) => setData('avg_yield_actual', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-green-300 bg-green-50 shadow-sm focus:border-green-500 focus:ring-green-500"
                                    />
                                </div>



                                <div>
                                    <label className="block text-sm font-medium text-gray-800 font-bold">JH Totales Reales</label>
                                    <input
                                        type="number" step="0.01"
                                        value={data.total_jh_actual}
                                        onChange={(e) => setData('total_jh_actual', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-green-300 bg-green-50 shadow-sm focus:border-green-500 focus:ring-green-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">JH / ha</label>
                                    <input
                                        type="number" step="0.01"
                                        value={data.jh_ha_actual}
                                        onChange={(e) => setData('jh_ha_actual', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-green-300 bg-green-50 shadow-sm focus:border-green-500 focus:ring-green-500"
                                    />
                                </div>



                                <div>
                                    <label className="block text-sm font-medium text-gray-800 font-bold">Valor Unitario Real</label>
                                    <input
                                        type="number" step="0.01"
                                        value={data.value_actual}
                                        onChange={(e) => setData('value_actual', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-green-300 bg-green-50 shadow-sm focus:border-green-500 focus:ring-green-500"
                                    />
                                </div>

                                <div className="md:col-span-3">
                                    <label className="block text-sm font-bold text-gray-900 bg-green-100 p-2 rounded-t-md inline-block">Valor Total Real ($)</label>
                                    <input
                                        type="number" step="0.01"
                                        value={data.total_value_actual}
                                        onChange={(e) => setData('total_value_actual', e.target.value)}
                                        className="block w-full rounded-b-md border-green-400 bg-green-100 shadow-sm focus:border-green-500 focus:ring-green-500 text-lg font-black text-green-900"
                                    />
                                </div>

                            </div>

                            <div className="mt-10 flex justify-end gap-3 border-t pt-6">
                                <Link
                                    href={route('labor-plannings.index')}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Cancelar
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 shadow-lg transition"
                                >
                                    Actualizar y Guardar Cambios
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

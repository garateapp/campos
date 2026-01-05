import { FormEventHandler } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';

interface Field {
    id: number;
    name: string;
    area_hectares: number;
}

interface Crop {
    id: number;
    name: string;
    variety: string | null;
}

interface Planting {
    id: number;
    field_id: number;
    crop_id: number;
    season: string;
    planted_date: string;
    expected_harvest_date: string | null;
    planted_area_hectares: number;
    plants_count: number | null;
    status: string;
    expected_yield_kg: number | null;
    notes: string | null;
}

interface PlantingsEditProps {
    planting: Planting;
    fields: Field[];
    crops: Crop[];
}

export default function Edit({ planting, fields, crops }: PlantingsEditProps) {
    const { data, setData, patch, processing, errors } = useForm({
        field_id: planting.field_id?.toString() || '',
        crop_id: planting.crop_id?.toString() || '',
        season: planting.season || '',
        planted_date: planting.planted_date || '',
        expected_harvest_date: planting.expected_harvest_date || '',
        planted_area_hectares: planting.planted_area_hectares?.toString() || '',
        cc: (planting as any).cc || '',
        plants_count: planting.plants_count?.toString() || '',
        status: planting.status || 'plantado',
        expected_yield_kg: planting.expected_yield_kg?.toString() || '',
        notes: planting.notes || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('plantings.update', planting.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-4">
                    <Link href={route('plantings.index')} className="text-gray-500 hover:text-gray-700">
                        ← Volver
                    </Link>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Editar Siembra
                    </h2>
                </div>
            }
        >
            <Head title="Editar Siembra" />

            <div className="py-6">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputLabel htmlFor="field_id" value="Parcela *" />
                                    <select
                                        id="field_id"
                                        name="field_id"
                                        value={data.field_id}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                                        onChange={(e) => setData('field_id', e.target.value)}
                                        required
                                    >
                                        <option value="">Seleccionar Parcela...</option>
                                        {fields.map(f => (
                                            <option key={f.id} value={f.id}>{f.name} ({f.area_hectares} ha)</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.field_id} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="crop_id" value="Cultivo (Especie/Variedad) *" />
                                    <select
                                        id="crop_id"
                                        name="crop_id"
                                        value={data.crop_id}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                                        onChange={(e) => setData('crop_id', e.target.value)}
                                        required
                                    >
                                        <option value="">Seleccionar Cultivo...</option>
                                        {crops.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} {c.variety ? `- ${c.variety}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.crop_id} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="cc" value="Centro de Costo" />
                                    <TextInput
                                        id="cc"
                                        type="text"
                                        name="cc"
                                        value={data.cc}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('cc', e.target.value)}
                                        placeholder="Ej: CC-001"
                                    />
                                    <InputError message={(errors as any).cc} className="mt-2" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputLabel htmlFor="season" value="Temporada *" />
                                    <TextInput
                                        id="season"
                                        type="text"
                                        name="season"
                                        value={data.season}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('season', e.target.value)}
                                        placeholder="Ej: 2024-2025"
                                        required
                                    />
                                    <InputError message={errors.season} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="planted_area_hectares" value="Area Plantada (hectareas) *" />
                                    <TextInput
                                        id="planted_area_hectares"
                                        type="number"
                                        name="planted_area_hectares"
                                        value={data.planted_area_hectares}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('planted_area_hectares', e.target.value)}
                                        step="0.01"
                                        min="0.01"
                                        required
                                    />
                                    <InputError message={errors.planted_area_hectares} className="mt-2" />
                                </div>


                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputLabel htmlFor="planted_date" value="Fecha de Plantación *" />
                                    <TextInput
                                        id="planted_date"
                                        type="date"
                                        name="planted_date"
                                        value={data.planted_date}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('planted_date', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.planted_date} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="expected_harvest_date" value="Fecha Estimada de Cosecha" />
                                    <TextInput
                                        id="expected_harvest_date"
                                        type="date"
                                        name="expected_harvest_date"
                                        value={data.expected_harvest_date || ''}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('expected_harvest_date', e.target.value)}
                                    />
                                    <InputError message={errors.expected_harvest_date} className="mt-2" />
                                </div>


                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputLabel htmlFor="plants_count" value="Cantidad de Plantas/Árboles" />
                                    <TextInput
                                        id="plants_count"
                                        type="number"
                                        name="plants_count"
                                        value={data.plants_count}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('plants_count', e.target.value)}
                                        min="1"
                                    />
                                    <InputError message={errors.plants_count} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="expected_yield_kg" value="Rendimiento Esperado (kg)" />
                                    <TextInput
                                        id="expected_yield_kg"
                                        type="number"
                                        name="expected_yield_kg"
                                        value={data.expected_yield_kg}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('expected_yield_kg', e.target.value)}
                                        min="0"
                                    />
                                    <InputError message={errors.expected_yield_kg} className="mt-2" />
                                </div>
                            </div>

                            <div>
                                <InputLabel htmlFor="status" value="Estado *" />
                                <select
                                    id="status"
                                    name="status"
                                    value={data.status}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                                    onChange={(e) => setData('status', e.target.value)}
                                    required
                                >
                                    {['plantado', 'creciendo', 'floreciendo', 'frutando', 'cosechando', 'completado', 'fallido'].map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                                <InputError message={errors.status} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="notes" value="Notas" />
                                <textarea
                                    id="notes"
                                    name="notes"
                                    value={data.notes}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                                    rows={3}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Observaciones sobre la plantación, portainjertos, etc."
                                />
                                <InputError message={errors.notes} className="mt-2" />
                            </div>

                            <div className="flex items-center justify-end gap-4 pt-4 border-t">
                                <Link href={route('plantings.show', planting.id)} className="text-gray-600 hover:text-gray-900">
                                    Cancelar
                                </Link>
                                <PrimaryButton disabled={processing}>
                                    {processing ? 'Guardando...' : 'Actualizar Siembra'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}



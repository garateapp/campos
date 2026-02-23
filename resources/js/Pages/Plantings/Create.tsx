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

interface CostCenter {
    id: number;
    code: string;
    name: string;
    hectares: number | null;
    plants_count: number | null;
}

interface PlantingsCreateProps {
    fields: Field[];
    crops: Crop[];
    costCenters: CostCenter[];
}

export default function Create({ fields, crops, costCenters }: PlantingsCreateProps) {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const defaultSeason = currentMonth >= 7
        ? `${currentYear}-${currentYear + 1}`
        : `${currentYear - 1}-${currentYear}`;

    const { data, setData, post, processing, errors } = useForm({
        field_id: '',
        cost_center_id: '',
        crop_id: '',
        season: defaultSeason,
        planted_date: new Date().toISOString().split('T')[0],
        expected_harvest_date: '',
        planted_area_hectares: '',
        cc: '',
        plants_count: '',
        expected_yield_kg: '',
        notes: '',
    });

    const handleFieldChange = (fieldId: string) => {
        setData('field_id', fieldId);
        const field = fields.find(f => f.id.toString() === fieldId);
        if (field && !data.planted_area_hectares) {
            setData('planted_area_hectares', field.area_hectares.toString());
        }
    };

    const handleCostCenterChange = (costCenterId: string) => {
        setData('cost_center_id', costCenterId);
        if (!costCenterId) {
            return;
        }
        const selected = costCenters.find((cc) => cc.id.toString() === costCenterId);
        if (selected) {
            setData('cc', selected.code);
            if (selected.hectares && !data.planted_area_hectares) {
                setData('planted_area_hectares', selected.hectares.toString());
            }
            if (selected.plants_count && !data.plants_count) {
                setData('plants_count', selected.plants_count.toString());
            }
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('plantings.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-4">
                    <Link href={route('plantings.index')} className="text-gray-500 hover:text-gray-700">
                        ← Volver
                    </Link>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Registrar Nueva Labor
                    </h2>
                </div>
            }
        >
            <Head title="Nueva Labor" />

            <div className="py-6">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputLabel htmlFor="field_id" value="Campo *" />
                                    <select
                                        id="field_id"
                                        name="field_id"
                                        value={data.field_id}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                                        onChange={(e) => handleFieldChange(e.target.value)}
                                        required
                                    >
                                        <option value="">Seleccionar Campo...</option>
                                        {fields.map(f => (
                                            <option key={f.id} value={f.id}>{f.name} ({f.area_hectares} ha)</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.field_id} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="cost_center_id" value="Centro de Costo (opcional)" />
                                    <select
                                        id="cost_center_id"
                                        name="cost_center_id"
                                        value={data.cost_center_id}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                                        onChange={(e) => handleCostCenterChange(e.target.value)}
                                    >
                                        <option value="">Seleccionar Centro de Costo...</option>
                                        {costCenters.map((cc) => (
                                            <option key={cc.id} value={cc.id}>
                                                {cc.code} - {cc.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.cost_center_id} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="crop_id" value="Cuartel (Especie/Variedad) *" />
                                    <select
                                        id="crop_id"
                                        name="crop_id"
                                        value={data.crop_id}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                                        onChange={(e) => setData('crop_id', e.target.value)}
                                        required
                                    >
                                        <option value="">Seleccionar Cuartel...</option>
                                        {crops.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} {c.variety ? `- ${c.variety}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="mt-1 text-xs text-gray-500">
                                        ¿No encuentras el cuartel? <Link href={route('crops.create')} className="text-green-600 hover:underline">Créalo aquí</Link>
                                    </p>
                                    <InputError message={errors.crop_id} className="mt-2" />
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
                                        disabled={!!data.cost_center_id}
                                    />
                                    <InputError message={errors.cc} className="mt-2" />
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
                                        value={data.expected_harvest_date}
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
                                <Link href={route('plantings.index')} className="text-gray-600 hover:text-gray-900">
                                    Cancelar
                                </Link>
                                <PrimaryButton disabled={processing}>
                                    {processing ? 'Registrando...' : 'Registrar Labor'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}





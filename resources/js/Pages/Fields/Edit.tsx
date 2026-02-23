import { FormEventHandler } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';

interface FieldEditProps {
    field: {
        id: number;
        name: string;
        code: string | null;
        area_hectares: number;
        soil_type_id: number | null;
        status: string;
        notes: string | null;
    };
    soilTypes: Array<{ id: number; name: string }>;
}

export default function Edit({ field, soilTypes }: FieldEditProps) {
    const { data, setData, patch, processing, errors } = useForm({
        name: field.name,
        code: field.code || '',
        area_hectares: field.area_hectares.toString(),
        soil_type_id: field.soil_type_id?.toString() || '',
        status: field.status,
        notes: field.notes || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('fields.update', field.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-4">
                    <Link href={route('fields.show', field.id)} className="text-gray-500 hover:text-gray-700">
                        ← Volver
                    </Link>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Editar Campo: {field.name}
                    </h2>
                </div>
            }
        >
            <Head title={`Editar Campo: ${field.name}`} />

            <div className="py-6">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputLabel htmlFor="name" value="Nombre del Campo *" />
                                    <TextInput
                                        id="name"
                                        type="text"
                                        name="name"
                                        value={data.name}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.name} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="code" value="Código Interno" />
                                    <TextInput
                                        id="code"
                                        type="text"
                                        name="code"
                                        value={data.code}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('code', e.target.value)}
                                        placeholder="Ej: CAL-01"
                                    />
                                    <InputError message={errors.code} className="mt-2" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputLabel htmlFor="area_hectares" value="Superficie (hectáreas) *" />
                                    <TextInput
                                        id="area_hectares"
                                        type="number"
                                        name="area_hectares"
                                        value={data.area_hectares}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('area_hectares', e.target.value)}
                                        step="0.01"
                                        min="0.01"
                                        required
                                    />
                                    <InputError message={errors.area_hectares} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="status" value="Estado Actual *" />
                                    <select
                                        id="status"
                                        name="status"
                                        value={data.status}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                                        onChange={(e) => setData('status', e.target.value)}
                                        required
                                    >
                                        <option value="active">Activo / En producción</option>
                                        <option value="fallow">En Barbecho / Descanso</option>
                                        <option value="preparing">En Preparación</option>
                                    </select>
                                    <InputError message={errors.status} className="mt-2" />
                                </div>
                            </div>

                            <div>
                                <InputLabel htmlFor="soil_type_id" value="Tipo de Suelo" />
                                <select
                                    id="soil_type_id"
                                    name="soil_type_id"
                                    value={data.soil_type_id}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                                    onChange={(e) => setData('soil_type_id', e.target.value)}
                                >
                                    <option value="">Seleccionar...</option>
                                    {soilTypes.map((type) => (
                                        <option key={type.id} value={type.id}>
                                            {type.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.soil_type_id} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="notes" value="Notas y Observaciones" />
                                <textarea
                                    id="notes"
                                    name="notes"
                                    value={data.notes}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                                    rows={4}
                                    onChange={(e) => setData('notes', e.target.value)}
                                />
                                <InputError message={errors.notes} className="mt-2" />
                            </div>

                            <div className="flex items-center justify-end gap-4 pt-4 border-t">
                                <Link href={route('fields.show', field.id)} className="text-sm text-gray-600 hover:text-gray-900">
                                    Cancelar
                                </Link>
                                <PrimaryButton disabled={processing}>
                                    {processing ? 'Guardando...' : 'Actualizar Campo'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

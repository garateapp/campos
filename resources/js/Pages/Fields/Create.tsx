import { FormEventHandler } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';

interface CreateProps {
    soilTypes: Array<{ id: number; name: string }>;
}

export default function Create({ soilTypes }: CreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        code: '',
        area_hectares: '',
        soil_type_id: '',
        status: 'active',
        notes: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('fields.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-4">
                    <Link
                        href={route('fields.index')}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ← Volver
                    </Link>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Nueva Parcela
                    </h2>
                </div>
            }
        >
            <Head title="Nueva Parcela" />

            <div className="py-6">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputLabel htmlFor="name" value="Nombre de la Parcela *" />
                                    <TextInput
                                        id="name"
                                        type="text"
                                        name="name"
                                        value={data.name}
                                        className="mt-1 block w-full"
                                        isFocused={true}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.name} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="code" value="Código (opcional)" />
                                    <TextInput
                                        id="code"
                                        type="text"
                                        name="code"
                                        value={data.code}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('code', e.target.value)}
                                        placeholder="Ej: P-001"
                                    />
                                    <InputError message={errors.code} className="mt-2" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputLabel htmlFor="area_hectares" value="Área (hectáreas) *" />
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
                            </div>

                            <div>
                                <InputLabel htmlFor="status" value="Estado" />
                                <select
                                    id="status"
                                    name="status"
                                    value={data.status}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                                    onChange={(e) => setData('status', e.target.value)}
                                >
                                    <option value="active">Activa</option>
                                    <option value="fallow">En Descanso</option>
                                    <option value="preparing">En Preparación</option>
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
                                    placeholder="Información adicional sobre la parcela..."
                                />
                                <InputError message={errors.notes} className="mt-2" />
                            </div>

                            <div className="flex items-center justify-end gap-4 pt-4">
                                <Link
                                    href={route('fields.index')}
                                    className="text-gray-600 hover:text-gray-900"
                                >
                                    Cancelar
                                </Link>
                                <PrimaryButton disabled={processing}>
                                    {processing ? 'Guardando...' : 'Crear Parcela'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

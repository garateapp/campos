import { Head, Link, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FormEventHandler, useState } from 'react';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';

interface SoilType {
    id: number;
    name: string;
    fields_count: number;
}

interface SoilTypesIndexProps {
    soilTypes: SoilType[];
}

export default function Index({ soilTypes }: SoilTypesIndexProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingSoilType, setEditingSoilType] = useState<SoilType | null>(null);

    const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
        name: '',
    });

    const openCreateModal = () => {
        reset();
        clearErrors();
        setEditingSoilType(null);
        setIsCreateModalOpen(true);
    };

    const openEditModal = (soilType: SoilType) => {
        setData('name', soilType.name);
        clearErrors();
        setEditingSoilType(soilType);
        setIsCreateModalOpen(true);
    };

    const closeModal = () => {
        setIsCreateModalOpen(false);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editingSoilType) {
            patch(route('soil-types.update', editingSoilType.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('soil-types.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (soilType: SoilType) => {
        if (soilType.fields_count > 0) {
            alert('No se puede eliminar un tipo de suelo con parcelas asociadas.');
            return;
        }

        if (confirm(`¿Estás seguro de eliminar el tipo de suelo "${soilType.name}"?`)) {
            router.delete(route('soil-types.destroy', soilType.id));
        }
    };

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
                                Gestionar Tipos de Suelo
                            </h2>
                            <p className="text-sm text-gray-500">
                                Definiciones de suelo para tus parcelas (Arcilloso, Arenoso, etc.)
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-lg font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 transition ease-in-out duration-150"
                    >
                        + Nuevo Tipo de Suelo
                    </button>
                </div>
            }
        >
            <Head title="Tipos de Suelo" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg border border-gray-100 max-w-2xl">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Parcelas</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {soilTypes.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-10 text-center text-gray-500">
                                            No hay tipos de suelo registrados.
                                        </td>
                                    </tr>
                                ) : (
                                    soilTypes.map((soilType) => (
                                        <tr key={soilType.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {soilType.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                <span className="bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-bold">
                                                    {soilType.fields_count}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => openEditModal(soilType)}
                                                    className="text-green-600 hover:text-green-900 mr-4"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(soilType)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Modal show={isCreateModalOpen} onClose={closeModal} maxWidth="md">
                <form onSubmit={submit} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                        {editingSoilType ? 'Editar Tipo de Suelo' : 'Nuevo Tipo de Suelo'}
                    </h2>

                    <div>
                        <InputLabel htmlFor="name" value="Nombre del Tipo de Suelo *" />
                        <TextInput
                            id="name"
                            type="text"
                            name="name"
                            value={data.name}
                            className="mt-1 block w-full"
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            isFocused
                            placeholder="Ej: Franco arcilloso, Arenoso..."
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={closeModal} className="mr-3">
                            Cancelar
                        </SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            {editingSoilType ? 'Actualizar' : 'Crear'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}

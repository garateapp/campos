import { Head, Link, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FormEventHandler, useState } from 'react';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';

interface Family {
    id: number;
    name: string;
    species_count: number;
}

interface FamiliesIndexProps {
    families: Family[];
}

export default function Index({ families }: FamiliesIndexProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingFamily, setEditingFamily] = useState<Family | null>(null);

    const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
        name: '',
    });

    const openCreateModal = () => {
        reset();
        clearErrors();
        setEditingFamily(null);
        setIsCreateModalOpen(true);
    };

    const openEditModal = (family: Family) => {
        setData('name', family.name);
        clearErrors();
        setEditingFamily(family);
        setIsCreateModalOpen(true);
    };

    const closeModal = () => {
        setIsCreateModalOpen(false);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editingFamily) {
            patch(route('families.update', editingFamily.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('families.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (family: Family) => {
        if (family.species_count > 0) {
            alert('No se puede eliminar una familia con especies asociadas.');
            return;
        }

        if (confirm(`¿Estás seguro de eliminar la familia "${family.name}"?`)) {
            router.delete(route('families.destroy', family.id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href={route('crops.index')} className="text-gray-500 hover:text-gray-700">
                            ← Volver
                        </Link>
                        <div>
                            <h2 className="text-xl font-semibold leading-tight text-gray-800">
                                Gestionar Familias
                            </h2>
                            <p className="text-sm text-gray-500">
                                Clasificación superior de cuarteles (Carozos, Pomáceas, etc.)
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-lg font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 transition ease-in-out duration-150"
                    >
                        + Nueva Familia
                    </button>
                </div>
            }
        >
            <Head title="Familias de Cuarteles" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg border border-gray-100 max-w-3xl">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Especies</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {families.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-10 text-center text-gray-500">
                                            No hay familias registradas.
                                        </td>
                                    </tr>
                                ) : (
                                    families.map((family) => (
                                        <tr key={family.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {family.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-bold">
                                                    {family.species_count}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => openEditModal(family)}
                                                    className="text-green-600 hover:text-green-900 mr-4"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(family)}
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
                        {editingFamily ? 'Editar Familia' : 'Nueva Familia de Cuartel'}
                    </h2>

                    <div>
                        <InputLabel htmlFor="name" value="Nombre de la Familia *" />
                        <TextInput
                            id="name"
                            type="text"
                            name="name"
                            value={data.name}
                            className="mt-1 block w-full"
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            isFocused
                            placeholder="Ej: Carozos, Cítricos, Pomáceas..."
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={closeModal} className="mr-3">
                            Cancelar
                        </SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            {editingFamily ? 'Actualizar' : 'Crear'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}

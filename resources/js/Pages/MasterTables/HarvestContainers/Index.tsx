import { Head, Link, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FormEventHandler, useState } from 'react';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';

interface Species {
    id: number;
    name: string;
}

interface HarvestContainer {
    id: number;
    species_id: number;
    name: string;
    quantity_per_bin: number;
    bin_weight_kg: number;
    species?: Species;
}

interface IndexProps {
    containers: HarvestContainer[];
    species: Species[];
}

export default function Index({ containers, species }: IndexProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingContainer, setEditingContainer] = useState<HarvestContainer | null>(null);

    const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
        species_id: '',
        name: '',
        quantity_per_bin: 1,
        bin_weight_kg: '',
    });

    const openCreateModal = () => {
        reset();
        clearErrors();
        setEditingContainer(null);
        setIsCreateModalOpen(true);
    };

    const openEditModal = (container: HarvestContainer) => {
        setData({
            species_id: container.species_id.toString(),
            name: container.name,
            quantity_per_bin: container.quantity_per_bin,
            bin_weight_kg: container.bin_weight_kg.toString(),
        });
        clearErrors();
        setEditingContainer(container);
        setIsCreateModalOpen(true);
    };

    const closeModal = () => {
        setIsCreateModalOpen(false);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editingContainer) {
            patch(route('harvest-containers.update', editingContainer.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('harvest-containers.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (container: HarvestContainer) => {
        if (confirm(`¿Estás seguro de eliminar el envase "${container.name}"?`)) {
            router.delete(route('harvest-containers.destroy', container.id));
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
                                Envases de Cosecha
                            </h2>
                            <p className="text-sm text-gray-500">
                                Capacidad de Totes, Bins y Envases por Especie
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-lg font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 transition ease-in-out duration-150"
                    >
                        + Nuevo Envase
                    </button>
                </div>
            }
        >
            <Head title="Envases de Cosecha" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg border border-gray-100 max-w-3xl">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Especie</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre del Envase</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidades por Bin</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Peso Bin (Kg)</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Peso Unitario (Calc)</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {containers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                                            No hay envases configurados.
                                        </td>
                                    </tr>
                                ) : (
                                    containers.map((container) => (
                                        <tr key={container.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {container.species?.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {container.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {container.quantity_per_bin}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {container.bin_weight_kg} Kg
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {(container.bin_weight_kg / container.quantity_per_bin).toFixed(2)} Kg
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => openEditModal(container)}
                                                    className="text-green-600 hover:text-green-900 mr-4"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(container)}
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
                        {editingContainer ? 'Editar Envase' : 'Nuevo Envase'}
                    </h2>

                    <div className="grid gap-4">
                        <div>
                            <InputLabel htmlFor="species_id" value="Especie *" />
                            <select
                                id="species_id"
                                name="species_id"
                                value={data.species_id}
                                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                onChange={(e) => setData('species_id', e.target.value)}
                                required
                            >
                                <option value="">Seleccione una Especie</option>
                                {species.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.species_id} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="name" value="Nombre del Envase *" />
                            <TextInput
                                id="name"
                                type="text"
                                name="name"
                                value={data.name}
                                className="mt-1 block w-full"
                                onChange={(e) => setData('name', e.target.value)}
                                required
                                placeholder="Ej: Tote, Bin, Caja"
                            />
                            <InputError message={errors.name} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="quantity_per_bin" value="Unidades por Bin *" />
                            <TextInput
                                id="quantity_per_bin"
                                type="number"
                                name="quantity_per_bin"
                                value={data.quantity_per_bin}
                                className="mt-1 block w-full"
                                onChange={(e) => setData('quantity_per_bin', parseInt(e.target.value))}
                                required
                                min="1"
                                placeholder="Ej: 24 (para totes) o 1 (directo)"
                            />
                            <InputError message={errors.quantity_per_bin} className="mt-2" />
                            <p className="text-xs text-gray-500 mt-1">Si es directo a Bin, ingrese 1.</p>
                        </div>

                        <div>
                            <InputLabel htmlFor="bin_weight_kg" value="Peso Total del Bin (Kg) *" />
                            <TextInput
                                id="bin_weight_kg"
                                type="number"
                                step="0.01"
                                name="bin_weight_kg"
                                value={data.bin_weight_kg}
                                className="mt-1 block w-full"
                                onChange={(e) => setData('bin_weight_kg', e.target.value)}
                                required
                                placeholder="Ej: 220 o 435"
                            />
                            <InputError message={errors.bin_weight_kg} className="mt-2" />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={closeModal} className="mr-3">
                            Cancelar
                        </SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            {editingContainer ? 'Actualizar' : 'Crear'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}

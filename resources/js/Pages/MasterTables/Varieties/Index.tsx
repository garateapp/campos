import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import BulkUploadButton from '@/Components/BulkUploadButton';

interface Species {
    id: number;
    name: string;
    family?: {
        name: string;
    };
}

interface Variety {
    id: number;
    species_id: number;
    name: string;
    species?: Species;
}

interface Props {
    varieties: Variety[];
    species: Species[];
}

export default function Index({ varieties, species }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVariety, setEditingVariety] = useState<Variety | null>(null);

    const { data, setData, post, patch, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        species_id: '',
        name: '',
    });

    const openModal = (varietyToEdit: Variety | null = null) => {
        setEditingVariety(varietyToEdit);
        if (varietyToEdit) {
            setData({
                species_id: varietyToEdit.species_id.toString(),
                name: varietyToEdit.name,
            });
        } else {
            reset();
        }
        clearErrors();
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingVariety(null);
        reset();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingVariety) {
            patch(route('varieties.update', editingVariety.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('varieties.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('¿Estás seguro de que deseas eliminar esta variedad?')) {
            destroy(route('varieties.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Maestro de Variedades
                    </h2>
                    <div className="flex items-center gap-2">
                        <BulkUploadButton type="varieties" />
                        <PrimaryButton onClick={() => openModal()}>
                            + Nueva Variedad
                        </PrimaryButton>
                    </div>
                </div>
            }
        >
            <Head title="Variedades" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Especie</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Familia</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {varieties.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.species?.name || 'S/E'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                                    {item.species?.family?.name || 'S/F'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => openModal(item)} className="text-indigo-600 hover:text-indigo-900 mr-4">Editar</button>
                                                <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">Eliminar</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {varieties.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No hay variedades registradas.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <Modal show={isModalOpen} onClose={closeModal}>
                <form onSubmit={handleSubmit} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">
                        {editingVariety ? 'Editar Variedad' : 'Nueva Variedad'}
                    </h2>

                    <div className="mt-6">
                        <InputLabel htmlFor="species_id" value="Especie" />
                        <select
                            id="species_id"
                            name="species_id"
                            value={data.species_id}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                            onChange={(e) => setData('species_id', e.target.value)}
                            required
                        >
                            <option value="">Seleccionar Especie...</option>
                            {species.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                        <InputError message={errors.species_id} className="mt-2" />
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="name" value="Nombre de la Variedad" />
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

                    <div className="mt-6 flex justify-end">
                        <PrimaryButton type="button" onClick={closeModal} className="bg-gray-200 text-gray-700 hover:bg-gray-300 mr-2 border-none">
                            Cancelar
                        </PrimaryButton>
                        <PrimaryButton disabled={processing}>
                            {editingVariety ? 'Actualizar' : 'Crear'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}

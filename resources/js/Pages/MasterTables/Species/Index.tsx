import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';

interface Family {
    id: number;
    name: string;
}

interface Species {
    id: number;
    family_id: number;
    name: string;
    scientific_name: string | null;
    family?: Family;
}

interface Props {
    species: Species[];
    families: Family[];
}

export default function Index({ species, families }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSpecies, setEditingSpecies] = useState<Species | null>(null);

    const { data, setData, post, patch, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        family_id: '',
        name: '',
        scientific_name: '',
    });

    const openModal = (speciesToEdit: Species | null = null) => {
        setEditingSpecies(speciesToEdit);
        if (speciesToEdit) {
            setData({
                family_id: speciesToEdit.family_id.toString(),
                name: speciesToEdit.name,
                scientific_name: speciesToEdit.scientific_name || '',
            });
        } else {
            reset();
        }
        clearErrors();
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingSpecies(null);
        reset();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSpecies) {
            patch(route('species.update', editingSpecies.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('species.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('¿Estás seguro de que deseas eliminar esta especie?')) {
            destroy(route('species.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Maestro de Especies
                    </h2>
                    <PrimaryButton onClick={() => openModal()}>
                        + Nueva Especie
                    </PrimaryButton>
                </div>
            }
        >
            <Head title="Especies" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Familia</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre Científico</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {species.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                                    {item.family?.name || 'Sin Familia'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 italic text-sm">{item.scientific_name || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => openModal(item)} className="text-indigo-600 hover:text-indigo-900 mr-4">Editar</button>
                                                <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">Eliminar</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {species.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No hay especies registradas.</td>
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
                        {editingSpecies ? 'Editar Especie' : 'Nueva Especie'}
                    </h2>

                    <div className="mt-6">
                        <InputLabel htmlFor="family_id" value="Familia" />
                        <select
                            id="family_id"
                            name="family_id"
                            value={data.family_id}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                            onChange={(e) => setData('family_id', e.target.value)}
                            required
                        >
                            <option value="">Seleccionar Familia...</option>
                            {families.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                        <InputError message={errors.family_id} className="mt-2" />
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="name" value="Nombre de la Especie" />
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

                    <div className="mt-4">
                        <InputLabel htmlFor="scientific_name" value="Nombre Científico (opcional)" />
                        <TextInput
                            id="scientific_name"
                            type="text"
                            name="scientific_name"
                            value={data.scientific_name}
                            className="mt-1 block w-full italic"
                            onChange={(e) => setData('scientific_name', e.target.value)}
                        />
                        <InputError message={errors.scientific_name} className="mt-2" />
                    </div>

                    <div className="mt-6 flex justify-end">
                        <PrimaryButton type="button" onClick={closeModal} className="bg-gray-200 text-gray-700 hover:bg-gray-300 mr-2 border-none">
                            Cancelar
                        </PrimaryButton>
                        <PrimaryButton disabled={processing}>
                            {editingSpecies ? 'Actualizar' : 'Crear'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}

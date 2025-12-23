import { Head, Link, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FormEventHandler, useState } from 'react';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';

interface Worker {
    id: number;
    name: string;
    rut: string;
    phone: string;
    contractor_id: number;
    contractor_name: string;
    is_identity_validated: boolean;
}

interface Contractor {
    id: number;
    business_name: string;
}

interface IndexProps {
    workers: Worker[];
    contractors: Contractor[];
}

export default function Index({ workers, contractors }: IndexProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingWorker, setEditingWorker] = useState<Worker | null>(null);

    const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
        name: '',
        rut: '',
        phone: '',
        contractor_id: '',
        is_identity_validated: false,
    });

    const openCreateModal = () => {
        reset();
        clearErrors();
        setEditingWorker(null);
        setIsCreateModalOpen(true);
    };

    const openEditModal = (worker: Worker) => {
        setData({
            name: worker.name,
            rut: worker.rut,
            phone: worker.phone || '',
            contractor_id: worker.contractor_id.toString(),
            is_identity_validated: worker.is_identity_validated,
        });
        clearErrors();
        setEditingWorker(worker);
        setIsCreateModalOpen(true);
    };

    const closeModal = () => {
        setIsCreateModalOpen(false);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editingWorker) {
            patch(route('workers.update', editingWorker.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('workers.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (worker: Worker) => {
        if (confirm(`¿Estás seguro de eliminar el jornalero "${worker.name}"?`)) {
            router.delete(route('workers.destroy', worker.id));
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
                                Maestro de Jornaleros
                            </h2>
                            <p className="text-sm text-gray-500">
                                Gestión de trabajadores asociados a contratistas
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-lg font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 transition ease-in-out duration-150"
                    >
                        + Nuevo Jornalero
                    </button>
                </div>
            }
        >
            <Head title="Jornaleros" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg border border-gray-100">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Identidad</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RUT</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contratista</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {workers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                                            No hay jornaleros registrados.
                                        </td>
                                    </tr>
                                ) : (
                                    workers.map((worker) => (
                                        <tr key={worker.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {worker.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {worker.is_identity_validated ? (
                                                    <span className="text-green-600 font-bold" title="Validado">✓</span>
                                                ) : (
                                                    <span className="text-gray-300" title="No validado">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {worker.rut}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {worker.phone || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {worker.contractor_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => openEditModal(worker)}
                                                    className="text-green-600 hover:text-green-900 mr-4"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(worker)}
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
                        {editingWorker ? 'Editar Jornalero' : 'Nuevo Jornalero'}
                    </h2>

                    <div className="grid gap-4">
                        <div>
                            <InputLabel htmlFor="contractor_id" value="Contratista *" />
                            <select
                                id="contractor_id"
                                name="contractor_id"
                                value={data.contractor_id}
                                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                onChange={(e) => setData('contractor_id', e.target.value)}
                                required
                            >
                                <option value="">Seleccione un Contratista</option>
                                {contractors.map((contractor) => (
                                    <option key={contractor.id} value={contractor.id}>
                                        {contractor.business_name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.contractor_id} className="mt-2" />
                        </div>

                        <div className="flex items-center">
                            <input
                                id="is_identity_validated"
                                type="checkbox"
                                checked={data.is_identity_validated}
                                onChange={(e) => setData('is_identity_validated', e.target.checked)}
                                className="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-300 focus:ring focus:ring-green-200 focus:ring-opacity-50"
                            />
                            <label htmlFor="is_identity_validated" className="ml-2 block text-sm text-gray-900">
                                Identidad Validada por Administrador
                            </label>
                        </div>

                        <div>
                            <InputLabel htmlFor="name" value="Nombre Completo *" />
                            <TextInput
                                id="name"
                                type="text"
                                name="name"
                                value={data.name}
                                className="mt-1 block w-full"
                                onChange={(e) => setData('name', e.target.value)}
                                required
                                isFocused
                                placeholder="Ej: Pedro González"
                            />
                            <InputError message={errors.name} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="rut" value="RUT *" />
                            <TextInput
                                id="rut"
                                type="text"
                                name="rut"
                                value={data.rut}
                                className="mt-1 block w-full"
                                onChange={(e) => setData('rut', e.target.value)}
                                required
                                placeholder="Ej: 12.345.678-9"
                            />
                            <InputError message={errors.rut} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="phone" value="Teléfono" />
                            <TextInput
                                id="phone"
                                type="text"
                                name="phone"
                                value={data.phone}
                                className="mt-1 block w-full"
                                onChange={(e) => setData('phone', e.target.value)}
                                placeholder="Ej: +56 9 1234 5678"
                            />
                            <InputError message={errors.phone} className="mt-2" />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={closeModal} className="mr-3">
                            Cancelar
                        </SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            {editingWorker ? 'Actualizar' : 'Crear'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}

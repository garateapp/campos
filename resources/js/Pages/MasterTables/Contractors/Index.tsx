import { Head, Link, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FormEventHandler, useState } from 'react';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';

interface Contractor {
    id: number;
    business_name: string;
    rut: string;
    contact_name: string;
    contact_email: string;
}

interface IndexProps {
    contractors: Contractor[];
}

export default function Index({ contractors }: IndexProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingContractor, setEditingContractor] = useState<Contractor | null>(null);

    const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
        business_name: '',
        rut: '',
        contact_name: '',
        contact_email: '',
    });

    const openCreateModal = () => {
        reset();
        clearErrors();
        setEditingContractor(null);
        setIsCreateModalOpen(true);
    };

    const openEditModal = (contractor: Contractor) => {
        setData({
            business_name: contractor.business_name,
            rut: contractor.rut,
            contact_name: contractor.contact_name,
            contact_email: contractor.contact_email,
        });
        clearErrors();
        setEditingContractor(contractor);
        setIsCreateModalOpen(true);
    };

    const closeModal = () => {
        setIsCreateModalOpen(false);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editingContractor) {
            patch(route('contractors.update', editingContractor.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('contractors.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (contractor: Contractor) => {
        if (confirm(`¿Estás seguro de eliminar el contratista "${contractor.business_name}"?`)) {
            router.delete(route('contractors.destroy', contractor.id));
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
                                Maestro de Contratistas
                            </h2>
                            <p className="text-sm text-gray-500">
                                Gestión de empresas contratistas y sus datos de contacto
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-lg font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 transition ease-in-out duration-150"
                    >
                        + Nuevo Contratista
                    </button>
                </div>
            }
        >
            <Head title="Contratistas" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg border border-gray-100">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Razón Social</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RUT</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre Contacto</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email Contacto</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {contractors.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                                            No hay contratistas registrados.
                                        </td>
                                    </tr>
                                ) : (
                                    contractors.map((contractor) => (
                                        <tr key={contractor.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {contractor.business_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {contractor.rut}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {contractor.contact_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {contractor.contact_email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => openEditModal(contractor)}
                                                    className="text-green-600 hover:text-green-900 mr-4"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(contractor)}
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
                        {editingContractor ? 'Editar Contratista' : 'Nuevo Contratista'}
                    </h2>

                    <div className="grid gap-4">
                        <div>
                            <InputLabel htmlFor="business_name" value="Razón Social *" />
                            <TextInput
                                id="business_name"
                                type="text"
                                name="business_name"
                                value={data.business_name}
                                className="mt-1 block w-full"
                                onChange={(e) => setData('business_name', e.target.value)}
                                required
                                isFocused
                                placeholder="Ej: Servicios Agrícolas SPA"
                            />
                            <InputError message={errors.business_name} className="mt-2" />
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
                                placeholder="Ej: 76.123.456-K"
                            />
                            <InputError message={errors.rut} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="contact_name" value="Nombre de Contacto" />
                            <TextInput
                                id="contact_name"
                                type="text"
                                name="contact_name"
                                value={data.contact_name}
                                className="mt-1 block w-full"
                                onChange={(e) => setData('contact_name', e.target.value)}
                                placeholder="Ej: Juan Pérez"
                            />
                            <InputError message={errors.contact_name} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="contact_email" value="Email de Contacto" />
                            <TextInput
                                id="contact_email"
                                type="email"
                                name="contact_email"
                                value={data.contact_email}
                                className="mt-1 block w-full"
                                onChange={(e) => setData('contact_email', e.target.value)}
                                placeholder="Ej: contacto@servicios.cl"
                            />
                            <InputError message={errors.contact_email} className="mt-2" />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={closeModal} className="mr-3">
                            Cancelar
                        </SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            {editingContractor ? 'Actualizar' : 'Crear'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}

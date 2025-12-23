import { Head, Link, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FormEventHandler, useState } from 'react';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';

interface Card {
    id: number;
    code: string;
    status: 'active' | 'inactive' | 'lost';
}

interface IndexProps {
    cards: Card[];
}

export default function Index({ cards }: IndexProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState<Card | null>(null);

    const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
        code: '',
        status: 'active',
    });

    const openCreateModal = () => {
        reset();
        clearErrors();
        setEditingCard(null);
        setIsCreateModalOpen(true);
    };

    const openEditModal = (card: Card) => {
        setData({
            code: card.code,
            status: card.status,
        });
        clearErrors();
        setEditingCard(card);
        setIsCreateModalOpen(true);
    };

    const closeModal = () => {
        setIsCreateModalOpen(false);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editingCard) {
            patch(route('cards.update', editingCard.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('cards.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (card: Card) => {
        if (confirm(`¿Estás seguro de eliminar la tarjeta "${card.code}"?`)) {
            router.delete(route('cards.destroy', card.id));
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Activa</span>;
            case 'inactive': return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Inactiva</span>;
            case 'lost': return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Perdida</span>;
            default: return status;
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
                                Maestro de Tarjetas
                            </h2>
                            <p className="text-sm text-gray-500">
                                Inventario de tarjetas físicas y su estado
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-lg font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 transition ease-in-out duration-150"
                    >
                        + Nueva Tarjeta
                    </button>
                </div>
            }
        >
            <Head title="Tarjetas" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg border border-gray-100 max-w-2xl">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {cards.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-10 text-center text-gray-500">
                                            No hay tarjetas registradas.
                                        </td>
                                    </tr>
                                ) : (
                                    cards.map((card) => (
                                        <tr key={card.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {card.code}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {getStatusLabel(card.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => openEditModal(card)}
                                                    className="text-green-600 hover:text-green-900 mr-4"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(card)}
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
                        {editingCard ? 'Editar Tarjeta' : 'Nueva Tarjeta'}
                    </h2>

                    <div className="grid gap-4">
                        <div>
                            <InputLabel htmlFor="code" value="Código / UID *" />
                            <TextInput
                                id="code"
                                type="text"
                                name="code"
                                value={data.code}
                                className="mt-1 block w-full"
                                onChange={(e) => setData('code', e.target.value)}
                                required
                                isFocused
                                placeholder="Ej: CARD-001"
                            />
                            <InputError message={errors.code} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="status" value="Estado *" />
                            <select
                                id="status"
                                name="status"
                                value={data.status}
                                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                onChange={(e) => setData('status', e.target.value)}
                                required
                            >
                                <option value="active">Activa</option>
                                <option value="inactive">Inactiva</option>
                                <option value="lost">Perdida</option>
                            </select>
                            <InputError message={errors.status} className="mt-2" />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={closeModal} className="mr-3">
                            Cancelar
                        </SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            {editingCard ? 'Actualizar' : 'Crear'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}

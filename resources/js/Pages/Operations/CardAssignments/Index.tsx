import { Head, Link, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FormEventHandler, useState, useEffect } from 'react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton'; // For copy button
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';

interface Worker {
    id: number;
    name: string;
    rut: string;
    contractor_name: string; // Assuming we flatten this or use relationship
    contractor?: { business_name: string };
}

interface Card {
    id: number;
    code: string;
}

interface Assignment {
    id: number;
    worker_id: number;
    card_id: number;
}

interface IndexProps {
    workers: Worker[];
    cards: Card[];
    assignments: Record<string, Assignment>; // Keyed by worker_id
    date: string;
}

export default function Index({ workers, cards, assignments, date }: IndexProps) {
    // We maintain a local state for the grid to allow fast edits before saving
    // Initial state is derived from `assignments` prop

    // Transform assignments prop (Record<worker_id, Assignment>) into a simpler map <worker_id, card_id>
    const getInitialAssignments = () => {
        const map: Record<number, string> = {}; // worker_id -> card_id (string for select)
        workers.forEach(w => {
            if (assignments[w.id]) {
                map[w.id] = assignments[w.id].card_id.toString();
            } else {
                map[w.id] = '';
            }
        });
        return map;
    };

    const [formState, setFormState] = useState<Record<number, string>>(getInitialAssignments());

    // Update local state when date/assignments change (e.g. after copy or date switch)
    useEffect(() => {
        setFormState(getInitialAssignments());
    }, [assignments, workers]);

    const { data: filterData, setData: setFilterData, get } = useForm({
        date: date,
    });

    const { post, processing } = useForm({});

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilterData('date', e.target.value);
        get(route('card-assignments.index'), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleAssignmentChange = (workerId: number, cardId: string) => {
        setFormState(prev => ({
            ...prev,
            [workerId]: cardId
        }));
    };

    const saveAssignments: FormEventHandler = (e) => {
        e.preventDefault();
        // Transform formState into array for backend
        const assignmentsPayload = Object.entries(formState).map(([workerId, cardId]) => ({
            worker_id: Number(workerId),
            card_id: cardId ? Number(cardId) : null,
        }));

        router.post(route('card-assignments.store'), {
            date: filterData.date,
            assignments: assignmentsPayload
        }, {
            preserveScroll: true,
            onSuccess: () => {
                // Flash message handled globally?
            }
        });
    };

    const copyPreviousDay = () => {
        if (confirm(`¿Estás seguro de copiar las asignaciones del día anterior al ${filterData.date}? Esto agregará asignaciones faltantes.`)) {
            router.post(route('card-assignments.copy-previous'), {
                date: filterData.date
            }, {
                preserveScroll: true,
            });
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
                                Asignación Diaria de Tarjetas
                            </h2>
                            <p className="text-sm text-gray-500">
                                Asigna tarjetas a jornaleros por día
                            </p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Asignación de Tarjetas" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                    {/* Toolbar */}
                    <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4 justify-between items-end">
                        <div>
                            <InputLabel htmlFor="date" value="Fecha de Asignación" />
                            <TextInput
                                id="date"
                                type="date"
                                className="mt-1 block"
                                value={filterData.date}
                                onChange={handleDateChange}
                            />
                        </div>

                        <div className="flex gap-2">
                            <SecondaryButton onClick={copyPreviousDay} type="button">
                                📋 Copiar del Día Anterior
                            </SecondaryButton>
                            <PrimaryButton onClick={saveAssignments} disabled={processing}>
                                💾 Guardar Cambios
                            </PrimaryButton>
                        </div>
                    </div>

                    {/* Grid */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg border border-gray-100">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jornalero</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contratista</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarjeta Asignada</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {workers.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-10 text-center text-gray-500">
                                            No hay jornaleros activos para asignar.
                                        </td>
                                    </tr>
                                ) : (
                                    workers.map((worker) => (
                                        <tr key={worker.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {worker.name}
                                                <div className="text-xs text-gray-400">{worker.rut}</div>
                                            </td>
                                            <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                                                {worker.contractor?.business_name || '-'}
                                            </td>
                                            <td className="px-6 py-2 whitespace-nowrap text-sm font-medium">
                                                <select
                                                    value={formState[worker.id] || ''}
                                                    onChange={(e) => handleAssignmentChange(worker.id, e.target.value)}
                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                                                >
                                                    <option value="">-- Sin Asignar --</option>
                                                    {cards.map(card => (
                                                        <option key={card.id} value={card.id}>
                                                            {card.code}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 flex justify-end">
                        <PrimaryButton onClick={saveAssignments} disabled={processing}>
                            💾 Guardar Cambios
                        </PrimaryButton>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState, useEffect, useRef } from 'react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

interface Field {
    id: number;
    name: string;
}

interface Species {
    id: number;
    name: string;
}

interface HarvestContainer {
    id: number;
    name: string;
    species_id: number;
}

interface IndexProps {
    fields: Field[];
    containers: HarvestContainer[];
    species: Species[];
}

export default function Index({ fields, containers, species }: IndexProps) {
    const { data, setData, post, processing, errors, reset, wasSuccessful } = useForm({
        card_code: '',
        date: new Date().toISOString().split('T')[0],
        field_id: '',
        species_id: '', // Used for filtering containers
        harvest_container_id: '',
        quantity: 1,
    });

    const [filteredContainers, setFilteredContainers] = useState<HarvestContainer[]>([]);
    const cardInputRef = useRef<HTMLInputElement>(null);
    const flash = (usePage().props.flash || {}) as { success?: string; warning?: string; error?: string };

    // Filter containers when species changes
    useEffect(() => {
        if (data.species_id) {
            setFilteredContainers(containers.filter(c => c.species_id.toString() === data.species_id));
        } else {
            setFilteredContainers([]);
        }
    }, [data.species_id, containers]);

    // Refocus after scan
    useEffect(() => {
        if (wasSuccessful) {
            setData('card_code', '');
            cardInputRef.current?.focus();
        }
    }, [wasSuccessful]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('harvest-collection.store'), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setData('card_code', '');
            },
            onError: () => {
                cardInputRef.current?.focus();
            }
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Recolección de Cosecha (Conteo)
                </h2>
            }
        >
            <Head title="Recolección Cosecha" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg border border-gray-100 p-6">

                        {/* Context Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                            <div>
                                <InputLabel htmlFor="date" value="Fecha *" />
                                <TextInput
                                    id="date"
                                    type="date"
                                    className="mt-1 block w-full"
                                    value={data.date}
                                    onChange={(e) => setData('date', e.target.value)}
                                    required
                                />
                                <InputError message={errors.date} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="field_id" value="Cuartel *" />
                                <select
                                    id="field_id"
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    value={data.field_id}
                                    onChange={(e) => setData('field_id', e.target.value)}
                                    required
                                >
                                    <option value="">Seleccione Cuartel</option>
                                    {fields.map((field) => (
                                        <option key={field.id} value={field.id}>{field.name}</option>
                                    ))}
                                </select>
                                <InputError message={errors.field_id} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="species_id" value="Especie (Filtro) *" />
                                <select
                                    id="species_id"
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    value={data.species_id}
                                    onChange={(e) => setData('species_id', e.target.value)}
                                    required
                                >
                                    <option value="">Seleccione Especie</option>
                                    {species.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <InputLabel htmlFor="harvest_container_id" value="Envase a Contar *" />
                                <select
                                    id="harvest_container_id"
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    value={data.harvest_container_id}
                                    onChange={(e) => setData('harvest_container_id', e.target.value)}
                                    required
                                    disabled={!data.species_id}
                                >
                                    <option value="">Seleccione Envase</option>
                                    {filteredContainers.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <InputError message={errors.harvest_container_id} className="mt-2" />
                            </div>
                        </div>

                        {/* Flash Messages Area - Prominent */}
                        <div>
                            {flash.success && (
                                <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-200 dark:text-green-800" role="alert">
                                    <span className="font-medium">Registrado!</span> {flash.success}
                                </div>
                            )}
                            {errors.card_code && (
                                <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
                                    <span className="font-medium">Error!</span> {errors.card_code}
                                </div>
                            )}
                        </div>

                        {/* Scanning & Quantity Area */}
                        <form onSubmit={submit} className="max-w-xl mx-auto text-center mt-8 border-t pt-8">
                            <div className="mb-6 flex justify-center items-center gap-4">
                                <InputLabel htmlFor="quantity" value="Cantidad a sumar:" className="text-lg" />
                                <TextInput
                                    id="quantity"
                                    type="number"
                                    min="1"
                                    className="w-24 text-center text-lg"
                                    value={data.quantity}
                                    onChange={(e) => setData('quantity', parseInt(e.target.value))}
                                />
                            </div>

                            <h3 className="text-lg font-medium text-gray-900 mb-4">Escanear Tarjeta</h3>

                            <div className="flex justify-center items-center gap-4">
                                <div className="w-full">
                                    <TextInput
                                        id="card_code"
                                        ref={cardInputRef}
                                        type="text"
                                        className="mt-1 block w-full text-center text-2xl tracking-widest"
                                        value={data.card_code}
                                        onChange={(e) => setData('card_code', e.target.value)}
                                        placeholder="Escanee código aquí..."
                                        autoFocus
                                        autoComplete="off"
                                    />
                                </div>
                                <PrimaryButton disabled={processing} className="h-11">
                                    Registrar
                                </PrimaryButton>
                            </div>
                            <p className="text-sm text-gray-500 mt-2">
                                El sistema sumará {data.quantity} unidad(es) al trabajador escaneado.
                            </p>
                        </form>

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState, useEffect, useRef } from 'react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import { Transition } from '@headlessui/react';

interface Field {
    id: number;
    name: string;
}

interface TaskType {
    id: number;
    name: string;
}

interface IndexProps {
    fields: Field[];
    taskTypes: TaskType[];
}

export default function Index({ fields, taskTypes }: IndexProps) {
    const { data, setData, post, processing, errors, reset, wasSuccessful } = useForm({
        card_code: '',
        date: new Date().toISOString().split('T')[0],
        field_id: '',
        task_type_id: '',
    });

    const cardInputRef = useRef<HTMLInputElement>(null);
    const flash = (usePage().props.flash || {}) as { success?: string; warning?: string; error?: string };

    useEffect(() => {
        if (wasSuccessful) {
            setData('card_code', '');
            cardInputRef.current?.focus();
        }
    }, [wasSuccessful]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('attendance.store'), {
            preserveScroll: true,
            preserveState: true, // Keep field/task selection
            onSuccess: () => {
                setData('card_code', '');
            },
            onError: () => {
                // Focus back even on error to try again
                cardInputRef.current?.focus();
            }
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Registro de Asistencia
                </h2>
            }
        >
            <Head title="Asistencia" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg border border-gray-100 p-6">

                        {/* Context Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
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
                                <InputLabel htmlFor="field_id" value="Cuartel/Campo *" />
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
                                <InputLabel htmlFor="task_type_id" value="Tipo de Faena *" />
                                <select
                                    id="task_type_id"
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    value={data.task_type_id}
                                    onChange={(e) => setData('task_type_id', e.target.value)}
                                    required
                                >
                                    <option value="">Seleccione Faena</option>
                                    {taskTypes.map((type) => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                                <InputError message={errors.task_type_id} className="mt-2" />
                            </div>
                        </div>

                        {/* Flash Messages Area - Prominent */}
                        <div>
                            {flash.success && (
                                <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-200 dark:text-green-800" role="alert">
                                    <span className="font-medium">Éxito!</span> {flash.success}
                                </div>
                            )}
                            {flash.warning && (
                                <div className="p-4 mb-4 text-sm text-yellow-700 bg-yellow-100 rounded-lg dark:bg-yellow-200 dark:text-yellow-800" role="alert">
                                    <span className="font-medium">Atención!</span> {flash.warning}
                                </div>
                            )}
                            {errors.card_code && (
                                <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
                                    <span className="font-medium">Error!</span> {errors.card_code}
                                </div>
                            )}
                        </div>

                        {/* Scanning Area */}
                        <form onSubmit={submit} className="max-w-xl mx-auto text-center mt-8 border-t pt-8">
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
                                Asegúrese de que el cursor esté en el campo de texto antes de escanear.
                            </p>
                        </form>

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

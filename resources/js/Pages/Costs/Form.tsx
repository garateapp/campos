import { FormEventHandler, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';

interface Field {
    id: number;
    name: string;
}

interface Planting {
    id: number;
    label: string;
    field_id: number;
}

interface CostFormProps {
    cost: any;
    fields: Field[];
    plantings: Planting[];
}

const typeOptions = [
    { value: 'input', label: 'Insumo' },
    { value: 'labor', label: 'Mano de Obra' },
    { value: 'equipment', label: 'Maquinaria / Equipamiento' },
    { value: 'transport', label: 'Transporte / Logística' },
    { value: 'other', label: 'Otros Gastos' },
];

export default function Form({ cost, fields, plantings }: CostFormProps) {
    const isEditing = !!cost;

    const { data, setData, post, patch, processing, errors } = useForm({
        type: cost?.type || 'input',
        category: cost?.category || 'variable',
        description: cost?.description || '',
        amount: cost?.amount?.toString() || '',
        cost_date: cost?.cost_date || new Date().toISOString().split('T')[0],
        field_id: cost?.field_id?.toString() || '',
        planting_id: cost?.planting_id?.toString() || '',
        notes: cost?.notes || '',
    });

    const [filteredPlantings, setFilteredPlantings] = useState(
        data.field_id ? plantings.filter(p => p.field_id.toString() === data.field_id) : plantings
    );

    const handleFieldChange = (fieldId: string) => {
        setData('field_id', fieldId);
        setData('planting_id', '');
        if (fieldId) {
            setFilteredPlantings(plantings.filter(p => p.field_id.toString() === fieldId));
        } else {
            setFilteredPlantings(plantings);
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (isEditing) {
            patch(route('costs.update', cost.id));
        } else {
            post(route('costs.store'));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-4">
                    <Link href={route('costs.index')} className="text-gray-500 hover:text-gray-700">
                        ← Volver
                    </Link>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        {isEditing ? 'Editar Registro de Gasto' : 'Registrar Nuevo Gasto'}
                    </h2>
                </div>
            }
        >
            <Head title={isEditing ? 'Editar Gasto' : 'Nuevo Gasto'} />

            <div className="py-6">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <form onSubmit={submit} className="space-y-6">
                            <div>
                                <InputLabel htmlFor="description" value="Descripción del Gasto *" />
                                <TextInput
                                    id="description"
                                    type="text"
                                    name="description"
                                    value={data.description}
                                    className="mt-1 block w-full"
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Ej: Compra de fertilizantes, Pago cuadrilla poda..."
                                    required
                                />
                                <InputError message={errors.description} className="mt-2" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputLabel htmlFor="type" value="Tipo de Gasto *" />
                                    <select
                                        id="type"
                                        name="type"
                                        value={data.type}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                                        onChange={(e) => setData('type', e.target.value)}
                                        required
                                    >
                                        {typeOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.type} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="category" value="Categoría *" />
                                    <div className="mt-2 flex gap-4">
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                className="text-green-600 focus:ring-green-500"
                                                name="category"
                                                value="variable"
                                                checked={data.category === 'variable'}
                                                onChange={(e) => setData('category', e.target.value)}
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Variable</span>
                                        </label>
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                className="text-green-600 focus:ring-green-500"
                                                name="category"
                                                value="fixed"
                                                checked={data.category === 'fixed'}
                                                onChange={(e) => setData('category', e.target.value)}
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Fijo</span>
                                        </label>
                                    </div>
                                    <InputError message={errors.category} className="mt-2" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputLabel htmlFor="amount" value="Monto ($) *" />
                                    <TextInput
                                        id="amount"
                                        type="number"
                                        name="amount"
                                        value={data.amount}
                                        className="mt-1 block w-full text-lg font-bold"
                                        onChange={(e) => setData('amount', e.target.value)}
                                        step="1"
                                        min="0.01"
                                        required
                                    />
                                    <InputError message={errors.amount} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="cost_date" value="Fecha *" />
                                    <TextInput
                                        id="cost_date"
                                        type="date"
                                        name="cost_date"
                                        value={data.cost_date}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('cost_date', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.cost_date} className="mt-2" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputLabel htmlFor="field_id" value="Asignar a Parcela (opcional)" />
                                    <select
                                        id="field_id"
                                        name="field_id"
                                        value={data.field_id}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                                        onChange={(e) => handleFieldChange(e.target.value)}
                                    >
                                        <option value="">Gasto General (Sin parcela)</option>
                                        {fields.map(f => (
                                            <option key={f.id} value={f.id}>{f.name}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.field_id} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="planting_id" value="Asignar a Siembra (opcional)" />
                                    <select
                                        id="planting_id"
                                        name="planting_id"
                                        value={data.planting_id}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                                        onChange={(e) => setData('planting_id', e.target.value)}
                                        disabled={!data.field_id}
                                    >
                                        <option value="">Sin siembra específica</option>
                                        {filteredPlantings.map(p => (
                                            <option key={p.id} value={p.id}>{p.label}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.planting_id} className="mt-2" />
                                </div>
                            </div>

                            <div>
                                <InputLabel htmlFor="notes" value="Notas adicionales" />
                                <textarea
                                    id="notes"
                                    name="notes"
                                    value={data.notes}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                                    rows={3}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Detalles sobre proveedores, facturas, etc."
                                />
                                <InputError message={errors.notes} className="mt-2" />
                            </div>

                            <div className="flex items-center justify-end gap-4 pt-4 border-t">
                                <Link href={route('costs.index')} className="text-gray-600 hover:text-gray-900">
                                    Cancelar
                                </Link>
                                <PrimaryButton disabled={processing}>
                                    {processing ? 'Guardando...' : 'Registrar Gasto'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

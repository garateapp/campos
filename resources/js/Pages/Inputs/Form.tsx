import { FormEventHandler } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';

interface InputFormProps {
    input: any;
    fields: Array<{ id: number; name: string }>;
    categories: Array<{ id: number; name: string }>;
}

export default function Form({ input, fields, categories }: InputFormProps) {
    const isEditing = !!input;

    const { data, setData, post, patch, processing, errors } = useForm({
        name: input?.name || '',
        field_id: input?.field_id?.toString() || '',
        input_category_id: input?.input_category_id?.toString() || '',
        unit: input?.unit || 'kg',
        current_stock: input?.current_stock?.toString() || '0',
        min_stock_alert: input?.min_stock_alert?.toString() || '',
        unit_cost: input?.unit_cost?.toString() || '',
        notes: input?.notes || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (isEditing) {
            patch(route('inputs.update', input.id));
        } else {
            post(route('inputs.store'));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-4">
                    <Link href={route('inputs.index')} className="text-gray-500 hover:text-gray-700">
                        ← Volver
                    </Link>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        {isEditing ? 'Editar Insumo' : 'Nuevo Insumo'}
                    </h2>
                </div>
            }
        >
            <Head title={isEditing ? 'Editar Insumo' : 'Nuevo Insumo'} />

            <div className="py-6">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <form onSubmit={submit} className="space-y-6">
                            <div>
                                <InputLabel htmlFor="name" value="Nombre del Insumo *" />
                                <TextInput
                                    id="name"
                                    type="text"
                                    name="name"
                                    value={data.name}
                                    className="mt-1 block w-full"
                                    isFocused={!isEditing}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Ej: Urea 46%, Paraquat, etc."
                                    required
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="field_id" value="Parcela / Ubicación" />
                                <select
                                    id="field_id"
                                    name="field_id"
                                    value={data.field_id}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                                    onChange={(e) => setData('field_id', e.target.value)}
                                >
                                    <option value="">Bodega General (Sin parcela)</option>
                                    {fields.map(field => (
                                        <option key={field.id} value={field.id}>{field.name}</option>
                                    ))}
                                </select>
                                <p className="mt-1 text-xs text-gray-500">
                                    Asocia este insumo a una parcela específica para mejor control.
                                </p>
                                <InputError message={errors.field_id} className="mt-2" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputLabel htmlFor="input_category_id" value="Categoría *" />
                                    <select
                                        id="input_category_id"
                                        name="input_category_id"
                                        value={data.input_category_id}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                                        onChange={(e) => setData('input_category_id', e.target.value)}
                                        required
                                    >
                                        <option value="">Seleccionar Categoría</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.input_category_id} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="unit" value="Unidad de Medida *" />
                                    <TextInput
                                        id="unit"
                                        type="text"
                                        name="unit"
                                        value={data.unit}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('unit', e.target.value)}
                                        placeholder="Ej: kg, L, un, sacos"
                                        required
                                    />
                                    <InputError message={errors.unit} className="mt-2" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <InputLabel htmlFor="current_stock" value="Stock Inicial *" />
                                    <TextInput
                                        id="current_stock"
                                        type="number"
                                        name="current_stock"
                                        value={data.current_stock}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('current_stock', e.target.value)}
                                        step="0.01"
                                        min="0"
                                        required
                                    />
                                    <InputError message={errors.current_stock} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="min_stock_alert" value="Alerta Stock Mín." />
                                    <TextInput
                                        id="min_stock_alert"
                                        type="number"
                                        name="min_stock_alert"
                                        value={data.min_stock_alert}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('min_stock_alert', e.target.value)}
                                        step="0.01"
                                        min="0"
                                        placeholder="Ej: 5"
                                    />
                                    <InputError message={errors.min_stock_alert} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="unit_cost" value="Costo Unitario" />
                                    <TextInput
                                        id="unit_cost"
                                        type="number"
                                        name="unit_cost"
                                        value={data.unit_cost}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('unit_cost', e.target.value)}
                                        step="1"
                                        min="0"
                                        placeholder="Ej: 25000"
                                    />
                                    <InputError message={errors.unit_cost} className="mt-2" />
                                </div>
                            </div>

                            <div>
                                <InputLabel htmlFor="notes" value="Notas" />
                                <textarea
                                    id="notes"
                                    name="notes"
                                    value={data.notes}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                                    rows={3}
                                    onChange={(e) => setData('notes', e.target.value)}
                                />
                                <InputError message={errors.notes} className="mt-2" />
                            </div>

                            <div className="flex items-center justify-end gap-4 pt-4 border-t">
                                <Link href={route('inputs.index')} className="text-gray-600 hover:text-gray-900">
                                    Cancelar
                                </Link>
                                <PrimaryButton disabled={processing}>
                                    {processing ? 'Guardando...' : 'Guardar Insumo'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

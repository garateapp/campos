import { FormEventHandler } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';

interface CompanySettingsProps {
    company: {
        id: number;
        name: string;
        tax_id: string | null;
        address: string | null;
        phone: string | null;
        email: string | null;
        timezone: string;
        currency: string;
    };
}

export default function Settings({ company }: CompanySettingsProps) {
    const { data, setData, patch, processing, errors } = useForm({
        name: company.name,
        tax_id: company.tax_id || '',
        address: company.address || '',
        phone: company.phone || '',
        email: company.email || '',
        timezone: company.timezone,
        currency: company.currency,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('company.update'));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Configuración de la Empresa
                </h2>
            }
        >
            <Head title="Configuración" />

            <div className="py-6">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <form onSubmit={submit} className="space-y-6">
                            <div>
                                <InputLabel htmlFor="name" value="Nombre de la Empresa / Productor *" />
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputLabel htmlFor="tax_id" value="RUT / ID Tributario" />
                                    <TextInput
                                        id="tax_id"
                                        type="text"
                                        name="tax_id"
                                        value={data.tax_id}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('tax_id', e.target.value)}
                                    />
                                    <InputError message={errors.tax_id} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="email" value="Email de Contacto" />
                                    <TextInput
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('email', e.target.value)}
                                    />
                                    <InputError message={errors.email} className="mt-2" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputLabel htmlFor="phone" value="Teléfono" />
                                    <TextInput
                                        id="phone"
                                        type="text"
                                        name="phone"
                                        value={data.phone}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('phone', e.target.value)}
                                    />
                                    <InputError message={errors.phone} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="currency" value="Moneda por Defecto" />
                                    <select
                                        id="currency"
                                        name="currency"
                                        value={data.currency}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                                        onChange={(e) => setData('currency', e.target.value)}
                                    >
                                        <option value="CLP">Peso Chileno (CLP)</option>
                                        <option value="USD">Dólar (USD)</option>
                                        <option value="EUR">Euro (EUR)</option>
                                    </select>
                                    <InputError message={errors.currency} className="mt-2" />
                                </div>
                            </div>

                            <div>
                                <InputLabel htmlFor="address" value="Dirección" />
                                <TextInput
                                    id="address"
                                    type="text"
                                    name="address"
                                    value={data.address}
                                    className="mt-1 block w-full"
                                    onChange={(e) => setData('address', e.target.value)}
                                />
                                <InputError message={errors.address} className="mt-2" />
                            </div>

                            <div className="flex items-center justify-end gap-4 pt-4 border-t">
                                <PrimaryButton disabled={processing}>
                                    {processing ? 'Guardando...' : 'Guardar Cambios'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

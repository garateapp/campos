import { FormEventHandler, useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';

export default function Setup() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        tax_id: '',
        address: '',
        phone: '',
        email: '',
        timezone: 'America/Santiago',
        currency: 'CLP',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('company.store'));
    };

    return (
        <GuestLayout>
            <Head title="Configurar Empresa" />

            <div className="mb-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Configura tu Empresa</h2>
                <p className="mt-2 text-sm text-gray-600">
                    Completa la información de tu finca o empresa agrícola para comenzar.
                </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <InputLabel htmlFor="name" value="Nombre de la Empresa *" />
                    <TextInput
                        id="name"
                        type="text"
                        name="name"
                        value={data.name}
                        className="mt-1 block w-full"
                        autoComplete="organization"
                        isFocused={true}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                    />
                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="tax_id" value="RUT / ID Tributario" />
                    <TextInput
                        id="tax_id"
                        type="text"
                        name="tax_id"
                        value={data.tax_id}
                        className="mt-1 block w-full"
                        onChange={(e) => setData('tax_id', e.target.value)}
                        placeholder="12.345.678-9"
                    />
                    <InputError message={errors.tax_id} className="mt-2" />
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

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <InputLabel htmlFor="phone" value="Teléfono" />
                        <TextInput
                            id="phone"
                            type="tel"
                            name="phone"
                            value={data.phone}
                            className="mt-1 block w-full"
                            onChange={(e) => setData('phone', e.target.value)}
                        />
                        <InputError message={errors.phone} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="email" value="Email Empresarial" />
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

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <InputLabel htmlFor="timezone" value="Zona Horaria" />
                        <select
                            id="timezone"
                            name="timezone"
                            value={data.timezone}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            onChange={(e) => setData('timezone', e.target.value)}
                        >
                            <option value="America/Santiago">Chile (Santiago)</option>
                            <option value="America/Sao_Paulo">Brasil (São Paulo)</option>
                            <option value="America/Argentina/Buenos_Aires">Argentina (Buenos Aires)</option>
                            <option value="America/Lima">Perú (Lima)</option>
                            <option value="America/Bogota">Colombia (Bogotá)</option>
                            <option value="America/Mexico_City">México (Ciudad de México)</option>
                        </select>
                        <InputError message={errors.timezone} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="currency" value="Moneda" />
                        <select
                            id="currency"
                            name="currency"
                            value={data.currency}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            onChange={(e) => setData('currency', e.target.value)}
                        >
                            <option value="CLP">CLP - Peso Chileno</option>
                            <option value="USD">USD - Dólar</option>
                            <option value="EUR">EUR - Euro</option>
                            <option value="BRL">BRL - Real Brasileño</option>
                            <option value="ARS">ARS - Peso Argentino</option>
                            <option value="MXN">MXN - Peso Mexicano</option>
                        </select>
                        <InputError message={errors.currency} className="mt-2" />
                    </div>
                </div>

                <div className="flex items-center justify-end mt-6">
                    <PrimaryButton className="w-full justify-center py-3" disabled={processing}>
                        {processing ? 'Creando...' : 'Crear Empresa y Continuar'}
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}

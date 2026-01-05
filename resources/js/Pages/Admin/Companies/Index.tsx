import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';

type Company = {
    id: number;
    name: string;
    slug: string;
    tax_id?: string;
    address?: string;
    phone?: string;
    email?: string;
    timezone?: string;
    currency?: string;
    is_active: boolean;
};

function CompanyRow({ company }: { company: Company }) {
    const { data, setData, patch, processing, errors } = useForm({
        name: company.name,
        slug: company.slug,
        tax_id: company.tax_id || '',
        address: company.address || '',
        phone: company.phone || '',
        email: company.email || '',
        timezone: company.timezone || 'America/Santiago',
        currency: company.currency || 'CLP',
        is_active: company.is_active,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('admin.companies.update', company.id), { preserveScroll: true });
    };

    return (
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-5 gap-3 px-4 py-3 border-b border-gray-100">
            <div>
                <input value={data.name} onChange={e => setData('name', e.target.value)} className="w-full rounded-lg border-gray-300 shadow-sm text-sm" />
                <input value={data.slug} onChange={e => setData('slug', e.target.value)} className="w-full mt-1 rounded-lg border-gray-300 shadow-sm text-xs text-gray-600" placeholder="slug" />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                {errors.slug && <p className="text-xs text-red-500">{errors.slug}</p>}
            </div>
            <div>
                <input value={data.tax_id} onChange={e => setData('tax_id', e.target.value)} className="w-full rounded-lg border-gray-300 shadow-sm text-sm" placeholder="RUT / Tax ID" />
                <input value={data.email} onChange={e => setData('email', e.target.value)} className="w-full mt-1 rounded-lg border-gray-300 shadow-sm text-sm" placeholder="Email" />
                <input value={data.phone} onChange={e => setData('phone', e.target.value)} className="w-full mt-1 rounded-lg border-gray-300 shadow-sm text-sm" placeholder="Teléfono" />
            </div>
            <div>
                <input value={data.address} onChange={e => setData('address', e.target.value)} className="w-full rounded-lg border-gray-300 shadow-sm text-sm" placeholder="Dirección" />
                <div className="grid grid-cols-2 gap-2 mt-1">
                    <input value={data.timezone} onChange={e => setData('timezone', e.target.value)} className="w-full rounded-lg border-gray-300 shadow-sm text-xs" placeholder="Timezone" />
                    <input value={data.currency} onChange={e => setData('currency', e.target.value)} className="w-full rounded-lg border-gray-300 shadow-sm text-xs" placeholder="Moneda" />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <input type="checkbox" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} className="rounded border-gray-300" />
                <span className="text-sm text-gray-700">{data.is_active ? 'Activa' : 'Inactiva'}</span>
            </div>
            <div className="flex justify-end items-center">
                <button type="submit" disabled={processing} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
                    Guardar
                </button>
            </div>
        </form>
    );
}

export default function CompaniesIndex({ companies }: { companies: Company[] }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        name: '',
        slug: '',
        tax_id: '',
        address: '',
        phone: '',
        email: '',
        timezone: 'America/Santiago',
        currency: 'CLP',
        is_active: true,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.companies.store'), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800">Compañías</h2>}>
            <Head title="Compañías" />

            <div className="py-8">
                <div className="mx-auto max-w-6xl space-y-6">
                    <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase">Crear nueva compañía</h3>
                        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm text-gray-700">Nombre *</label>
                                <input value={data.name} onChange={e => setData('name', e.target.value)} className="mt-1 w-full rounded-lg border-gray-300 shadow-sm" required />
                                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="text-sm text-gray-700">RUT / Tax ID</label>
                                <input value={data.tax_id} onChange={e => setData('tax_id', e.target.value)} className="mt-1 w-full rounded-lg border-gray-300 shadow-sm" />
                                {errors.tax_id && <p className="text-xs text-red-500">{errors.tax_id}</p>}
                            </div>
                            <div>
                                <label className="text-sm text-gray-700">Email</label>
                                <input type="email" value={data.email} onChange={e => setData('email', e.target.value)} className="mt-1 w-full rounded-lg border-gray-300 shadow-sm" />
                                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                            </div>
                            <div>
                                <label className="text-sm text-gray-700">Teléfono</label>
                                <input value={data.phone} onChange={e => setData('phone', e.target.value)} className="mt-1 w-full rounded-lg border-gray-300 shadow-sm" />
                            </div>
                            <div>
                                <label className="text-sm text-gray-700">Dirección</label>
                                <input value={data.address} onChange={e => setData('address', e.target.value)} className="mt-1 w-full rounded-lg border-gray-300 shadow-sm" />
                            </div>
                            <div>
                                <label className="text-sm text-gray-700">Zona horaria</label>
                                <input value={data.timezone} onChange={e => setData('timezone', e.target.value)} className="mt-1 w-full rounded-lg border-gray-300 shadow-sm" />
                            </div>
                            <div>
                                <label className="text-sm text-gray-700">Moneda</label>
                                <input value={data.currency} onChange={e => setData('currency', e.target.value)} className="mt-1 w-full rounded-lg border-gray-300 shadow-sm" />
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="is_active" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} className="rounded border-gray-300" />
                                <label htmlFor="is_active" className="text-sm text-gray-700">Activa</label>
                            </div>
                            <div className="md:col-span-3 flex justify-end">
                                <button type="submit" disabled={processing} className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50">
                                    Guardar compañía
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-700 uppercase">Editar compañías</h3>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {companies.map((c) => (
                                <CompanyRow key={c.id} company={c} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

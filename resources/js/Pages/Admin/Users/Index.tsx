import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';

type Role = { id: number; name: string; display_name?: string };
type Company = { id: number; name: string };
type User = {
    id: number;
    name: string;
    email: string;
    phone?: string;
    company_id: number | null;
    role_id: number | null;
    is_active: boolean;
    company?: Company;
    role?: Role;
};

function UserRow({ user, roles, companies }: { user: User; roles: Role[]; companies: Company[] }) {
    const { data, setData, patch, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        company_id: user.company_id?.toString() || '',
        role_id: user.role_id?.toString() || '',
        is_active: user.is_active,
        password: '',
        password_confirmation: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('admin.users.update', user.id), { preserveScroll: true });
    };

    return (
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center border-b border-gray-100 py-3">
            <div>
                <input value={data.name} onChange={e => setData('name', e.target.value)} className="w-full rounded-lg border-gray-300 shadow-sm text-sm" />
                <input value={data.email} onChange={e => setData('email', e.target.value)} className="w-full mt-1 rounded-lg border-gray-300 shadow-sm text-sm" />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>
            <div>
                <input value={data.phone} onChange={e => setData('phone', e.target.value)} className="w-full rounded-lg border-gray-300 shadow-sm text-sm" placeholder="Teléfono" />
                <input type="password" value={data.password} onChange={e => setData('password', e.target.value)} className="w-full mt-1 rounded-lg border-gray-300 shadow-sm text-sm" placeholder="Nueva contraseña" />
                <input type="password" value={data.password_confirmation} onChange={e => setData('password_confirmation', e.target.value)} className="w-full mt-1 rounded-lg border-gray-300 shadow-sm text-sm" placeholder="Confirmar" />
                {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>
            <div>
                <select value={data.company_id} onChange={e => setData('company_id', e.target.value)} className="w-full rounded-lg border-gray-300 shadow-sm text-sm">
                    <option value="">Seleccione compañía</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {errors.company_id && <p className="text-xs text-red-500">{errors.company_id}</p>}
            </div>
            <div>
                <select value={data.role_id} onChange={e => setData('role_id', e.target.value)} className="w-full rounded-lg border-gray-300 shadow-sm text-sm">
                    <option value="">Seleccione rol</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.display_name || r.name}</option>)}
                </select>
                {errors.role_id && <p className="text-xs text-red-500">{errors.role_id}</p>}
            </div>
            <div className="flex items-center gap-2">
                <input type="checkbox" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} className="rounded border-gray-300" />
                <span className="text-sm text-gray-700">{data.is_active ? 'Activo' : 'Inactivo'}</span>
            </div>
            <div className="flex justify-end">
                <button type="submit" disabled={processing} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
                    Guardar
                </button>
            </div>
        </form>
    );
}

export default function UsersIndex({ users, roles, companies }: { users: User[]; roles: Role[]; companies: Company[] }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        company_id: '',
        role_id: '',
        password: '',
        password_confirmation: '',
        is_active: true,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.users.store'), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800">Usuarios</h2>}>
            <Head title="Usuarios" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-6">
                    <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase">Crear usuario</h3>
                        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm text-gray-700">Nombre *</label>
                                <input value={data.name} onChange={e => setData('name', e.target.value)} className="mt-1 w-full rounded-lg border-gray-300 shadow-sm" required />
                                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="text-sm text-gray-700">Email *</label>
                                <input type="email" value={data.email} onChange={e => setData('email', e.target.value)} className="mt-1 w-full rounded-lg border-gray-300 shadow-sm" required />
                                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                            </div>
                            <div>
                                <label className="text-sm text-gray-700">Teléfono</label>
                                <input value={data.phone} onChange={e => setData('phone', e.target.value)} className="mt-1 w-full rounded-lg border-gray-300 shadow-sm" />
                            </div>
                            <div>
                                <label className="text-sm text-gray-700">Contraseña *</label>
                                <input type="password" value={data.password} onChange={e => setData('password', e.target.value)} className="mt-1 w-full rounded-lg border-gray-300 shadow-sm" required />
                            </div>
                            <div>
                                <label className="text-sm text-gray-700">Confirmar *</label>
                                <input type="password" value={data.password_confirmation} onChange={e => setData('password_confirmation', e.target.value)} className="mt-1 w-full rounded-lg border-gray-300 shadow-sm" required />
                                {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                            </div>
                            <div>
                                <label className="text-sm text-gray-700">Compañía *</label>
                                <select value={data.company_id} onChange={e => setData('company_id', e.target.value)} className="mt-1 w-full rounded-lg border-gray-300 shadow-sm" required>
                                    <option value="">Seleccione</option>
                                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                {errors.company_id && <p className="text-xs text-red-500">{errors.company_id}</p>}
                            </div>
                            <div>
                                <label className="text-sm text-gray-700">Rol *</label>
                                <select value={data.role_id} onChange={e => setData('role_id', e.target.value)} className="mt-1 w-full rounded-lg border-gray-300 shadow-sm" required>
                                    <option value="">Seleccione</option>
                                    {roles.map(r => <option key={r.id} value={r.id}>{r.display_name || r.name}</option>)}
                                </select>
                                {errors.role_id && <p className="text-xs text-red-500">{errors.role_id}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} className="rounded border-gray-300" />
                                <label className="text-sm text-gray-700">Activo</label>
                            </div>
                            <div className="md:col-span-3 flex justify-end">
                                <button type="submit" disabled={processing} className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50">
                                    Crear usuario
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="bg-white shadow-sm rounded-xl border border-gray-100">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-700 uppercase">Usuarios existentes</h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {users.map(user => (
                                <UserRow key={user.id} user={user} roles={roles} companies={companies} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

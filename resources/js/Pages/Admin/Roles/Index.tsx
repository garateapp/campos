import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';

type Role = {
    id: number;
    name: string;
    display_name?: string;
    description?: string;
    permissions: string[];
};

function RoleRow({ role }: { role: Role }) {
    const { data, setData, patch, processing } = useForm({
        permissions: role.permissions?.join(', ') || '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('admin.roles.update', role.id), { preserveScroll: true });
    };

    return (
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start border-b border-gray-100 py-3">
            <div>
                <div className="text-sm font-semibold text-gray-900">{role.display_name || role.name}</div>
                <div className="text-xs text-gray-500">{role.description}</div>
            </div>
            <div className="md:col-span-2">
                <label className="text-xs uppercase text-gray-500">Permisos (coma separados)</label>
                <textarea
                    value={data.permissions}
                    onChange={e => setData('permissions', e.target.value)}
                    className="mt-1 w-full rounded-lg border-gray-300 shadow-sm text-sm"
                    rows={2}
                    placeholder="*, crops.*, tasks.view"
                />
            </div>
            <div className="flex justify-end">
                <button type="submit" disabled={processing} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
                    Guardar
                </button>
            </div>
        </form>
    );
}

export default function RolesIndex({ roles }: { roles: Role[] }) {
    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800">Roles y permisos</h2>}>
            <Head title="Roles" />

            <div className="py-8">
                <div className="mx-auto max-w-6xl">
                    <div className="bg-white shadow-sm rounded-xl border border-gray-100">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <p className="text-sm text-gray-600">Edita permisos como lista separada por comas. Usa * para acceso total o prefijos como crops.*</p>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {roles.map(role => (
                                <RoleRow key={role.id} role={role} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

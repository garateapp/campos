import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useMemo, useState } from 'react';

interface Task {
    id: number;
    title: string;
    description: string | null;
    type: string;
    priority: string;
    status: string;
    due_date: string;
    completed_date: string | null;
    field_name: string | null;
    cost_center_code?: string | null;
    creator_name: string;
    assigned_users: string[];
    is_overdue: boolean;
}

interface TasksIndexProps {
    tasks: Task[];
    filters: {
        status?: string;
        task_type_id?: string;
        priority?: string;
        from?: string;
        to?: string;
    };
    taskTypes: Array<{ id: number; name: string }>;
}

const priorityConfig: Record<string, { label: string; color: string; bg: string }> = {
    low: { label: 'Baja', color: 'text-gray-700', bg: 'bg-gray-100' },
    medium: { label: 'Media', color: 'text-blue-700', bg: 'bg-blue-100' },
    high: { label: 'Alta', color: 'text-orange-700', bg: 'bg-orange-100' },
    urgent: { label: 'Urgente', color: 'text-red-700', bg: 'bg-red-100' },
};

const statusColumns = [
    { key: 'pending', label: 'Pendiente', accent: 'border-yellow-400' },
    { key: 'in_progress', label: 'En Progreso', accent: 'border-blue-400' },
    { key: 'completed', label: 'Completada', accent: 'border-green-400' },
    { key: 'cancelled', label: 'Cancelada', accent: 'border-gray-300' },
];

export default function Index({ tasks, filters, taskTypes }: TasksIndexProps) {
    const [typeFilter, setTypeFilter] = useState(filters.task_type_id || 'all');

    const grouped = useMemo(() => {
        const base = new Map(statusColumns.map((col) => [col.key, [] as Task[]]));
        tasks.forEach((task) => {
            const bucket = base.get(task.status) || base.get('pending');
            bucket?.push(task);
        });
        return base;
    }, [tasks]);

    const handleTypeFilter = (typeId: string) => {
        setTypeFilter(typeId);
        const params: any = { ...filters, task_type_id: typeId === 'all' ? undefined : typeId };
        router.get(route('tasks.index'), params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleStatusChange = (taskId: number, status: string) => {
        router.patch(route('tasks.status', taskId), { status }, { preserveScroll: true });
    };

    const handleDelete = (id: number, title: string) => {
        if (confirm(`¿Estás seguro de eliminar la tarea "${title}"?`)) {
            router.delete(route('tasks.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            Tablero de Tareas
                        </h2>
                        <p className="text-sm text-gray-500">
                            Visualiza tus tareas asignadas y gestiona el avance por columnas.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={typeFilter}
                            onChange={(e) => handleTypeFilter(e.target.value)}
                            className="text-sm border-gray-200 rounded-lg focus:ring-green-500 focus:border-green-500"
                        >
                            <option value="all">Todos los tipos</option>
                            {taskTypes.map((type) => (
                                <option key={type.id} value={type.id}>
                                    {type.name}
                                </option>
                            ))}
                        </select>
                        <Link
                            href={route('tasks.create')}
                            className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-lg font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 transition ease-in-out duration-150"
                        >
                            + Nueva Tarea
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Tareas" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {tasks.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                            <div className="text-4xl mb-4">📋</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Sin tareas asignadas</h3>
                            <p className="text-gray-500 mb-4">
                                Cuando tengas tareas asignadas aparecerán aquí.
                            </p>
                            <Link
                                href={route('tasks.create')}
                                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                Crear Tarea
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                            {statusColumns.map((col) => (
                                <div key={col.key} className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
                                    <div className={`px-4 py-3 border-b-2 ${col.accent}`}>
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">
                                                {col.label}
                                            </h3>
                                            <span className="text-xs font-semibold text-gray-500">
                                                {grouped.get(col.key)?.length || 0}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-3 space-y-3">
                                        {(grouped.get(col.key) || []).map((task) => (
                                            <div
                                                key={task.id}
                                                className={`rounded-lg border border-gray-100 bg-gray-50 p-3 shadow-sm transition hover:bg-white ${task.is_overdue ? 'ring-1 ring-red-400' : ''}`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <Link
                                                        href={route('tasks.show', task.id)}
                                                        className={`text-sm font-semibold ${task.is_overdue ? 'text-red-600' : 'text-gray-900'} hover:text-green-700`}
                                                    >
                                                        {task.title}
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(task.id, task.title)}
                                                        className="text-gray-400 hover:text-red-600 text-xs"
                                                        title="Eliminar"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>

                                                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                                    <span className={`px-2 py-0.5 rounded-full font-medium ${priorityConfig[task.priority]?.bg} ${priorityConfig[task.priority]?.color}`}>
                                                        {priorityConfig[task.priority]?.label}
                                                    </span>
                                                    <span className="text-gray-400">•</span>
                                                    <span>{task.type}</span>
                                                </div>

                                                <div className="mt-2 text-xs text-gray-500 space-y-1">
                                                    {task.field_name && <div>📍 {task.field_name}</div>}
                                                    {task.cost_center_code && <div>🏷️ CC {task.cost_center_code}</div>}
                                                    <div>📅 {task.due_date}</div>
                                                    {task.assigned_users.length > 0 && (
                                                        <div>👤 {task.assigned_users.join(', ')}</div>
                                                    )}
                                                </div>

                                                {task.description && (
                                                    <p className="mt-2 text-xs text-gray-600 line-clamp-3">{task.description}</p>
                                                )}

                                                <div className="mt-3">
                                                    <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Mover a</label>
                                                    <select
                                                        value={task.status}
                                                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                                        className="w-full text-xs border-gray-200 rounded-md focus:ring-green-500 focus:border-green-500"
                                                    >
                                                        {statusColumns.map((status) => (
                                                            <option key={status.key} value={status.key}>
                                                                {status.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

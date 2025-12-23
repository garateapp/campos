import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';

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

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Pendiente', color: 'text-yellow-700', bg: 'bg-yellow-100' },
    in_progress: { label: 'En Progreso', color: 'text-blue-700', bg: 'bg-blue-100' },
    completed: { label: 'Completada', color: 'text-green-700', bg: 'bg-green-100' },
    cancelled: { label: 'Cancelada', color: 'text-gray-500', bg: 'bg-gray-100' },
};

export default function Index({ tasks, filters, taskTypes }: TasksIndexProps) {
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [typeFilter, setTypeFilter] = useState(filters.task_type_id || 'all');

    const handleStatusFilter = (status: string) => {
        setStatusFilter(status);
        const params: any = { ...filters, status: status === 'all' ? undefined : status };
        router.get(route('tasks.index'), params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleTypeFilter = (typeId: string) => {
        setTypeFilter(typeId);
        const params: any = { ...filters, task_type_id: typeId === 'all' ? undefined : typeId };
        router.get(route('tasks.index'), params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDelete = (id: number, title: string) => {
        if (confirm(`¿Estás seguro de eliminar la tarea "${title}"?`)) {
            router.delete(route('tasks.destroy', id));
        }
    };

    const pendingCount = tasks.filter(t => t.status === 'pending').length;
    const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
    const completedCount = tasks.filter(t => t.status === 'completed').length;
    const overdueCount = tasks.filter(t => t.is_overdue).length;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            Tareas
                        </h2>
                        <p className="text-sm text-gray-500">
                            {pendingCount} pendientes • {inProgressCount} en progreso
                            {overdueCount > 0 && <span className="text-red-600 font-medium"> • {overdueCount} vencidas</span>}
                        </p>
                    </div>
                    <Link
                        href={route('tasks.create')}
                        className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-lg font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 transition ease-in-out duration-150"
                    >
                        + Nueva Tarea
                    </Link>
                </div>
            }
        >
            <Head title="Tareas" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Filters */}
                    <div className="mb-6 flex flex-wrap gap-4 items-center">
                        <div className="flex flex-wrap gap-2">
                            {['all', 'pending', 'in_progress', 'completed'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => handleStatusFilter(status)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === status
                                        ? 'bg-green-600 text-white'
                                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    {status === 'all' ? 'Todas' : statusConfig[status]?.label || status}
                                    {status === 'pending' && pendingCount > 0 && (
                                        <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded text-xs">{pendingCount}</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Filtrar por tipo:</span>
                            <select
                                value={typeFilter}
                                onChange={(e) => handleTypeFilter(e.target.value)}
                                className="text-sm border-gray-200 rounded-lg focus:ring-green-500 focus:border-green-500"
                            >
                                <option value="all">Todos los tipos</option>
                                {taskTypes.map(type => (
                                    <option key={type.id} value={type.id}>{type.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Tasks List */}
                    {tasks.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                            <div className="text-4xl mb-4">📋</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Sin tareas</h3>
                            <p className="text-gray-500 mb-4">
                                {statusFilter !== 'all' ? 'No hay tareas con este estado' : 'Comienza creando tu primera tarea'}
                            </p>
                            <Link
                                href={route('tasks.create')}
                                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                Crear Tarea
                            </Link>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="divide-y divide-gray-100">
                                {tasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className={`p-4 hover:bg-gray-50 transition-colors ${task.is_overdue ? 'border-l-4 border-red-500' : ''}`}
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Status indicator */}
                                            <div className="flex-shrink-0 mt-1">
                                                <span className={`inline-block w-3 h-3 rounded-full ${task.status === 'completed' ? 'bg-green-500' :
                                                    task.status === 'in_progress' ? 'bg-blue-500' :
                                                        task.is_overdue ? 'bg-red-500' :
                                                            'bg-yellow-500'
                                                    }`} />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Link
                                                        href={route('tasks.show', task.id)}
                                                        className={`font-medium hover:text-green-600 ${task.is_overdue ? 'text-red-600' : 'text-gray-900'}`}
                                                    >
                                                        {task.title}
                                                    </Link>
                                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${priorityConfig[task.priority]?.bg} ${priorityConfig[task.priority]?.color}`}>
                                                        {priorityConfig[task.priority]?.label}
                                                    </span>
                                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusConfig[task.status]?.bg} ${statusConfig[task.status]?.color}`}>
                                                        {statusConfig[task.status]?.label}
                                                    </span>
                                                </div>

                                                <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                                                    <span>{task.type}</span>
                                                    {task.field_name && <span>📍 {task.field_name}</span>}
                                                    <span>📅 {task.due_date}</span>
                                                    {task.assigned_users.length > 0 && (
                                                        <span>👤 {task.assigned_users.join(', ')}</span>
                                                    )}
                                                </div>

                                                {task.description && (
                                                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">{task.description}</p>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex-shrink-0 flex items-center gap-2">
                                                <Link
                                                    href={route('tasks.edit', task.id)}
                                                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                                                    title="Editar"
                                                >
                                                    ✏️
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(task.id, task.title)}
                                                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                                                    title="Eliminar"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

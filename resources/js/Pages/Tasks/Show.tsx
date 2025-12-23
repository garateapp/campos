import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FormEventHandler } from 'react';

interface TaskLog {
    id: number;
    action: string;
    note: string | null;
    user_name: string;
    logged_at: string;
    data: any;
}

interface User {
    id: number;
    name: string;
}

interface Assignment {
    id: number;
    user: User;
    status: string;
    started_at: string | null;
    completed_at: string | null;
}

interface TaskShowProps {
    task: {
        id: number;
        title: string;
        description: string | null;
        type: string;
        priority: string;
        status: string;
        due_date: string;
        completed_date: string | null;
        field: { id: number; name: string } | null;
        planting: { id: number; crop_name: string; season: string } | null;
        creator: User;
        assignments: Assignment[];
        logs: TaskLog[];
        metadata: any;
        is_overdue: boolean;
    };
}



const priorityConfig: Record<string, { label: string; color: string; bg: string }> = {
    low: { label: 'Baja', color: 'text-gray-600', bg: 'bg-gray-100' },
    medium: { label: 'Media', color: 'text-blue-600', bg: 'bg-blue-100' },
    high: { label: 'Alta', color: 'text-orange-600', bg: 'bg-orange-100' },
    urgent: { label: 'Urgente', color: 'text-white', bg: 'bg-red-600' },
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Pendiente', color: 'text-gray-700', bg: 'bg-gray-100' },
    in_progress: { label: 'En Proceso', color: 'text-blue-700', bg: 'bg-blue-100' },
    completed: { label: 'Completada', color: 'text-green-700', bg: 'bg-green-100' },
    cancelled: { label: 'Cancelada', color: 'text-red-700', bg: 'bg-red-100' },
};

export default function Show({ task }: TaskShowProps) {
    const { data, setData, post, processing } = useForm({
        status: task.status,
        note: '',
    });

    const handleStatusUpdate = (newStatus: string) => {
        router.post(route('tasks.status', task.id), { status: newStatus });
    };

    const submitLog: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('tasks.logs.store', task.id), {
            onSuccess: () => setData('note', ''),
        });
    };

    const handleDelete = () => {
        if (confirm('¿Eliminar esta tarea?')) {
            router.delete(route('tasks.destroy', task.id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href={route('tasks.index')} className="text-gray-500 hover:text-gray-700">
                            ← Volver
                        </Link>
                        <div>
                            <h2 className="text-xl font-semibold leading-tight text-gray-800">
                                {task.title}
                            </h2>
                            <p className="text-sm text-gray-500">
                                {task.type} • Prioridad {priorityConfig[task.priority]?.label}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href={route('tasks.edit', task.id)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            ✏️ Editar
                        </Link>
                        <button
                            onClick={handleDelete}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            🗑️ Borrar
                        </button>
                    </div>
                </div>
            }
        >
            <Head title={`Tarea: ${task.title}`} />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Detailed Info */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Descripción</h3>
                                <div className="text-gray-700 whitespace-pre-wrap mb-8">
                                    {task.description || 'Sin descripción detallada.'}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-50">
                                    <DetailBlock label="Vencimiento" value={task.due_date} subValue={task.is_overdue ? 'Vencida ⚠️' : undefined} subColor="text-red-600" />
                                    <DetailBlock label="Ubicación" value={task.field?.name || 'General'} subValue={task.planting ? `${task.planting.crop_name} (${task.planting.season})` : undefined} />
                                    <DetailBlock label="Asignado a" value={task.assignments.length > 0 ? task.assignments.map(a => a.user.name).join(', ') : 'Nadie asignado'} />
                                    <DetailBlock label="Creado por" value={task.creator.name} />
                                </div>
                            </div>

                            {/* Activity Log */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center">
                                    <h3 className="font-bold text-gray-900">Historial de Actividad</h3>
                                </div>

                                <div className="p-6">
                                    <form onSubmit={submitLog} className="mb-8">
                                        <textarea
                                            value={data.note}
                                            onChange={e => setData('note', e.target.value)}
                                            className="w-full border-gray-200 rounded-xl text-sm focus:ring-green-500 focus:border-green-500 min-h-[80px]"
                                            placeholder="Escribe un comentario o actualización..."
                                            required
                                        ></textarea>
                                        <div className="mt-2 flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={processing}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors"
                                            >
                                                {processing ? 'Publicando...' : 'Comentar'}
                                            </button>
                                        </div>
                                    </form>

                                    <div className="space-y-6 relative before:absolute before:inset-0 before:left-4 before:w-px before:bg-gray-100">
                                        {task.logs.map((log, idx) => (
                                            <div key={log.id} className="relative pl-10">
                                                <div className={`absolute left-2 top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ring-1 ring-gray-100 ${log.action === 'completed' ? 'bg-green-500' :
                                                    log.action === 'created' ? 'bg-blue-500' : 'bg-gray-300'
                                                    }`}></div>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-sm">
                                                            <span className="font-bold text-gray-900">{log.user_name}</span>
                                                            <span className="text-gray-500 ml-2">
                                                                {log.action === 'created' ? 'creó la tarea' :
                                                                    log.action === 'completed' ? 'completó la tarea' :
                                                                        log.action === 'in_progress' ? 'inició la tarea' :
                                                                            log.action === 'comment' ? 'comentó' : log.action}
                                                            </span>
                                                        </p>
                                                        {log.note && (
                                                            <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 italic">
                                                                "{log.note}"
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-gray-400 font-medium uppercase">{log.logged_at}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Status Card */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Estado de la Tarea</h3>
                                <div className={`inline-flex items-center px-4 py-2 rounded-full font-bold mb-6 ${statusConfig[task.status]?.bg} ${statusConfig[task.status]?.color}`}>
                                    {statusConfig[task.status]?.label}
                                </div>

                                <div className="space-y-2">
                                    {task.status !== 'completed' && (
                                        <button
                                            onClick={() => handleStatusUpdate('completed')}
                                            className="w-full py-2 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700"
                                        >
                                            ✅ Marcar como completada
                                        </button>
                                    )}
                                    {task.status === 'pending' && (
                                        <button
                                            onClick={() => handleStatusUpdate('in_progress')}
                                            className="w-full py-2 bg-blue-50 text-blue-600 rounded-lg font-bold text-sm hover:bg-blue-100"
                                        >
                                            ▶️ Iniciar trabajo
                                        </button>
                                    )}
                                    {task.status === 'completed' && (
                                        <button
                                            onClick={() => handleStatusUpdate('pending')}
                                            className="w-full py-2 bg-gray-100 text-gray-600 rounded-lg font-bold text-sm hover:bg-gray-200"
                                        >
                                            ↩️ Re-abrir tarea
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Priority & Metadata */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Importancia</h3>
                                <div className="flex items-center gap-4">
                                    <div className={`px-3 py-1 rounded text-xs font-black uppercase ${priorityConfig[task.priority]?.bg} ${priorityConfig[task.priority]?.color}`}>
                                        {priorityConfig[task.priority]?.label}
                                    </div>
                                    {task.is_overdue && (
                                        <span className="text-xs font-bold text-red-600 animate-pulse">VENCIDA</span>
                                    )}
                                </div>

                                {task.completed_date && (
                                    <div className="mt-4 pt-4 border-t border-gray-50">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Completada el</p>
                                        <p className="text-sm font-bold text-green-600">{task.completed_date}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function DetailBlock({ label, value, subValue, subColor }: { label: string; value: string; subValue?: string; subColor?: string }) {
    return (
        <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{label}</p>
            <p className="text-sm font-bold text-gray-900 mt-1">{value}</p>
            {subValue && <p className={`text-[10px] mt-0.5 font-medium ${subColor || 'text-gray-500'}`}>{subValue}</p>}
        </div>
    );
}

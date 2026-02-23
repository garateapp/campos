import { FormEventHandler } from 'react';
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

interface User {
    id: number;
    name: string;
}

interface TaskType {
    id: number;
    name: string;
}

interface Planting {
    id: number;
    label: string;
    field_id: number;
    cost_center_id?: number | null;
}

interface CostCenter {
    id: number;
    code: string;
    name: string;
}

interface TaskEditProps {
    task: {
        id: number;
        title: string;
        description: string;
        field_id: number | null;
        cost_center_id?: number | null;
        planting_id: number | null;
        task_type_id: number | null;
        priority: string;
        due_date: string;
        assigned_users: number[];
    };
    fields: Field[];
    plantings: Planting[];
    costCenters: CostCenter[];
    users: User[];
    taskTypes: Array<{ id: number; name: string }>;
}



const priorities = [
    { value: 'low', label: 'Baja' },
    { value: 'medium', label: 'Media' },
    { value: 'high', label: 'Alta' },
    { value: 'urgent', label: 'Urgente' },
];

export default function Edit({ task, fields, plantings, costCenters, users, taskTypes }: TaskEditProps) {
    const { data, setData, patch, processing, errors } = useForm({
        title: task.title,
        description: task.description || '',
        field_id: task.field_id?.toString() || '',
        cost_center_id: task.cost_center_id?.toString() || '',
        planting_id: task.planting_id?.toString() || '',
        task_type_id: task.task_type_id?.toString() || '',
        priority: task.priority,
        due_date: task.due_date,
        assigned_users: task.assigned_users,
    });

    const handlePlantingChange = (plantingId: string) => {
        setData('planting_id', plantingId);
        const selected = plantings.find(p => p.id.toString() === plantingId);
        if (selected?.field_id) {
            setData('field_id', selected.field_id.toString());
        }
        if (selected?.cost_center_id) {
            setData('cost_center_id', selected.cost_center_id.toString());
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('tasks.update', task.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-4">
                    <Link href={route('tasks.show', task.id)} className="text-gray-500 hover:text-gray-700">
                        ← Volver
                    </Link>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Editar Tarea: {task.title}
                    </h2>
                </div>
            }
        >
            <Head title={`Editar Tarea: ${task.title}`} />

            <div className="py-6">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <form onSubmit={submit} className="space-y-6">
                            <div>
                                <InputLabel htmlFor="title" value="Título de la Tarea *" />
                                <TextInput
                                    id="title"
                                    type="text"
                                    name="title"
                                    value={data.title}
                                    className="mt-1 block w-full"
                                    onChange={(e) => setData('title', e.target.value)}
                                    required
                                />
                                <InputError message={errors.title} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="description" value="Instrucciones / Descripción" />
                                <textarea
                                    id="description"
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                                    rows={4}
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                />
                                <InputError message={errors.description} className="mt-2" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputLabel htmlFor="task_type_id" value="Categoría *" />
                                    <select
                                        id="task_type_id"
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                                        value={data.task_type_id}
                                        onChange={(e) => setData('task_type_id', e.target.value)}
                                        required
                                    >
                                        <option value="">Seleccionar...</option>
                                        {taskTypes.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.task_type_id} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="priority" value="Prioridad *" />
                                    <select
                                        id="priority"
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                                        value={data.priority}
                                        onChange={(e) => setData('priority', e.target.value)}
                                        required
                                    >
                                        {priorities.map(p => (
                                            <option key={p.value} value={p.value}>{p.label}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.priority} className="mt-2" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputLabel htmlFor="due_date" value="Fecha de Vencimiento *" />
                                    <TextInput
                                        id="due_date"
                                        type="date"
                                        name="due_date"
                                        value={data.due_date}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('due_date', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.due_date} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="field_id" value="Asignar a Campo" />
                                    <select
                                        id="field_id"
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                                        value={data.field_id}
                                        onChange={(e) => setData('field_id', e.target.value)}
                                    >
                                        <option value="">General (Sin campo)</option>
                                        {fields.map(f => (
                                            <option key={f.id} value={f.id}>{f.name}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.field_id} className="mt-2" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputLabel htmlFor="planting_id" value="Labor (opcional)" />
                                    <select
                                        id="planting_id"
                                        name="planting_id"
                                        value={data.planting_id}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                                        onChange={(e) => handlePlantingChange(e.target.value)}
                                    >
                                        <option value="">Sin labor específica</option>
                                        {plantings.map(planting => (
                                            <option key={planting.id} value={planting.id}>{planting.label}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.planting_id} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="cost_center_id" value="Centro de Costo (opcional)" />
                                    <select
                                        id="cost_center_id"
                                        name="cost_center_id"
                                        value={data.cost_center_id}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                                        onChange={(e) => setData('cost_center_id', e.target.value)}
                                    >
                                        <option value="">Seleccionar Centro de Costo...</option>
                                        {costCenters.map((cc) => (
                                            <option key={cc.id} value={cc.id}>
                                                {cc.code} - {cc.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={(errors as any).cost_center_id} className="mt-2" />
                                </div>
                            </div>

                            <div>
                                <InputLabel value="Operadores Asignados" />
                                <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {users.map(user => (
                                        <label key={user.id} className="inline-flex items-center p-2 bg-gray-50 rounded-lg border border-gray-100 hover:border-green-200 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-green-600 shadow-sm focus:ring-green-500"
                                                checked={data.assigned_users.includes(user.id)}
                                                onChange={(e) => {
                                                    const updated = e.target.checked
                                                        ? [...data.assigned_users, user.id]
                                                        : data.assigned_users.filter(id => id !== user.id);
                                                    setData('assigned_users', updated);
                                                }}
                                            />
                                            <span className="ml-2 text-sm text-gray-700">{user.name}</span>
                                        </label>
                                    ))}
                                </div>
                                <InputError message={errors.assigned_users} className="mt-2" />
                            </div>

                            <div className="flex items-center justify-end gap-4 pt-4 border-t">
                                <Link href={route('tasks.show', task.id)} className="text-sm text-gray-600 hover:text-gray-900">
                                    Cancelar
                                </Link>
                                <PrimaryButton disabled={processing}>
                                    {processing ? 'Guardando...' : 'Actualizar Tarea'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

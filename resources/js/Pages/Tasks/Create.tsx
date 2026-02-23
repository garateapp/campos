import { FormEventHandler, useState } from 'react';
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

interface Planting {
    id: number;
    label: string;
    field_id: number;
    cost_center_id?: number | null;
}

interface User {
    id: number;
    name: string;
}

interface TaskType {
    id: number;
    name: string;
}

interface CostCenter {
    id: number;
    code: string;
    name: string;
}

interface TaskCreateProps {
    fields: Field[];
    plantings: Planting[];
    costCenters: CostCenter[];
    users: User[];
    taskTypes: TaskType[];
}



const priorityOptions = [
    { value: 'low', label: 'Baja' },
    { value: 'medium', label: 'Media' },
    { value: 'high', label: 'Alta' },
    { value: 'urgent', label: 'Urgente' },
];

export default function Create({ fields, plantings, costCenters, users, taskTypes }: TaskCreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        description: '',
        field_id: '',
        cost_center_id: '',
        planting_id: '',
        task_type_id: '',
        priority: 'medium',
        due_date: new Date().toISOString().split('T')[0],
        assigned_users: [] as number[],
    });

    const [filteredPlantings, setFilteredPlantings] = useState(plantings);

    const handleFieldChange = (fieldId: string) => {
        setData('field_id', fieldId);
        setData('planting_id', '');
        if (fieldId) {
            setFilteredPlantings(plantings.filter(p => p.field_id === parseInt(fieldId)));
        } else {
            setFilteredPlantings(plantings);
        }
    };

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

    const toggleUser = (userId: number) => {
        if (data.assigned_users.includes(userId)) {
            setData('assigned_users', data.assigned_users.filter(id => id !== userId));
        } else {
            setData('assigned_users', [...data.assigned_users, userId]);
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('tasks.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-4">
                    <Link href={route('tasks.index')} className="text-gray-500 hover:text-gray-700">
                        ← Volver
                    </Link>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Nueva Tarea
                    </h2>
                </div>
            }
        >
            <Head title="Nueva Tarea" />

            <div className="py-6">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
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
                                    isFocused={true}
                                    onChange={(e) => setData('title', e.target.value)}
                                        placeholder="Ej: Aplicar fertilizante en Campo Norte"
                                        required
                                    />
                                    <InputError message={errors.title} className="mt-2" />
                                </div>

                            <div>
                                <InputLabel htmlFor="description" value="Descripción" />
                                <textarea
                                    id="description"
                                    name="description"
                                    value={data.description}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                                    rows={3}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Detalles adicionales de la tarea..."
                                />
                                <InputError message={errors.description} className="mt-2" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputLabel htmlFor="task_type_id" value="Tipo de Tarea *" />
                                    <select
                                        id="task_type_id"
                                        name="task_type_id"
                                        value={data.task_type_id}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                                        onChange={(e) => setData('task_type_id', e.target.value)}
                                        required
                                    >
                                        <option value="">Seleccionar...</option>
                                        {taskTypes.map(type => (
                                            <option key={type.id} value={type.id}>{type.name}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.task_type_id} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="priority" value="Prioridad *" />
                                    <select
                                        id="priority"
                                        name="priority"
                                        value={data.priority}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                                        onChange={(e) => setData('priority', e.target.value)}
                                    >
                                        {priorityOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.priority} className="mt-2" />
                                </div>
                            </div>

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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputLabel htmlFor="field_id" value="Campo (opcional)" />
                                    <select
                                        id="field_id"
                                        name="field_id"
                                        value={data.field_id}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                                        onChange={(e) => handleFieldChange(e.target.value)}
                                    >
                                        <option value="">Sin campo específico</option>
                                        {fields.map(field => (
                                            <option key={field.id} value={field.id}>{field.name}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.field_id} className="mt-2" />
                                </div>

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
                                        {filteredPlantings.map(planting => (
                                            <option key={planting.id} value={planting.id}>{planting.label}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.planting_id} className="mt-2" />
                                </div>
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

                            {/* Assigned Users */}
                            <div>
                                <InputLabel value="Asignar a (opcional)" />
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {users.length === 0 ? (
                                        <p className="text-sm text-gray-500">No hay otros usuarios en la empresa</p>
                                    ) : (
                                        users.map(user => (
                                            <button
                                                key={user.id}
                                                type="button"
                                                onClick={() => toggleUser(user.id)}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${data.assigned_users.includes(user.id)
                                                    ? 'bg-green-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {user.name}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-4 pt-4 border-t">
                                <Link href={route('tasks.index')} className="text-gray-600 hover:text-gray-900">
                                    Cancelar
                                </Link>
                                <PrimaryButton disabled={processing}>
                                    {processing ? 'Creando...' : 'Crear Tarea'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

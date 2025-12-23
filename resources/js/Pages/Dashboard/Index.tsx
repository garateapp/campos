import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

interface DashboardProps {
    company: {
        name: string;
        currency: string;
    };
    stats: {
        fieldsCount: number;
        totalHectares: number;
        activePlantings: number;
        pendingTasks: number;
        overdueTasks: number;
        tasksCompletedThisMonth: number;
    };
    financial: {
        costsThisMonth: number;
        revenueThisMonth: number;
        harvestKgThisMonth: number;
        netThisMonth: number;
    };
    recentTasks: Array<{
        id: number;
        title: string;
        type: string;
        priority: string;
        status: string;
        due_date: string;
        field_name: string | null;
        is_overdue: boolean;
    }>;
    lowStockAlerts: Array<{
        id: number;
        name: string;
        current_stock: number;
        min_stock: number;
        unit: string;
    }>;
    currentSeason: string;
}

const formatCurrency = (amount: number, currency: string = 'CLP') => {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const typeLabels: Record<string, string> = {
    irrigation: 'Riego',
    fertilization: 'Fertilización',
    pest_control: 'Control de Plagas',
    harvest: 'Cosecha',
    maintenance: 'Mantenimiento',
    scouting: 'Exploración',
    other: 'Otro',
};

const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
};

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-500',
};

export default function Index({ company, stats, financial, recentTasks, lowStockAlerts, currentSeason }: DashboardProps) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            Panel de Control
                        </h2>
                        <p className="text-sm text-gray-500">Temporada {currentSeason}</p>
                    </div>
                    <div className="text-right">
                        <span className="text-sm text-gray-500">{company.name}</span>
                    </div>
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <StatCard
                            title="Parcelas"
                            value={stats.fieldsCount.toString()}
                            subtitle={`${stats.totalHectares} hectáreas totales`}
                            icon="🌾"
                            color="green"
                        />
                        <StatCard
                            title="Siembras Activas"
                            value={stats.activePlantings.toString()}
                            subtitle="En proceso"
                            icon="🌱"
                            color="emerald"
                        />
                        <StatCard
                            title="Tareas Pendientes"
                            value={stats.pendingTasks.toString()}
                            subtitle={stats.overdueTasks > 0 ? `${stats.overdueTasks} vencidas` : 'Al día'}
                            icon="📋"
                            color={stats.overdueTasks > 0 ? 'red' : 'blue'}
                        />
                        <StatCard
                            title="Cosechado Este Mes"
                            value={`${financial.harvestKgThisMonth.toLocaleString()} kg`}
                            subtitle={formatCurrency(financial.revenueThisMonth, company.currency)}
                            icon="🍎"
                            color="amber"
                        />
                    </div>

                    {/* Financial Summary */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Costos del Mes</h3>
                            <p className="text-2xl font-bold text-red-600">
                                {formatCurrency(financial.costsThisMonth, company.currency)}
                            </p>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Ingresos del Mes</h3>
                            <p className="text-2xl font-bold text-green-600">
                                {formatCurrency(financial.revenueThisMonth, company.currency)}
                            </p>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Balance Neto</h3>
                            <p className={`text-2xl font-bold ${financial.netThisMonth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(financial.netThisMonth, company.currency)}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Recent Tasks */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-semibold text-gray-900">Próximas Tareas</h3>
                                <Link
                                    href={route('tasks.index')}
                                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                                >
                                    Ver todas →
                                </Link>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {recentTasks.length === 0 ? (
                                    <div className="px-6 py-8 text-center text-gray-500">
                                        <p>No hay tareas pendientes</p>
                                        <Link
                                            href={route('tasks.create')}
                                            className="mt-2 inline-block text-green-600 hover:text-green-700 font-medium"
                                        >
                                            Crear primera tarea →
                                        </Link>
                                    </div>
                                ) : (
                                    recentTasks.map((task) => (
                                        <Link
                                            key={task.id}
                                            href={route('tasks.show', task.id)}
                                            className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <p className={`font-medium truncate ${task.is_overdue ? 'text-red-600' : 'text-gray-900'}`}>
                                                        {task.title}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {typeLabels[task.type] || task.type}
                                                        {task.field_name && ` • ${task.field_name}`}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[task.priority]}`}>
                                                        {task.priority}
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        {task.due_date}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Low Stock Alerts */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-semibold text-gray-900">Alertas de Stock</h3>
                                <Link
                                    href={route('inputs.index')}
                                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                                >
                                    Ver inventario →
                                </Link>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {lowStockAlerts.length === 0 ? (
                                    <div className="px-6 py-8 text-center text-gray-500">
                                        <p className="text-green-600">✓ Todos los insumos con stock suficiente</p>
                                    </div>
                                ) : (
                                    lowStockAlerts.map((input) => (
                                        <Link
                                            key={input.id}
                                            href={route('inputs.show', input.id)}
                                            className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-red-600">{input.name}</p>
                                                    <p className="text-sm text-gray-500">
                                                        Stock: {input.current_stock} {input.unit} (mín: {input.min_stock})
                                                    </p>
                                                </div>
                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                                                    Bajo Stock
                                                </span>
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            <QuickActionButton href={route('fields.create')} icon="🗺️" label="Nueva Parcela" />
                            <QuickActionButton href={route('plantings.create')} icon="🌱" label="Nueva Siembra" />
                            <QuickActionButton href={route('tasks.create')} icon="📋" label="Nueva Tarea" />
                            <QuickActionButton href={route('inputs.create')} icon="📦" label="Nuevo Insumo" />
                            <QuickActionButton href={route('costs.create')} icon="💰" label="Registrar Costo" />
                            <QuickActionButton href={route('crops.index')} icon="🌿" label="Ver Cultivos" />
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function StatCard({ title, value, subtitle, icon, color }: {
    title: string;
    value: string;
    subtitle: string;
    icon: string;
    color: string;
}) {
    const colorClasses: Record<string, string> = {
        green: 'bg-green-50 border-green-100',
        emerald: 'bg-emerald-50 border-emerald-100',
        blue: 'bg-blue-50 border-blue-100',
        amber: 'bg-amber-50 border-amber-100',
        red: 'bg-red-50 border-red-100',
    };

    return (
        <div className={`rounded-xl p-5 border ${colorClasses[color] || 'bg-gray-50 border-gray-100'}`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                    <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
                </div>
                <span className="text-2xl">{icon}</span>
            </div>
        </div>
    );
}

function QuickActionButton({ href, icon, label }: { href: string; icon: string; label: string }) {
    return (
        <Link
            href={href}
            className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all group"
        >
            <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">{icon}</span>
            <span className="text-sm font-medium text-gray-700 text-center">{label}</span>
        </Link>
    );
}

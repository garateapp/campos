import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

interface AnalyticsProps {
    trends: {
        labels: string[];
        current: number[];
        previous: number[];
    };
    efficiency: {
        field: string;
        yield: number;
    }[];
    costs: {
        labels: string[];
        data: number[];
    };
    filters: {
        year: number;
    };
}

export default function Index({ trends, efficiency, costs, filters }: AnalyticsProps) {
    const [year, setYear] = useState(filters.year);
    const totalHarvest = trends.current.reduce((sum, value) => sum + Number(value), 0);
    const totalPreviousHarvest = trends.previous.reduce((sum, value) => sum + Number(value), 0);
    const sidebarLinks = [
        { label: 'Resumen', href: '#resumen' },
        { label: 'Costos', href: '#costos' },
        { label: 'Eficiencia', href: '#eficiencia' },
        { label: 'Inteligencia', href: '#insights' },
    ];

    const handleYearChange = (newYear: number) => {
        setYear(newYear);
        router.get(route('analytics.index'), { year: newYear }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Chart Data Configurations
    const harvestTrendData = {
        labels: trends.labels,
        datasets: [
            {
                label: `Cosecha ${year} (kg)`,
                data: trends.current,
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.5)',
                tension: 0.3,
                fill: true,
            },
            {
                label: `Cosecha ${year - 1} (kg)`,
                data: trends.previous,
                borderColor: 'rgb(209, 213, 219)',
                backgroundColor: 'rgba(209, 213, 219, 0.5)',
                tension: 0.3,
                borderDash: [5, 5],
            },
        ],
    };

    const efficiencyData = {
        labels: efficiency.map(e => e.field),
        datasets: [
            {
                label: 'Eficiencia (kg/ha)',
                data: efficiency.map(e => e.yield),
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                borderRadius: 8,
            },
        ],
    };

    const costDistributionData = {
        labels: costs.labels.map(l => l.toUpperCase()),
        datasets: [
            {
                data: costs.data,
                backgroundColor: [
                    'rgba(34, 197, 94, 0.6)',
                    'rgba(59, 130, 246, 0.6)',
                    'rgba(249, 115, 22, 0.6)',
                    'rgba(168, 85, 247, 0.6)',
                    'rgba(236, 72, 153, 0.6)',
                ],
                borderWidth: 1,
            },
        ],
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Business Intelligence & Analítica
                    </h2>
                    <select
                        value={year}
                        onChange={(e) => handleYearChange(parseInt(e.target.value))}
                        className="rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    >
                        {[2023, 2024, 2025, 2026].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            }
        >
            <Head title="Analítica Avanzada" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {/* Key Metrics Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-sm text-gray-500 font-medium uppercase">Cosecha Total {year}</p>
                            <p className="text-3xl font-bold text-green-600">
                                {totalHarvest.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} kg
                            </p>
                            <p className="text-xs text-gray-400 mt-1">Acumulado anual</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-sm text-gray-500 font-medium uppercase">Costo Promedio / Kg</p>
                            <p className="text-3xl font-bold text-blue-600">
                                ${costs.data.reduce((a, b) => a + b, 0) > 0 && totalHarvest > 0
                                    ? Math.round(costs.data.reduce((a, b) => a + b, 0) / totalHarvest).toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                                    : 0}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">Basado en costos directos</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-sm text-gray-500 font-medium uppercase">Campo Más Eficiente</p>
                            <p className="text-3xl font-bold text-orange-600">
                                {efficiency[0]?.field || 'N/A'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">{efficiency[0]?.yield || 0} kg/ha</p>
                        </div>
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* 1. Harvest Trends Line Chart */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Tendencia de Cosecha</h3>
                            <div className="h-80">
                                <Line
                                    data={harvestTrendData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { position: 'bottom' } }
                                    }}
                                />
                            </div>
                        </div>

                        {/* 2. Field Efficiency Bar Chart */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Productividad por Campo (kg/ha)</h3>
                            <div className="h-80">
                                <Bar
                                    data={efficiencyData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { display: false } }
                                    }}
                                />
                            </div>
                        </div>

                        {/* 3. Cost Distribution Pie Chart */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Distribución de Gastos</h3>
                            <div className="h-80 flex justify-center">
                                <Pie
                                    data={costDistributionData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { position: 'right' } }
                                    }}
                                />
                            </div>
                        </div>

                        {/* 4. Action Summary / Insights */}
                        <div className="bg-green-800 p-6 rounded-xl shadow-sm text-white flex flex-col justify-between">
                            <div>
                                <h3 className="text-xl font-bold mb-2">Insights de Inteligencia</h3>
                                <div className="space-y-4 mt-4">
                                    <div className="flex items-start gap-4">
                                        <span className="material-symbols-outlined bg-green-700 p-2 rounded-lg text-green-300">trending_up</span>
                                        <div>
                                            <p className="font-bold">Crecimiento Productivo</p>
                                            <p className="text-sm text-green-100">La producción acumulada es {totalHarvest > totalPreviousHarvest ? 'superior' : 'inferior'} a la temporada pasada.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <span className="material-symbols-outlined bg-green-700 p-2 rounded-lg text-blue-300">payments</span>
                                        <div>
                                            <p className="font-bold">Optimización de Costos</p>
                                            <p className="text-sm text-green-100">El 60% de sus gastos se concentran en {costs.labels[0] || 'labores'}. Revise el módulo de Panificación para ajustes.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8 pt-6 border-t border-green-700">
                                <button className="w-full bg-white text-green-800 font-bold py-2 rounded-lg hover:bg-green-50 transition-colors">
                                    Exportar Reporte Ejecutivo PDF
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

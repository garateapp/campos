import React, { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { analyzeCropImage } from '@/Services/geminiService';

import { PageProps } from '@/types';

interface Field {
    id: number;
    name: string;
    code: string | null;
    area_hectares: number;
    status: string;
    coordinates: any;
    crop: string;
}

interface MappingPageProps extends PageProps {
    fields: Field[];
}

const FieldMapping: React.FC = () => {
    const { fields } = usePage<MappingPageProps>().props;
    const [analyzing, setAnalyzing] = useState(false);
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredFields = fields.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.code && f.code.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const totalHectares = fields.reduce((sum, f) => sum + Number(f.area_hectares), 0);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setAnalyzing(true);
        setAiInsight(null);
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = (reader.result as string).split(',')[1];
                const result = await analyzeCropImage(base64, "Describe la salud de este cultivo y sugiere mejoras en español.");
                setAiInsight(result || "No se detectaron problemas.");
                setAnalyzing(false);
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error(err);
            setAiInsight("Falla al analizar la imagen. Verifica tu API Key en el archivo .env (VITE_GEMINI_API_KEY).");
            setAnalyzing(false);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Mapa de Parcelas e Inventario
                </h2>
            }
        >
            <Head title="Mapa de Parcelas" />

            <div className="flex h-[calc(100vh-160px)] w-full overflow-hidden bg-white rounded-xl shadow-sm border border-gray-100">
                {/* Sidebar Inventory */}
                <aside className="w-80 flex flex-col border-r border-gray-200 bg-gray-50/50 shrink-0 hidden lg:flex">
                    <div className="p-6 border-b border-gray-200">
                        <h1 className="text-lg font-bold text-gray-900">Inventario de Campo</h1>
                        <p className="text-xs text-green-600 mt-1 uppercase tracking-widest font-black">{totalHectares.toFixed(2)} Hectáreas Totales</p>
                    </div>
                    <div className="p-4">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                placeholder="Filtrar parcelas..."
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1 p-2 scrollbar-hide">
                        {filteredFields.map((field) => (
                            <FieldCard key={field.id} field={field} />
                        ))}
                        {filteredFields.length === 0 && (
                            <div className="p-4 text-center text-gray-400 text-sm">
                                No se encontraron parcelas.
                            </div>
                        )}
                    </div>
                    <div className="p-4 border-t border-gray-200">
                        <button className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-green-700 transition-colors">
                            <span className="material-symbols-outlined text-sm">add_location</span>
                            Nuevo Límite
                        </button>
                    </div>
                </aside>

                {/* Map Interface Simulation */}
                <main className="flex-1 relative flex flex-col">
                    <div className="flex-1 bg-gray-100 relative overflow-hidden">
                        {/* Simulated Map Background */}
                        <div className="absolute inset-0 bg-cover bg-center opacity-90" style={{ backgroundImage: "url('https://picsum.photos/seed/farm_map/1600/1200')" }}></div>

                        {/* AI Insight Panel Overlay */}
                        <div className="absolute top-6 left-6 z-10 w-96 max-h-[85%] flex flex-col gap-4">
                            <div className="bg-white/95 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/20">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="size-10 bg-green-100 rounded-xl flex items-center justify-center text-green-700">
                                        <span className="material-symbols-outlined icon-fill">diagnosis</span>
                                    </div>
                                    <div>
                                        <h3 className="font-black text-gray-900 text-lg leading-none">Diagnóstico IA</h3>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Sube foto de la hoja</p>
                                    </div>
                                </div>

                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-green-200 rounded-2xl cursor-pointer hover:bg-green-50/50 transition-colors bg-white/50">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <span className="material-symbols-outlined text-green-600 mb-2">upload_file</span>
                                        <p className="text-xs text-gray-400 font-bold">Imagen (PNG, JPG) hasta 10MB</p>
                                    </div>
                                    <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                                </label>

                                {analyzing && (
                                    <div className="mt-4 flex items-center gap-3 animate-pulse">
                                        <div className="size-2 bg-green-600 rounded-full animate-bounce"></div>
                                        <p className="text-sm font-bold text-green-600 font-sans">Gemini está analizando...</p>
                                    </div>
                                )}

                                {aiInsight && (
                                    <div className="mt-4 p-4 bg-green-50 rounded-2xl border border-green-100 overflow-y-auto max-h-60 scrollbar-hide shadow-inner">
                                        <p className="text-sm text-gray-800 leading-relaxed font-medium whitespace-pre-wrap">
                                            {aiInsight}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white/95 backdrop-blur-xl p-4 rounded-3xl shadow-xl border border-white/20 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-green-600">layers</span>
                                    <span className="text-sm font-bold text-gray-900">Capa Activa: NDVI</span>
                                </div>
                                <button className="material-symbols-outlined text-gray-400 hover:text-green-600 transition-colors">settings</button>
                            </div>
                        </div>

                        {/* Map Controls */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-white/20 z-10">
                            <button className="p-3 bg-green-600 text-white rounded-xl shadow-lg hover:bg-green-700 transition-colors"><span className="material-symbols-outlined">zoom_in</span></button>
                            <button className="p-3 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"><span className="material-symbols-outlined">zoom_out</span></button>
                            <div className="w-px bg-gray-200 mx-1"></div>
                            <button className="p-3 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"><span className="material-symbols-outlined">my_location</span></button>
                        </div>
                    </div>
                </main>
            </div>
        </AuthenticatedLayout>
    );
};

const FieldCard = ({ field }: { field: Field }) => {
    const statusColors: Record<string, string> = {
        active: 'bg-green-100 text-green-700',
        fallow: 'bg-gray-200 text-gray-500',
        preparing: 'bg-yellow-100 text-yellow-700',
    };

    const statusLabels: Record<string, string> = {
        active: 'Activo',
        fallow: 'Vascio',
        preparing: 'Preparando',
    };

    return (
        <div className="p-4 rounded-2xl hover:bg-white transition-all cursor-pointer group border border-transparent hover:border-green-100 hover:shadow-sm">
            <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-sm text-gray-900 group-hover:text-green-600 transition-colors truncate max-w-[150px]">
                    {field.name}
                    {field.code && <span className="ml-1 text-[10px] text-gray-400 font-normal">({field.code})</span>}
                </h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColors[field.status] || 'bg-gray-100'}`}>
                    {statusLabels[field.status] || field.status}
                </span>
            </div>
            <div className="flex justify-between items-end">
                <div className="text-xs text-gray-500 font-bold">
                    <p>{field.crop} • {Number(field.area_hectares).toFixed(1)} Ha</p>
                </div>
                <span className="material-symbols-outlined text-gray-300 group-hover:text-green-600 group-hover:translate-x-1 transition-all text-sm">chevron_right</span>
            </div>
        </div>
    );
};

export default FieldMapping;

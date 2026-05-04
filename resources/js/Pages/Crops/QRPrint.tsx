import React, { useRef } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

interface Crop {
    id: number;
    name: string;
    species?: {
        name: string;
        family?: {
            name: string;
        };
    };
    varieties?: Array<{
        name: string;
    }>;
    field?: {
        name: string;
    };
}

interface Props {
    crops: Crop[];
}

export default function QRPrint({ crops }: Props) {
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        window.print();
    };

    // Generate QR code URL using a public API (goqr.me or similar)
    const getQRCodeUrl = (text: string) => {
        return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Imprimir Códigos QR - Cuarteles
                </h2>
            }
        >
            <Head title="Imprimir QR" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Print button - hidden when printing */}
                    <div className="mb-4 print:hidden">
                        <button
                            onClick={handlePrint}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        >
                            🖨️ Imprimir
                        </button>
                        <a
                            href={route('crops.index')}
                            className="ml-2 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                        >
                            ← Volver
                        </a>
                    </div>

                    {/* Print area */}
                    <div
                        ref={printRef}
                        className="bg-white shadow-sm rounded-lg p-6"
                        style={{
                            minHeight: '1054px', // Letter height in pixels at 96 DPI
                        }}
                    >
                        <style>{`
                            @media print {
                                @page {
                                    size: letter;
                                    margin: 0.5in;
                                }
                                body {
                                    -webkit-print-color-adjust: exact !important;
                                    print-color-adjust: exact !important;
                                }
                                .print\\:hidden {
                                    display: none !important;
                                }
                                .print-container {
                                    width: 100% !important;
                                    max-width: none !important;
                                    padding: 0 !important;
                                    margin: 0 !important;
                                }
                                .qr-card {
                                    break-inside: avoid;
                                    page-break-inside: avoid;
                                }
                            }
                        `}</style>

                        <div className="print-container grid grid-cols-3 gap-4">
                            {crops.map((crop) => (
                                <div
                                    key={crop.id}
                                    className="qr-card border-2 border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center bg-white"
                                    style={{
                                        aspectRatio: '1 / 1.1',
                                    }}
                                >
                                    <h3 className="text-lg font-bold text-gray-800 text-center mb-2 truncate w-full">
                                        {crop.name}
                                    </h3>
                                    
                                    {crop.species && (
                                        <p className="text-xs text-gray-600 text-center mb-1">
                                            {crop.species.name}
                                        </p>
                                    )}
                                    
                                    {crop.species?.family && (
                                        <p className="text-xs text-gray-500 text-center mb-2">
                                            Fam: {crop.species.family.name}
                                        </p>
                                    )}
                                    
                                    {crop.varieties && crop.varieties.length > 0 && (
                                        <p className="text-xs text-gray-600 text-center mb-2 truncate w-full">
                                            Var: {crop.varieties.map(v => v.name).join(', ')}
                                        </p>
                                    )}
                                    
                                    {crop.field && (
                                        <p className="text-xs text-gray-500 text-center mb-3">
                                            Campo: {crop.field.name}
                                        </p>
                                    )}
                                    
                                    <img
                                        src={getQRCodeUrl(crop.name)}
                                        alt={`QR ${crop.name}`}
                                        className="w-32 h-32 object-contain"
                                        loading="lazy"
                                    />
                                    
                                    <p className="text-xs text-gray-400 mt-2 text-center">
                                        {crop.name}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {crops.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-gray-500">No hay cuarteles disponibles para generar QR.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

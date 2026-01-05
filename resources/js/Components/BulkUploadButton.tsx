import React, { useState, useRef } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';

interface BulkUploadButtonProps {
    type: 'workers' | 'varieties';
    label?: string;
}

const BulkUploadButton: React.FC<BulkUploadButtonProps> = ({ type, label = 'Carga Masiva' }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        const files = fileInputRef.current?.files;
        if (!files || files.length === 0) {
            setMessage({ text: 'Por favor seleccione un archivo.', type: 'error' });
            return;
        }

        const formData = new FormData();
        formData.append('file', files[0]);

        setIsUploading(true);
        setMessage(null);

        try {
            const response = await axios.post(route('api.import', { type }), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setMessage({ text: response.data.message, type: 'success' });
            setTimeout(() => {
                setShowModal(false);
                router.reload();
            }, 2000);
        } catch (error: any) {
            setMessage({
                text: error.response?.data?.message || 'Error durante la carga.',
                type: 'error'
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-25 transition ease-in-out duration-150"
            >
                <span className="material-symbols-outlined text-sm mr-2">upload_file</span>
                {label}
            </button>

            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden flex items-center justify-center bg-gray-500 bg-opacity-75 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900 capitalize">Importar {type === 'workers' ? 'Jornaleros' : 'Variedades'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-500">
                                <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleUpload}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Seleccionar Excel o CSV
                                </label>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept=".xlsx, .xls, .csv"
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                                    disabled={isUploading}
                                />
                                <p className="mt-2 text-xs text-gray-500">
                                    Asegúrese de que el archivo tenga una fila de encabezados.
                                    {type === 'workers' ? ' (Nombre, RUT, Telefono)' : ' (Especie, Nombre)'}
                                </p>
                            </div>

                            {message && (
                                <div className={`p-3 rounded-md mb-4 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {message.text}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                    disabled={isUploading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                                    disabled={isUploading}
                                >
                                    {isUploading ? 'Subiendo...' : 'Iniciar Carga'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default BulkUploadButton;

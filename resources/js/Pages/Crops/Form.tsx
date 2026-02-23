import { FormEventHandler, useEffect, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';

interface Variety {
    id: number;
    name: string;
    species_id: number;
}

interface Species {
    id: number;
    name: string;
    scientific_name: string | null;
    family_id: number;
    varieties: Variety[];
}

interface Family {
    id: number;
    name: string;
    species: Species[];
}

interface Field {
    id: number;
    name: string;
}

interface CostCenter {
    id: number;
    code: string;
    name: string;
}

interface CropFormProps {
    crop: any;
    families: Family[];
    fields: Field[];
    costCenters: CostCenter[];
}

export default function Form({ crop, families, fields, costCenters }: CropFormProps) {
    const isEditing = !!crop;

    const { data, setData, post, patch, processing, errors } = useForm({
        field_id: crop?.field_id?.toString() || '',
        cost_center_id: crop?.cost_center_id?.toString() || '',
        family_id: crop?.family_id?.toString() || '',
        species_id: crop?.species_id?.toString() || '',
        variety_ids: (crop?.variety_ids || []).map((id: number | string) => id.toString()),
        name: crop?.name || '',
        variety: crop?.variety || '',
        scientific_name: crop?.scientific_name || '',
        days_to_harvest: crop?.days_to_harvest?.toString() || '',
        notes: crop?.notes || '',
    });

    const [availableSpecies, setAvailableSpecies] = useState<Species[]>([]);
    const [availableVarieties, setAvailableVarieties] = useState<Variety[]>([]);

    // Handle family selection change
    useEffect(() => {
        if (data.family_id) {
            const selectedFamily = families.find(f => f.id.toString() === data.family_id);
            if (selectedFamily) {
                setAvailableSpecies(selectedFamily.species);
                // Reset species and variety if not in the new family
                if (!isEditing || data.family_id !== crop?.family_id?.toString()) {
                    if (!selectedFamily.species.some(s => s.id.toString() === data.species_id)) {
                        setData(prev => ({ ...prev, species_id: '', variety_ids: [] }));
                    }
                }
            }
        } else {
            setAvailableSpecies([]);
        }
    }, [data.family_id, families]);

    // Handle species selection change
    useEffect(() => {
        if (data.species_id) {
            const selectedSpecies = availableSpecies.find(s => s.id.toString() === data.species_id);
            if (selectedSpecies) {
                setAvailableVarieties(selectedSpecies.varieties);
                // Update scientific name if species changes (and we're not editing or it's empty)
                if (!isEditing || data.species_id !== crop?.species_id?.toString()) {
                    if (!data.scientific_name) {
                        setData(prev => ({ ...prev, scientific_name: selectedSpecies.scientific_name || '' }));
                    }
                }
                // Reset variety if it doesn't belong to the new species
                const current = Array.isArray(data.variety_ids) ? data.variety_ids : [];
                const filtered = current.filter(vId => selectedSpecies.varieties.some(v => v.id.toString() === vId));
                if (filtered.length !== current.length) {
                    setData('variety_ids', filtered);
                }
            }
        } else {
            setAvailableVarieties([]);
        }
    }, [data.species_id, availableSpecies]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (isEditing) {
            patch(route('crops.update', crop.id));
        } else {
            post(route('crops.store'));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-4">
                    <Link href={route('crops.index')} className="text-gray-500 hover:text-gray-700">
                        ← Volver
                    </Link>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        {isEditing ? 'Editar Cuartel' : 'Nuevo Cuartel'}
                    </h2>
                </div>
            }
        >
            <Head title={isEditing ? 'Editar Cuartel' : 'Nuevo Cuartel'} />

            <div className="py-6">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 pb-6 border-b border-gray-50">
                                <div className="col-span-1 md:col-span-3">
                                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Jerarquía de Clasificación</h3>
                                </div>

                                <div>
                                    <InputLabel htmlFor="field_id" value="Campo" />
                                    <select
                                        id="field_id"
                                        name="field_id"
                                        value={data.field_id}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                                        onChange={(e) => setData('field_id', e.target.value)}
                                    >
                                        <option value="">Seleccionar Campo (Opcional)...</option>
                                        {fields.map(field => (
                                            <option key={field.id} value={field.id}>{field.name}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.field_id} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="cost_center_id" value="Centro de Costo" />
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
                                    <InputError message={errors.cost_center_id} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="family_id" value="Familia *" />
                                    <select
                                        id="family_id"
                                        name="family_id"
                                        value={data.family_id}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                                        onChange={(e) => setData('family_id', e.target.value)}
                                        required
                                    >
                                        <option value="">Seleccionar Familia...</option>
                                        {families.map(f => (
                                            <option key={f.id} value={f.id}>{f.name}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.family_id} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="species_id" value="Especie *" />
                                    <select
                                        id="species_id"
                                        name="species_id"
                                        value={data.species_id}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                                        onChange={(e) => setData('species_id', e.target.value)}
                                        required
                                        disabled={!data.family_id}
                                    >
                                        <option value="">Seleccionar Especie...</option>
                                        {availableSpecies.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.species_id} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="variety_ids" value="Variedades (una o mas)" />
                                    <select
                                        id="variety_ids"
                                        name="variety_ids"
                                        multiple
                                        value={data.variety_ids}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500 min-h-[110px]"
                                        onChange={(e) => setData('variety_ids', Array.from(e.target.selectedOptions, option => option.value))}
                                        disabled={!data.species_id}
                                    >
                                        {availableVarieties.map(v => (
                                            <option key={v.id} value={v.id}>{v.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">Selecciona una o varias variedades de la especie.</p>
                                    <InputError message={errors.variety_ids} className="mt-2" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputLabel htmlFor="name" value="Nombre del Cuartel (opcional)" />
                                    <TextInput
                                        id="name"
                                        type="text"
                                        name="name"
                                        value={data.name}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Ej: Cereza Exportación"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Se usará el nombre de la especie por defecto.</p>
                                    <InputError message={errors.name} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="scientific_name" value="Nombre Científico" />
                                    <TextInput
                                        id="scientific_name"
                                        type="text"
                                        name="scientific_name"
                                        value={data.scientific_name}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('scientific_name', e.target.value)}
                                    />
                                    <InputError message={errors.scientific_name} className="mt-2" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputLabel htmlFor="days_to_harvest" value="Días Estimados hasta Cosecha" />
                                    <TextInput
                                        id="days_to_harvest"
                                        type="number"
                                        name="days_to_harvest"
                                        value={data.days_to_harvest}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('days_to_harvest', e.target.value)}
                                        min="1"
                                    />
                                    <InputError message={errors.days_to_harvest} className="mt-2" />
                                </div>
                            </div>

                            <div>
                                <InputLabel htmlFor="notes" value="Notas" />
                                <textarea
                                    id="notes"
                                    name="notes"
                                    value={data.notes}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                                    rows={3}
                                    onChange={(e) => setData('notes', e.target.value)}
                                />
                                <InputError message={errors.notes} className="mt-2" />
                            </div>

                            <div className="flex items-center justify-end gap-4 pt-4 border-t">
                                <Link href={route('crops.index')} className="text-gray-600 hover:text-gray-900">
                                    Cancelar
                                </Link>
                                <PrimaryButton disabled={processing}>
                                    {processing ? 'Guardando...' : 'Guardar Cuartel'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

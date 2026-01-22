import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, TextInput } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getDB } from '../db/database';
import Scanner from '../components/Scanner';
import { Field, Species, HarvestContainer } from '../types';
import { COLORS, globalStyles } from '../theme';

import ScreenHeader from '../components/ScreenHeader';

export default function HarvestScreen({ onBack }: { onBack: () => void }) {
    // Data
    const [fields, setFields] = useState<Field[]>([]);
    const [species, setSpecies] = useState<Species[]>([]);
    const [allContainers, setAllContainers] = useState<HarvestContainer[]>([]);
    const [filteredContainers, setFilteredContainers] = useState<HarvestContainer[]>([]);

    // Selection State
    const [selectedField, setSelectedField] = useState<Field | null>(null);
    const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null);
    const [selectedContainer, setSelectedContainer] = useState<HarvestContainer | null>(null);
    const [lastScans, setLastScans] = useState<Record<string, number>>({});

    const [quantity, setQuantity] = useState('1');

    // Steps: 0=Field, 1=Species, 2=Container, 3=Scanning
    const [step, setStep] = useState(0);

    const LAST_SELECTION_KEY = 'harvest_last_selection';

    useEffect(() => {
        loadContext();
    }, []);

    const loadContext = async () => {
        const db = await getDB();

        const f = await db.getAllAsync('SELECT * FROM fields ORDER BY name');
        const s = await db.getAllAsync('SELECT * FROM species ORDER BY name');
        const c = await db.getAllAsync('SELECT * FROM harvest_containers ORDER BY name');
        setFields(f as Field[]);
        setSpecies(s as Species[]);
        setAllContainers(c as HarvestContainer[]);

        // Restore last selection if valid
        try {
            const raw = await SecureStore.getItemAsync(LAST_SELECTION_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                const field = (f as Field[]).find((x) => x.id === parsed.field_id) || null;
                const sp = (s as Species[]).find((x) => x.id === parsed.species_id) || null;
                const cont = (c as HarvestContainer[]).find((x) => x.id === parsed.container_id) || null;
                if (field) setSelectedField(field);
                if (sp) setSelectedSpecies(sp);
                if (cont && sp && cont.species_id === sp.id) {
                    setSelectedContainer(cont);
                    setStep(3);
                } else if (sp) {
                    setStep(2);
                } else if (field) {
                    setStep(1);
                }
            }
        } catch (e) {
            // ignore restore errors
        }
    };

    const persistSelection = async (fieldId?: number | null, speciesId?: number | null, containerId?: number | null) => {
        try {
            await SecureStore.setItemAsync(LAST_SELECTION_KEY, JSON.stringify({
                field_id: fieldId ?? null,
                species_id: speciesId ?? null,
                container_id: containerId ?? null,
            }));
        } catch (e) {
            // ignore persist errors
        }
    };

    // Filter containers when Species changes
    useEffect(() => {
        if (selectedSpecies) {
            const filtered = allContainers.filter(c => c.species_id === selectedSpecies.id);
            setFilteredContainers(filtered);
            if (selectedContainer && selectedContainer.species_id !== selectedSpecies.id) {
                setSelectedContainer(null);
            }
        } else {
            setFilteredContainers([]);
        }
    }, [selectedSpecies, allContainers, selectedContainer]);

    const handleScan = async (code: string) => {
        if (!selectedField || !selectedContainer) return;

        const db = await getDB();
        const cardRes: any = await db.getFirstAsync('SELECT id FROM cards WHERE code = ?', code);
        if (!cardRes) {
            Alert.alert('Error', 'Card not found');
            return;
        }

        const now = Date.now();
        const lastDb: any = await db.getFirstAsync(
            'SELECT created_at_ms FROM harvest_collections WHERE card_id = ? ORDER BY created_at_ms DESC LIMIT 1',
            cardRes.id
        );
        const lastDbMs = lastDb?.created_at_ms ? Number(lastDb.created_at_ms) : 0;
        const lastMemoryMs = lastScans[code] || 0;
        const lastSeen = Math.max(lastDbMs, lastMemoryMs);
        if (lastSeen && now - lastSeen < 15 * 60 * 1000) {
            Alert.alert('Advertencia', 'Esta tarjeta ya fue registrada en los ρtimos 15 minutos.');
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        const assignment: any = await db.getFirstAsync(
            'SELECT worker_id FROM card_assignments WHERE card_id = ? AND date = ?',
            cardRes.id, today
        );

        if (!assignment) {
            Alert.alert('Error', 'Card not assigned for today');
            return;
        }

        try {
            await db.runAsync(
                'INSERT INTO harvest_collections (worker_id, card_id, date, harvest_container_id, quantity, field_id, created_at_ms, synced) VALUES (?, ?, ?, ?, ?, ?, ?, 0)',
                assignment.worker_id, cardRes.id, today, selectedContainer.id, parseInt(quantity) || 1, selectedField.id, now
            );
            Alert.alert('Success', `Registered +${quantity} (${selectedContainer.name})`);
            setLastScans(prev => ({ ...prev, [code]: now }));
        } catch (e) {
            Alert.alert('Error', 'Failed to save');
        }
    };

    const renderFieldSelection = () => (
        <>
            <Text style={globalStyles.subtitle}>Paso 1: Seleccione Cuartel</Text>
            <FlatList
                data={fields}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingBottom: 20 }}
                renderItem={({ item }) => (
                    <TouchableOpacity style={[globalStyles.card, { padding: 20 }]} onPress={() => { setSelectedField(item); persistSelection(item.id, selectedSpecies?.id ?? null, selectedContainer?.id ?? null); setStep(1); }}>
                        <Text style={[globalStyles.text, { fontSize: 18 }]}>{item.name}</Text>
                    </TouchableOpacity>
                )}
            />
        </>
    );

    const renderSpeciesSelection = () => (
        <>
            <TouchableOpacity onPress={() => setStep(0)} style={{ marginBottom: 10 }}>
                <Text style={{ color: COLORS.primary }}>← Cambiar Cuartel ({selectedField?.name})</Text>
            </TouchableOpacity>
            <Text style={globalStyles.subtitle}>Paso 2: Seleccione Especie</Text>
            <FlatList
                data={species}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingBottom: 20 }}
                renderItem={({ item }) => (
                    <TouchableOpacity style={[globalStyles.card, { padding: 20 }]} onPress={() => { setSelectedSpecies(item); persistSelection(selectedField?.id ?? null, item.id, selectedContainer?.id ?? null); setStep(2); }}>
                        <Text style={[globalStyles.text, { fontSize: 18 }]}>{item.name}</Text>
                    </TouchableOpacity>
                )}
            />
        </>
    );

    const renderContainerSelection = () => (
        <>
            <TouchableOpacity onPress={() => setStep(1)} style={{ marginBottom: 10 }}>
                <Text style={{ color: COLORS.primary }}>← Cambiar Especie ({selectedSpecies?.name})</Text>
            </TouchableOpacity>
            <Text style={globalStyles.subtitle}>Paso 3: Seleccione Envase</Text>
            {selectedContainer && filteredContainers.some(c => c.id === selectedContainer.id) && (
                <TouchableOpacity
                    style={[globalStyles.button, { marginHorizontal: 16, marginBottom: 10 }]}
                    onPress={() => setStep(3)}
                >
                    <Text style={globalStyles.buttonText}>Usar envase seleccionado ({selectedContainer.name})</Text>
                </TouchableOpacity>
            )}
            <FlatList
                data={filteredContainers}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingBottom: 20 }}
                ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: '#666' }}>No hay envases para esta especie.</Text>}
                renderItem={({ item }) => (
                    <TouchableOpacity style={[globalStyles.card, { padding: 20 }]} onPress={() => { setSelectedContainer(item); persistSelection(selectedField?.id ?? null, selectedSpecies?.id ?? null, item.id); setStep(3); }}>
                        <Text style={[globalStyles.text, { fontSize: 18 }]}>{item.name}</Text>
                    </TouchableOpacity>
                )}
            />
        </>
    );

    const renderScanning = () => (
        <View style={globalStyles.card}>
            <View style={{ marginBottom: 20 }}>
                <Text style={globalStyles.text}>Cuartel: <Text style={{ fontWeight: 'bold' }}>{selectedField?.name}</Text></Text>
                <Text style={globalStyles.text}>Especie: <Text style={{ fontWeight: 'bold' }}>{selectedSpecies?.name}</Text></Text>
                <Text style={globalStyles.text}>Envase: <Text style={{ fontWeight: 'bold' }}>{selectedContainer?.name}</Text></Text>
            </View>

            <Text style={globalStyles.text}>Cantidad a sumar:</Text>
            <TextInput
                style={[globalStyles.input, { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginVertical: 10 }]}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
            />

            <View style={{ height: 260, borderRadius: 12, overflow: 'hidden', marginTop: 10, borderWidth: 1, borderColor: COLORS.border }}>
                <Scanner onScanned={handleScan} onClose={() => {}} />
            </View>

            <TouchableOpacity style={[globalStyles.secondaryButton, { marginTop: 10 }]} onPress={() => setStep(2)}>
                <Text style={globalStyles.secondaryButtonText}>Cambiar Envase</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[globalStyles.secondaryButton, { marginTop: 5, backgroundColor: '#f0f0f0' }]} onPress={() => { setSelectedContainer(null); persistSelection(selectedField?.id ?? null, selectedSpecies?.id ?? null, null); setStep(0); }}>
                <Text style={[globalStyles.secondaryButtonText, { color: '#666' }]}>Reiniciar Selección</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={globalStyles.container}>
            <ScreenHeader title="Recolección Cosecha" onBack={onBack} />

            <>
                {step === 0 && renderFieldSelection()}
                {step === 1 && renderSpeciesSelection()}
                {step === 2 && renderContainerSelection()}
                {step === 3 && renderScanning()}
            </>
        </View>
    );
}

const styles = StyleSheet.create({});

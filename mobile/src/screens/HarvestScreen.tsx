import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, TextInput, Switch } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getDB } from '../db/database';
import Scanner from '../components/Scanner';
import { Field, Species, HarvestContainer } from '../types';
import { COLORS, globalStyles } from '../theme';

import ScreenHeader from '../components/ScreenHeader';

type Cuartel = {
    id: number;
    name: string;
    field_id: number | null;
    species_id: number | null;
    variety?: string | null;
};

export default function HarvestScreen({ onBack }: { onBack: () => void }) {
    // Data
    const [fields, setFields] = useState<Field[]>([]);
    const [species, setSpecies] = useState<Species[]>([]);
    const [allContainers, setAllContainers] = useState<HarvestContainer[]>([]);
    const [filteredContainers, setFilteredContainers] = useState<HarvestContainer[]>([]);
    const [cuarteles, setCuarteles] = useState<Cuartel[]>([]);

    // Selection State
    const [selectedCuartel, setSelectedCuartel] = useState<Cuartel | null>(null);
    const [selectedField, setSelectedField] = useState<Field | null>(null);
    const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null);
    const [selectedContainer, setSelectedContainer] = useState<HarvestContainer | null>(null);
    const [lastScans, setLastScans] = useState<Record<string, number>>({});
    const [scanLocked, setScanLocked] = useState(false);

    const [cuartelQuery, setCuartelQuery] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [markBinCompleted, setMarkBinCompleted] = useState(false);
    const [manualBinUnits, setManualBinUnits] = useState('');
    const [completedBinsCurrentSelection, setCompletedBinsCurrentSelection] = useState(0);
    const [completedBinsToday, setCompletedBinsToday] = useState(0);

    // Steps: 0=Cuartel, 1=Species, 2=Container, 3=Scanning
    const [step, setStep] = useState(0);

    const LAST_SELECTION_KEY = 'harvest_last_selection';

    useEffect(() => {
        loadContext();
    }, []);

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

    useEffect(() => {
        if (step === 3 && selectedField && selectedContainer) {
            loadCompletedBinsCounters();
        }
    }, [step, selectedField?.id, selectedContainer?.id]);

    const loadContext = async () => {
        const db = await getDB();

        const f = await db.getAllAsync('SELECT * FROM fields ORDER BY name');
        const s = await db.getAllAsync('SELECT * FROM species ORDER BY name');
        const c = await db.getAllAsync('SELECT * FROM harvest_containers ORDER BY name');
        const q = await db.getAllAsync('SELECT id, name, field_id, species_id, variety FROM crops ORDER BY name');

        const typedFields = f as Field[];
        const typedSpecies = s as Species[];
        const typedContainers = c as HarvestContainer[];
        const typedCuarteles = q as Cuartel[];

        setFields(typedFields);
        setSpecies(typedSpecies);
        setAllContainers(typedContainers);
        setCuarteles(typedCuarteles);

        try {
            const raw = await SecureStore.getItemAsync(LAST_SELECTION_KEY);
            if (!raw) return;

            const parsed = JSON.parse(raw);
            const cuartel = typedCuarteles.find((x) => x.id === parsed.cuartel_id) || null;
            const field = typedFields.find((x) => x.id === (parsed.field_id ?? cuartel?.field_id)) || null;
            const sp = typedSpecies.find((x) => x.id === (parsed.species_id ?? cuartel?.species_id)) || null;
            const cont = typedContainers.find((x) => x.id === parsed.container_id) || null;

            if (cuartel) {
                setSelectedCuartel(cuartel);
                setCuartelQuery(cuartel.name);
            }
            if (field) setSelectedField(field);
            if (sp) setSelectedSpecies(sp);

            if (cont && sp && cont.species_id === sp.id) {
                setSelectedContainer(cont);
                setStep(3);
            } else if (sp) {
                setStep(2);
            } else if (cuartel) {
                setStep(1);
            }
        } catch (e) {
            // ignore restore errors
        }
    };

    const persistSelection = async (
        cuartelId?: number | null,
        fieldId?: number | null,
        speciesId?: number | null,
        containerId?: number | null
    ) => {
        try {
            await SecureStore.setItemAsync(
                LAST_SELECTION_KEY,
                JSON.stringify({
                    cuartel_id: cuartelId ?? null,
                    field_id: fieldId ?? null,
                    species_id: speciesId ?? null,
                    container_id: containerId ?? null,
                })
            );
        } catch (e) {
            // ignore persist errors
        }
    };

    const selectCuartel = (cuartel: Cuartel) => {
        setSelectedCuartel(cuartel);
        setCuartelQuery(cuartel.name);
        setSelectedContainer(null);
        setMarkBinCompleted(false);
        setManualBinUnits('');

        const field = fields.find((f) => f.id === cuartel.field_id) || null;
        setSelectedField(field);

        if (!field) {
            setSelectedSpecies(null);
            persistSelection(cuartel.id, null, null, null);
            Alert.alert('Cuartel sin campo', 'Este cuartel no tiene campo asociado. Revisa su configuración en web.');
            return;
        }

        const sp = species.find((s) => s.id === cuartel.species_id) || null;
        setSelectedSpecies(sp);

        if (sp) {
            persistSelection(cuartel.id, field.id, sp.id, null);
            setStep(2);
        } else {
            persistSelection(cuartel.id, field.id, null, null);
            setStep(1);
        }
    };

    const resolveCuartelFromQuery = () => {
        const query = cuartelQuery.trim().toLowerCase();
        if (!query) {
            Alert.alert('Falta cuartel', 'Escribe el nombre del cuartel para continuar.');
            return;
        }

        const exact = cuarteles.find((c) => c.name.trim().toLowerCase() === query);
        if (exact) {
            selectCuartel(exact);
            return;
        }

        const startsWith = cuarteles.filter((c) => c.name.toLowerCase().startsWith(query));
        if (startsWith.length === 1) {
            selectCuartel(startsWith[0]);
            return;
        }

        const contains = cuarteles.filter((c) => c.name.toLowerCase().includes(query));
        if (contains.length === 1) {
            selectCuartel(contains[0]);
            return;
        }

        if (contains.length > 1) {
            Alert.alert('Varios cuarteles', 'Hay varios cuarteles coincidentes. Selecciona uno de la lista.');
            return;
        }

        Alert.alert('Cuartel no encontrado', 'No existe un cuartel con ese nombre en los datos sincronizados.');
    };

    const handleMarkBinCompletedChange = (value: boolean) => {
        setMarkBinCompleted(value);
        if (!value) {
            setManualBinUnits('');
            return;
        }

        setManualBinUnits((prev) => (prev.trim().length > 0 ? prev : quantity));
    };

    const handleQuantityChange = (value: string) => {
        setQuantity(value);
        if (!markBinCompleted) return;

        setManualBinUnits((prev) => {
            if (prev.trim().length === 0 || prev === quantity) {
                return value;
            }
            return prev;
        });
    };

    const loadCompletedBinsCounters = async () => {
        if (!selectedField || !selectedContainer) {
            setCompletedBinsCurrentSelection(0);
            setCompletedBinsToday(0);
            return;
        }

        const db = await getDB();
        const today = new Date().toISOString().split('T')[0];

        const currentSelection: any = await db.getFirstAsync(
            `SELECT COUNT(*) as count
             FROM harvest_collections
             WHERE date = ? AND field_id = ? AND harvest_container_id = ? AND is_bin_completed = 1`,
            today,
            selectedField.id,
            selectedContainer.id
        );

        const totalToday: any = await db.getFirstAsync(
            `SELECT COUNT(*) as count
             FROM harvest_collections
             WHERE date = ? AND is_bin_completed = 1`,
            today
        );

        setCompletedBinsCurrentSelection(Number(currentSelection?.count || 0));
        setCompletedBinsToday(Number(totalToday?.count || 0));
    };

    const handleScan = async (code: string) => {
        if (scanLocked) return;
        setScanLocked(true);

        if (!selectedCuartel || !selectedField || !selectedContainer) {
            Alert.alert('Faltan datos', 'Selecciona cuartel y envase antes de escanear.', [
                { text: 'OK', onPress: () => setScanLocked(false) },
            ]);
            return;
        }

        const quantityValue = Number.parseInt(quantity, 10);
        if (!Number.isFinite(quantityValue) || quantityValue <= 0) {
            Alert.alert('Cantidad inválida', 'Ingresa una cantidad mayor a 0.', [
                { text: 'OK', onPress: () => setScanLocked(false) },
            ]);
            return;
        }

        let manualBinUnitsValue: number | null = null;
        if (markBinCompleted) {
            const parsedManualBinUnits = Number.parseInt((manualBinUnits || quantity).trim(), 10);
            if (!Number.isFinite(parsedManualBinUnits) || parsedManualBinUnits <= 0) {
                Alert.alert('Bin manual inválido', 'Ingresa una cantidad de envases válida para cerrar el bin.', [
                    { text: 'OK', onPress: () => setScanLocked(false) },
                ]);
                return;
            }
            manualBinUnitsValue = parsedManualBinUnits;
        }

        const db = await getDB();
        const cardRes: any = await db.getFirstAsync('SELECT id FROM cards WHERE code = ?', code);
        if (!cardRes) {
            Alert.alert('Leído', 'Tarjeta no encontrada.', [
                { text: 'OK', onPress: () => setScanLocked(false) },
            ]);
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
        if (lastSeen && now - lastSeen < 1.5 * 60 * 1000) {
            Alert.alert('Leído', 'Esta tarjeta ya fue registrada en los últimos 90 segundos .', [
                { text: 'OK', onPress: () => setScanLocked(false) },
            ]);
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        const assignment: any = await db.getFirstAsync(
            'SELECT worker_id FROM card_assignments WHERE card_id = ? AND date = ? AND deleted_at IS NULL',
            cardRes.id,
            today
        );

        if (!assignment) {
            Alert.alert('Leído', 'Tarjeta no asignada para hoy.', [
                { text: 'OK', onPress: () => setScanLocked(false) },
            ]);
            return;
        }

        try {
            await db.runAsync(
                `INSERT INTO harvest_collections
                (worker_id, card_id, date, harvest_container_id, quantity, field_id, is_bin_completed, manual_bin_units, created_at_ms, synced)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
                assignment.worker_id,
                cardRes.id,
                today,
                selectedContainer.id,
                quantityValue,
                selectedField.id,
                markBinCompleted ? 1 : 0,
                manualBinUnitsValue,
                now
            );

            const suffix = markBinCompleted ? ` · Bin terminado (${manualBinUnitsValue || quantityValue} envases)` : '';
            Alert.alert('Leído', `Registrado +${quantityValue} (${selectedContainer.name}) en ${selectedCuartel.name}${suffix}`, [
                { text: 'OK', onPress: () => setScanLocked(false) },
            ]);
            setLastScans((prev) => ({ ...prev, [code]: now }));
            if (markBinCompleted) {
                setMarkBinCompleted(false);
                setManualBinUnits('');
            }
            await loadCompletedBinsCounters();
        } catch (e) {
            Alert.alert('Leído', 'Error al guardar.', [
                { text: 'OK', onPress: () => setScanLocked(false) },
            ]);
        }
    };

    const renderCuartelSelection = () => {
        const query = cuartelQuery.trim().toLowerCase();
        const filteredCuarteles = query
            ? cuarteles.filter((c) => c.name.toLowerCase().includes(query))
            : cuarteles;
        const groupedEntries = Object.entries(
            filteredCuarteles.reduce((acc, cuartel) => {
                const fieldName = fields.find((f) => f.id === cuartel.field_id)?.name || 'Sin campo';
                if (!acc[fieldName]) {
                    acc[fieldName] = [];
                }
                acc[fieldName].push(cuartel);
                return acc;
            }, {} as Record<string, Cuartel[]>)
        ).sort(([a], [b]) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

        return (
            <>
                <Text style={globalStyles.subtitle}>Paso 1: Escriba el Cuartel</Text>
                <View style={globalStyles.card}>
                    <Text style={[globalStyles.text, { marginBottom: 8 }]}>Digite el nombre del cuartel para continuar.</Text>
                    <TextInput
                        style={globalStyles.input}
                        placeholder="Nombre del cuartel"
                        value={cuartelQuery}
                        onChangeText={setCuartelQuery}
                        autoCapitalize="words"
                        returnKeyType="done"
                        onSubmitEditing={resolveCuartelFromQuery}
                    />
                    <TouchableOpacity style={globalStyles.button} onPress={resolveCuartelFromQuery}>
                        <Text style={globalStyles.buttonText}>CONTINUAR</Text>
                    </TouchableOpacity>
                </View>

                {groupedEntries.length === 0 ? (
                    <Text style={styles.emptyText}>No hay cuarteles coincidentes.</Text>
                ) : (
                    <FlatList
                        data={groupedEntries}
                        keyExtractor={([fieldName]) => fieldName}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        renderItem={({ item: [fieldName, fieldCuarteles] }) => (
                            <View style={[globalStyles.card, styles.groupCard]}>
                                <Text style={styles.groupTitle}>
                                    Campo: {fieldName} ({fieldCuarteles.length})
                                </Text>
                                <View style={styles.chipsWrap}>
                                    {fieldCuarteles.map((cuartel) => (
                                        <TouchableOpacity
                                            key={cuartel.id}
                                            style={styles.cuartelChip}
                                            onPress={() => selectCuartel(cuartel)}
                                        >
                                            <Text style={styles.cuartelChipText}>{cuartel.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}
                    />
                )}
            </>
        );
    };

    const renderSpeciesSelection = () => (
        <>
            <TouchableOpacity onPress={() => { setCuartelQuery(''); setStep(0); }} style={{ marginBottom: 10 }}>
                <Text style={{ color: COLORS.primary }}>← Cambiar Cuartel ({selectedCuartel?.name})</Text>
            </TouchableOpacity>
            <Text style={globalStyles.subtitle}>Paso 2: Seleccione Especie</Text>
            <FlatList
                data={species}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingBottom: 20 }}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[globalStyles.card, { padding: 20 }]}
                        onPress={() => {
                            setSelectedSpecies(item);
                            persistSelection(selectedCuartel?.id ?? null, selectedField?.id ?? null, item.id, selectedContainer?.id ?? null);
                            setStep(2);
                        }}
                    >
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
            {selectedContainer && filteredContainers.some((c) => c.id === selectedContainer.id) && (
                <TouchableOpacity style={[globalStyles.button, { marginHorizontal: 16, marginBottom: 10 }]} onPress={() => setStep(3)}>
                    <Text style={globalStyles.buttonText}>Usar envase seleccionado ({selectedContainer.name})</Text>
                </TouchableOpacity>
            )}
            <FlatList
                data={filteredContainers}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingBottom: 20 }}
                ListEmptyComponent={<Text style={styles.emptyText}>No hay envases para esta especie.</Text>}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[globalStyles.card, { padding: 20 }]}
                        onPress={() => {
                            setSelectedContainer(item);
                            setMarkBinCompleted(false);
                            setManualBinUnits('');
                            persistSelection(selectedCuartel?.id ?? null, selectedField?.id ?? null, selectedSpecies?.id ?? null, item.id);
                            setStep(3);
                        }}
                    >
                        <Text style={[globalStyles.text, { fontSize: 18 }]}>{item.name}</Text>
                    </TouchableOpacity>
                )}
            />
        </>
    );

    const renderScanning = () => {
        const unitsPerBin = Number(selectedContainer?.quantity_per_bin || 0);
        return (
            <View style={globalStyles.card}>
                <View style={{ marginBottom: 20 }}>
                    <Text style={globalStyles.text}>Cuartel: <Text style={{ fontWeight: 'bold' }}>{selectedCuartel?.name}</Text></Text>
                    <Text style={globalStyles.text}>Campo: <Text style={{ fontWeight: 'bold' }}>{selectedField?.name}</Text></Text>
                    <Text style={globalStyles.text}>Especie: <Text style={{ fontWeight: 'bold' }}>{selectedSpecies?.name}</Text></Text>
                    <Text style={globalStyles.text}>Envase: <Text style={{ fontWeight: 'bold' }}>{selectedContainer?.name}</Text></Text>
                    {unitsPerBin > 0 && (
                        <Text style={[globalStyles.text, { fontSize: 13, color: COLORS.textSecondary }]}>Configuración: {unitsPerBin} unidades por bin.</Text>
                    )}
                </View>

                <Text style={globalStyles.text}>Cantidad a sumar:</Text>
                <TextInput
                    style={[globalStyles.input, { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginVertical: 10 }]}
                    value={quantity}
                    onChangeText={handleQuantityChange}
                    keyboardType="numeric"
                />

                {unitsPerBin > 0 && (
                    <TouchableOpacity
                        style={[globalStyles.secondaryButton, { marginTop: 0 }]}
                        onPress={() => {
                            const binUnits = String(unitsPerBin);
                            setQuantity(binUnits);
                            if (markBinCompleted) {
                                setManualBinUnits(binUnits);
                            }
                        }}
                    >
                        <Text style={globalStyles.secondaryButtonText}>Usar unidades de bin completo ({unitsPerBin})</Text>
                    </TouchableOpacity>
                )}

                <View style={styles.binRow}>
                    <Text style={styles.binLabel}>¿Este registro completa un bin?</Text>
                    <Switch value={markBinCompleted} onValueChange={handleMarkBinCompletedChange} />
                </View>
                {markBinCompleted && (
                    <>
                        <Text style={[globalStyles.text, { fontSize: 13, color: COLORS.textSecondary }]}>
                            Cantidad de envases que completan este bin:
                        </Text>
                        <TextInput
                            style={[globalStyles.input, { marginTop: 6, marginBottom: 10 }]}
                            value={manualBinUnits}
                            onChangeText={setManualBinUnits}
                            keyboardType="numeric"
                            placeholder="Ej: 20"
                        />
                    </>
                )}

                <View style={styles.binCounterBox}>
                    <Text style={styles.binCounterTitle}>Conteo de bins totalizados</Text>
                    <Text style={styles.binCounterText}>
                        Hoy ({selectedCuartel?.name} / {selectedContainer?.name}): <Text style={styles.binCounterStrong}>{completedBinsCurrentSelection}</Text>
                    </Text>
                    <Text style={styles.binCounterText}>
                        Hoy (total): <Text style={styles.binCounterStrong}>{completedBinsToday}</Text>
                    </Text>
                </View>

                <View style={{ height: 260, borderRadius: 12, overflow: 'hidden', marginTop: 10, borderWidth: 1, borderColor: COLORS.border }}>
                    {scanLocked ? (
                        <View style={styles.lockedBox}>
                            <Text style={styles.lockedText}>Leído</Text>
                            <Text style={styles.lockedSubtext}>Confirma el mensaje para continuar.</Text>
                            <TouchableOpacity style={styles.resumeButton} onPress={() => setScanLocked(false)}>
                                <Text style={styles.resumeButtonText}>Reanudar</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <Scanner onScanned={handleScan} onClose={() => {}} />
                    )}
                </View>

                <View style={styles.quickChangeRow}>
                    <TouchableOpacity
                        style={[globalStyles.secondaryButton, styles.quickChangeButton]}
                        onPress={() => { setMarkBinCompleted(false); setManualBinUnits(''); setStep(2); }}
                    >
                        <Text style={globalStyles.secondaryButtonText}>Cambiar Envase</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[globalStyles.secondaryButton, styles.quickChangeButton]}
                        onPress={() => {
                            setSelectedContainer(null);
                            setSelectedSpecies(null);
                            setMarkBinCompleted(false);
                            setManualBinUnits('');
                            setCuartelQuery('');
                            persistSelection(selectedCuartel?.id ?? null, selectedField?.id ?? null, null, null);
                            setStep(0);
                        }}
                    >
                        <Text style={globalStyles.secondaryButtonText}>Cambiar Cuartel</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[globalStyles.secondaryButton, { marginTop: 5, backgroundColor: '#f0f0f0' }]}
                    onPress={() => {
                        setSelectedContainer(null);
                        setSelectedSpecies(null);
                        setMarkBinCompleted(false);
                        setManualBinUnits('');
                        setCuartelQuery('');
                        persistSelection(selectedCuartel?.id ?? null, selectedField?.id ?? null, null, null);
                        setStep(0);
                    }}
                >
                    <Text style={[globalStyles.secondaryButtonText, { color: '#666' }]}>Reiniciar Selección</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={globalStyles.container}>
            <ScreenHeader title="Recolección Cosecha" onBack={onBack} />

            <>
                {step === 0 && renderCuartelSelection()}
                {step === 1 && renderSpeciesSelection()}
                {step === 2 && renderContainerSelection()}
                {step === 3 && renderScanning()}
            </>
        </View>
    );
}

const styles = StyleSheet.create({
    lockedBox: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f4f4f4',
    },
    lockedText: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 6,
    },
    lockedSubtext: {
        fontSize: 12,
        color: COLORS.textSecondary,
        textAlign: 'center',
        paddingHorizontal: 12,
    },
    resumeButton: {
        marginTop: 12,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    resumeButtonText: {
        color: COLORS.white,
        fontWeight: '700',
    },
    binRow: {
        marginTop: 6,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    binLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        paddingRight: 10,
        flex: 1,
    },
    binCounterBox: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        padding: 12,
        backgroundColor: '#f7faf7',
        marginBottom: 6,
    },
    binCounterTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },
    binCounterText: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    binCounterStrong: {
        color: COLORS.primary,
        fontWeight: '800',
    },
    listHint: {
        marginTop: 4,
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    groupCard: {
        padding: 14,
    },
    groupTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 10,
    },
    chipsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    cuartelChip: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: COLORS.white,
    },
    cuartelChipText: {
        color: COLORS.text,
        fontWeight: '600',
        fontSize: 13,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        color: COLORS.textSecondary,
    },
    quickChangeRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 10,
    },
    quickChangeButton: {
        flex: 1,
        marginTop: 0,
    },
});

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, Switch, TextInput, ScrollView } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getDB } from '../db/database';
import Scanner from '../components/Scanner';
import { Field, TaskType, Worker } from '../types';
import { COLORS, globalStyles } from '../theme';

import ScreenHeader from '../components/ScreenHeader';

export default function AssignmentScreen({ onBack }: { onBack: () => void }) {
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
    const [fields, setFields] = useState<Field[]>([]);
    const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
    const [selectedField, setSelectedField] = useState<Field | null>(null);
    const [defaultFieldId, setDefaultFieldId] = useState<number | null>(null);
    const [hasAppliedDefaultField, setHasAppliedDefaultField] = useState(false);
    const [selectedTaskType, setSelectedTaskType] = useState<TaskType | null>(null);
    const [scannerMode, setScannerMode] = useState<'card' | null>(null);
    const [identityChecked, setIdentityChecked] = useState(false);
    const [newWorker, setNewWorker] = useState({ name: '', rut: '' });
    const [assignMode, setAssignMode] = useState(true);
    const [showTaskTypes, setShowTaskTypes] = useState(false);

    useEffect(() => {
        loadWorkers();
        loadDefaultFieldFromUser();
        loadMeta();
    }, []);

    useEffect(() => {
        if (hasAppliedDefaultField || selectedField || !defaultFieldId || fields.length === 0) {
            return;
        }

        const fieldFromUser = fields.find((f) => f.id === defaultFieldId) || null;
        if (fieldFromUser) {
            setSelectedField(fieldFromUser);
        }
        setHasAppliedDefaultField(true);
    }, [defaultFieldId, fields, selectedField, hasAppliedDefaultField]);

    const getDefaultFieldFromCatalog = () => {
        if (!defaultFieldId) return null;
        return fields.find((f) => f.id === defaultFieldId) || null;
    };

    const resetForm = () => {
        setSelectedWorker(null);
        setIdentityChecked(false);
        setSelectedField(getDefaultFieldFromCatalog());
        setSelectedTaskType(null);
        setShowTaskTypes(false);
        setScannerMode(null);
    };

    const handleAssignModeChange = (value: boolean) => {
        setAssignMode(value);
        if (!value) {
            resetForm();
        }
    };

    const loadWorkers = async () => {
        const db = await getDB();
        const result = await db.getAllAsync('SELECT * FROM workers ORDER BY name');
        setWorkers(result as Worker[]);
    };

    const loadDefaultFieldFromUser = async () => {
        try {
            const rawUser = await SecureStore.getItemAsync('auth_user');
            if (!rawUser) return;
            const user = JSON.parse(rawUser);
            const parsedId = Number(user?.field_id);
            if (Number.isInteger(parsedId) && parsedId > 0) {
                setDefaultFieldId(parsedId);
            }
        } catch (e) {
            // ignore corrupted auth_user payload
        }
    };

    const loadMeta = async () => {
        const db = await getDB();
        const f = await db.getAllAsync('SELECT * FROM fields ORDER BY name');
        const t = await db.getAllAsync('SELECT * FROM task_types ORDER BY name');
        setFields(f as Field[]);
        setTaskTypes(t as TaskType[]);
    };

    const handleCardScan = async (code: string) => {
        if (assignMode && !identityChecked) {
            Alert.alert('Validaci¢n requerida', 'Confirma la identidad del jornalero antes de asignar.');
            return;
        }
        if (assignMode && (!selectedField || !selectedTaskType)) {
            Alert.alert('Faltan datos', 'Selecciona el campo y el tipo de tarea.');
            return;
        }

        const db = await getDB();
        const cardResult: any = await db.getFirstAsync('SELECT id FROM cards WHERE code = ?', code);

        if (!cardResult) {
            Alert.alert('Error', 'Card not found in database. Please Sync.');
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        const activeAssignment: any = await db.getFirstAsync(
            'SELECT worker_id FROM card_assignments WHERE card_id = ? AND date = ? AND deleted_at IS NULL',
            cardResult.id,
            today
        );

        try {
            if (assignMode) {
                if (!selectedWorker) {
                    Alert.alert('Falta trabajador', 'Selecciona un trabajador antes de asignar.');
                    return;
                }

                if (activeAssignment) {
                    if (activeAssignment.worker_id === selectedWorker.id) {
                        Alert.alert('Aviso', 'Esta tarjeta ya est  asignada a este trabajador hoy.');
                    } else {
                        Alert.alert('Error', 'Esta tarjeta ya est  asignada a otro trabajador hoy.');
                    }
                    return;
                }

                await db.runAsync(
                    'DELETE FROM card_assignments WHERE card_id = ? AND date = ?',
                    cardResult.id,
                    today
                );
                await db.runAsync(
                    'INSERT INTO card_assignments (worker_id, card_id, date, deleted_at, synced) VALUES (?, ?, ?, NULL, 0)',
                    selectedWorker.id, cardResult.id, today
                );
                await db.runAsync('UPDATE workers SET is_identity_validated = 1, synced = 0 WHERE id = ?', selectedWorker.id);

                const attendanceExists: any = await db.getFirstAsync(
                    'SELECT id, check_in_time FROM attendances WHERE worker_id = ? AND date = ?',
                    selectedWorker.id,
                    today
                );
                const time = new Date().toLocaleTimeString();
                if (attendanceExists) {
                    await db.runAsync(
                        'UPDATE attendances SET field_id = ?, task_type_id = ?, check_in_time = COALESCE(check_in_time, ?), synced = 0 WHERE id = ?',
                        selectedField!.id,
                        selectedTaskType!.id,
                        time,
                        attendanceExists.id
                    );
                } else {
                    await db.runAsync(
                        'INSERT INTO attendances (worker_id, date, check_in_time, field_id, task_type_id, synced) VALUES (?, ?, ?, ?, ?, 0)',
                        selectedWorker.id, today, time, selectedField!.id, selectedTaskType!.id
                    );
                }

                Alert.alert('Success', `Card ${code} asignada a ${selectedWorker.name}`);
            } else {
                if (!activeAssignment) {
                    Alert.alert('Aviso', 'Esta tarjeta no est  asignada hoy.');
                    return;
                }

                const assignedWorker: any = await db.getFirstAsync(
                    'SELECT id, name FROM workers WHERE id = ?',
                    activeAssignment.worker_id
                );

                const deletedAt = new Date().toISOString();
                await db.runAsync(
                    'UPDATE card_assignments SET deleted_at = ?, synced = 0 WHERE card_id = ? AND date = ? AND deleted_at IS NULL',
                    deletedAt,
                    cardResult.id,
                    today
                );

                const time = new Date().toLocaleTimeString();
                await db.runAsync(
                    'UPDATE attendances SET check_out_time = ?, synced = 0 WHERE worker_id = ? AND date = ?',
                    time,
                    activeAssignment.worker_id,
                    today
                );

                const assignedWorkerName = assignedWorker?.name || `ID ${activeAssignment.worker_id}`;
                Alert.alert('Success', `Card ${code} desasignada de ${assignedWorkerName}`);
            }

            resetForm();
        } catch (e) {
            Alert.alert('Error', 'Failed to save assignment');
        }
    };

    const parseRutFromText = (data: string) => {
        console.log('[ID SCAN] raw data:', data);
        // Limpia puntos y busca patrón de 6-9 dígitos + dígito verificador (k/K o número)
        const normalized = data.replace(/\./g, ' ').replace(/RUN|RUT/gi, ' ');
        console.log('[ID SCAN] normalized:', normalized);
        const rutMatch = normalized.match(/(\d{6,9})[-\s]?([\dkK])/);
        console.log('[ID SCAN] match:', rutMatch);
        if (!rutMatch) return null;
        return `${rutMatch[1]}-${rutMatch[2].toUpperCase()}`;
    };

    const parseNameFromText = (data: string) => {
        const lines = data.split(/\\r?\\n|;/).map(l => l.trim()).filter(Boolean);
        // Heurística: línea más larga en mayúsculas
        const upperLines = lines.filter(l => /^[A-ZÁÉÍÓÚÑ\\s]+$/.test(l) && l.length > 5);
        if (upperLines.length > 0) {
            return upperLines.sort((a, b) => b.length - a.length)[0];
        }
        // fallback: primera línea
        return lines[0] || '';
    };

    const handleIdScan = (data: string) => {
        const rut = parseRutFromText(data);
        const name = parseNameFromText(data);
        if (!rut) {
            Alert.alert('No se detectó RUT', 'Intenta nuevamente o ingresa los datos manualmente.');
        }
        setNewWorker({
            name: name || newWorker.name,
            rut: rut || newWorker.rut,
        });
        setIdentityChecked(true);
        setScannerMode(null);
    };

    const handleScan = (data: string, type?: string) => {
        console.log('[SCAN] mode:', scannerMode, 'type:', type, 'data:', data);
        if (scannerMode === 'card') {
            handleCardScan(data);
        } else if (scannerMode === 'id') {
            handleIdScan(data);
        }
    };

    const createWorker = async () => {
        if (!newWorker.name.trim()) {
            Alert.alert('Falta nombre', 'Ingresa el nombre del jornalero');
            return;
        }
        const db = await getDB();
        const result = await db.runAsync(
            'INSERT INTO workers (name, rut, is_identity_validated, synced) VALUES (?, ?, 1, 0)',
            newWorker.name.trim(),
            newWorker.rut.trim()
        );
        setNewWorker({ name: '', rut: '' });
        await loadWorkers();
        const insertedId = result.lastInsertRowId;
        const worker: any = await db.getFirstAsync('SELECT * FROM workers WHERE id = ?', insertedId);
        if (worker) {
            setSelectedWorker(worker as Worker);
            setIdentityChecked(true);
            setScannerMode('card');
        }
    };

    const renderChipRow = <T extends { id: number; name: string }>(data: T[], selectedId: number | null, onSelect: (id: number) => void) => (
        <View style={styles.chipContainer}>
            {data.map((item) => {
                const selected = selectedId === item.id;
                return (
                    <TouchableOpacity
                        key={item.id}
                        style={[styles.chip, selected && styles.chipSelected]}
                        onPress={() => onSelect(item.id)}
                    >
                        <Text style={[styles.chipText, selected && { color: COLORS.white }]}>{item.name}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    return (
        <View style={globalStyles.container}>
            <ScreenHeader title="Asignar Tarjetas" onBack={onBack} />

            {scannerMode === 'card' ? (
                <Scanner onScanned={handleScan} onClose={() => setScannerMode(null)} showDebug />
            ) : (
                <>
                    <View style={[globalStyles.card, { marginBottom: 12 }]}>
                        <View style={styles.identityRow}>
                            <Text style={styles.identityLabel}>Asignar / Desasignar</Text>
                            <Switch value={assignMode} onValueChange={handleAssignModeChange} />
                        </View>
                    </View>

                    {assignMode ? (
                        <>
                            <Text style={globalStyles.subtitle}>Seleccione Trabajador:</Text>
                            {selectedWorker ? (
                                <ScrollView style={globalStyles.card} contentContainerStyle={{ paddingBottom: 12 }}>
                                    <Text style={[globalStyles.text, { fontSize: 20, marginBottom: 20, fontWeight: 'bold', textAlign: 'center' }]}>
                                        {selectedWorker.name}
                                    </Text>

                                    <View style={styles.identityRow}>
                                        <Text style={styles.identityLabel}>Identidad verificada</Text>
                                        <Switch value={identityChecked} onValueChange={setIdentityChecked} />
                                    </View>

                                    <Text style={styles.sectionLabel}>Campo</Text>
                                    {renderChipRow(fields, selectedField?.id ?? null, (id) => {
                                        const field = fields.find((f) => f.id === id) || null;
                                        setSelectedField(field);
                                    })}

                                    <Text style={styles.sectionLabel}>Tipo de tarea</Text>
                                    <TouchableOpacity
                                        style={styles.dropdownButton}
                                        onPress={() => setShowTaskTypes((prev) => !prev)}
                                    >
                                        <Text style={styles.dropdownButtonText}>
                                            {selectedTaskType?.name || 'Seleccionar tipo de tarea'}
                                        </Text>
                                    </TouchableOpacity>
                                    {showTaskTypes && (
                                        <View style={styles.dropdownList}>
                                            <ScrollView>
                                                {taskTypes.map((task) => (
                                                    <TouchableOpacity
                                                        key={task.id}
                                                        style={styles.dropdownItem}
                                                        onPress={() => {
                                                            setSelectedTaskType(task);
                                                            setShowTaskTypes(false);
                                                        }}
                                                    >
                                                        <Text style={styles.dropdownItemText}>{task.name}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        </View>
                                    )}

                                    <TouchableOpacity style={globalStyles.button} onPress={() => setScannerMode('card')}>
                                        <Text style={globalStyles.buttonText}>ESCANEAR TARJETA</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={[globalStyles.secondaryButton, { marginTop: 10 }]} onPress={() => setSelectedWorker(null)}>
                                        <Text style={globalStyles.secondaryButtonText}>Cambiar Trabajador</Text>
                                    </TouchableOpacity>
                                </ScrollView>
                            ) : (
                                <>
                                    <View style={globalStyles.card}>
                                        <Text style={globalStyles.subtitle}>Nuevo Jornalero rápido</Text>
                                        <TextInput
                                            style={globalStyles.input}
                                            placeholder="Nombre"
                                            value={newWorker.name}
                                            onChangeText={(value) => setNewWorker({ ...newWorker, name: value })}
                                        />
                                        <TextInput
                                            style={globalStyles.input}
                                            placeholder="RUT / ID"
                                            value={newWorker.rut}
                                            onChangeText={(value) => setNewWorker({ ...newWorker, rut: value })}
                                        />
                                        <TouchableOpacity style={globalStyles.button} onPress={createWorker}>
                                            <Text style={globalStyles.buttonText}>Crear y asignar</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <FlatList
                                        data={workers}
                                        keyExtractor={(item) => item.id.toString()}
                                        contentContainerStyle={{ paddingBottom: 20 }}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity style={[globalStyles.card, { padding: 20 }]} onPress={() => { setSelectedWorker(item); setIdentityChecked(false); }}>
                                                <Text style={[globalStyles.text, { fontSize: 18 }]}>{item.name}</Text>
                                                <Text style={[globalStyles.text, { fontSize: 12, color: COLORS.textSecondary }]}>
                                                    {item.rut || 'Sin RUT'} {item.is_identity_validated ? '• Validado' : ''}
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    />
                                </>
                            )}
                        </>
                    ) : (
                        <View style={globalStyles.card}>
                            <Text style={globalStyles.subtitle}>Desasignación por tarjeta</Text>
                            <Text style={[globalStyles.text, { marginBottom: 16 }]}>
                                Escanea la tarjeta y se desasignará automáticamente del trabajador actual.
                            </Text>
                            <TouchableOpacity style={globalStyles.button} onPress={() => setScannerMode('card')}>
                                <Text style={globalStyles.buttonText}>ESCANEAR TARJETA</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    identityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    identityLabel: {
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '600',
    },
    sectionLabel: {
        marginTop: 8,
        marginBottom: 6,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.white,
    },
    chipSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    chipText: {
        color: COLORS.text,
        fontWeight: '600',
    },
    dropdownButton: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: COLORS.white,
        marginBottom: 8,
    },
    dropdownButtonText: {
        color: COLORS.text,
        fontWeight: '600',
    },
    dropdownList: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        backgroundColor: COLORS.white,
        marginBottom: 12,
        maxHeight: 220,
    },
    dropdownItem: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    dropdownItemText: {
        color: COLORS.text,
    },
});

import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, Switch, ScrollView } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getDB } from '../db/database';
import { COLORS, globalStyles } from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import Scanner from '../components/Scanner';
import { Worker, Field, TaskType } from '../types';

type WorkerForm = {
    id?: number | null;
    name: string;
    rut: string;
    contractor_id: number | null;
    card_id: number | null;
};

type WorkerRow = Worker & {
    card_id?: number | null;
    card_code?: string | null;
};

export default function WorkersScreen({ onBack }: { onBack: () => void }) {
    const [workers, setWorkers] = useState<WorkerRow[]>([]);
    const [contractors, setContractors] = useState<{ id: number; name: string }[]>([]);
    const [cards, setCards] = useState<{ id: number; code: string }[]>([]);
    const [fields, setFields] = useState<Field[]>([]);
    const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
    const [form, setForm] = useState<WorkerForm>({ name: '', rut: '', contractor_id: null, card_id: null });
    const [scannerMode, setScannerMode] = useState<'card' | null>(null);
    const [markAttendanceOnSave, setMarkAttendanceOnSave] = useState(false);
    const [attendanceFieldId, setAttendanceFieldId] = useState<number | null>(null);
    const [attendanceTaskTypeId, setAttendanceTaskTypeId] = useState<number | null>(null);
    const [defaultFieldId, setDefaultFieldId] = useState<number | null>(null);
    const [showFieldDropdown, setShowFieldDropdown] = useState(false);
    const [showTaskTypeDropdown, setShowTaskTypeDropdown] = useState(false);
    const [fieldSearch, setFieldSearch] = useState('');
    const [taskTypeSearch, setTaskTypeSearch] = useState('');

    useEffect(() => {
        loadData();
        loadDefaultFieldFromUser();
    }, []);

    useEffect(() => {
        if (attendanceFieldId !== null) return;
        const fieldFromUser = defaultFieldId ? fields.find((f) => f.id === defaultFieldId) : null;
        if (fieldFromUser) {
            setAttendanceFieldId(fieldFromUser.id);
            return;
        }
        if (fields.length > 0) {
            setAttendanceFieldId(fields[0].id);
        }
    }, [defaultFieldId, fields, attendanceFieldId]);

    useEffect(() => {
        if (attendanceTaskTypeId !== null) return;
        if (taskTypes.length > 0) {
            setAttendanceTaskTypeId(taskTypes[0].id);
        }
    }, [taskTypes, attendanceTaskTypeId]);

    const loadData = async () => {
        const db = await getDB();
        const today = new Date().toISOString().split('T')[0];
        const w = await db.getAllAsync(
            `SELECT w.*, ca.card_id as card_id, c.code as card_code
             FROM workers w
             LEFT JOIN card_assignments ca ON ca.worker_id = w.id AND ca.date = ? AND ca.deleted_at IS NULL
             LEFT JOIN cards c ON c.id = ca.card_id
             ORDER BY w.name`,
            today
        );
        const c = await db.getAllAsync('SELECT * FROM contractors ORDER BY name');
        const cardsData = await db.getAllAsync('SELECT * FROM cards ORDER BY code');
        const fieldData = await db.getAllAsync('SELECT * FROM fields ORDER BY name');
        const taskTypeData = await db.getAllAsync('SELECT * FROM task_types ORDER BY name');
        setWorkers(w as WorkerRow[]);
        setContractors(c as any[]);
        setCards(cardsData as any[]);
        setFields(fieldData as Field[]);
        setTaskTypes(taskTypeData as TaskType[]);
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

    const saveWorker = async () => {
        if (!form.name.trim()) {
            Alert.alert('Falta nombre', 'Ingresa el nombre del jornalero');
            return;
        }
        if (!form.id && markAttendanceOnSave && !form.card_id) {
            Alert.alert('Falta tarjeta', 'Para registrar asistencia debes escanear una tarjeta.');
            return;
        }
        if (!form.id && markAttendanceOnSave && (!attendanceFieldId || !attendanceTaskTypeId)) {
            Alert.alert('Faltan datos', 'Selecciona campo y tipo de tarea para registrar asistencia.');
            return;
        }

        const db = await getDB();
        const today = new Date().toISOString().split('T')[0];

        if (!form.id && form.card_id) {
            const existingCardAssignment: any = await db.getFirstAsync(
                'SELECT worker_id FROM card_assignments WHERE card_id = ? AND date = ? AND deleted_at IS NULL',
                form.card_id,
                today
            );
            if (existingCardAssignment) {
                Alert.alert('Tarjeta ocupada', 'La tarjeta seleccionada ya está asignada hoy.');
                return;
            }
        }

        if (form.id) {
            await db.runAsync(
                'UPDATE workers SET name = ?, rut = ?, contractor_id = ?, synced = 0 WHERE id = ?',
                form.name.trim(),
                form.rut.trim(),
                form.contractor_id ?? null,
                form.id
            );
        } else {
            const result = await db.runAsync(
                'INSERT INTO workers (name, rut, contractor_id, synced) VALUES (?, ?, ?, 0)',
                form.name.trim(),
                form.rut.trim(),
                form.contractor_id ?? null
            );

            const workerId = Number(result.lastInsertRowId);
            if (form.card_id && workerId) {
                await db.runAsync(
                    'DELETE FROM card_assignments WHERE card_id = ? AND date = ?',
                    form.card_id,
                    today
                );
                await db.runAsync(
                    'INSERT INTO card_assignments (worker_id, card_id, date, deleted_at, synced) VALUES (?, ?, ?, NULL, 0)',
                    workerId,
                    form.card_id,
                    today
                );

                if (markAttendanceOnSave) {
                    const checkInTime = new Date().toLocaleTimeString();

                    const existingAttendance: any = await db.getFirstAsync(
                        'SELECT id FROM attendances WHERE worker_id = ? AND date = ?',
                        workerId,
                        today
                    );

                    if (existingAttendance) {
                        await db.runAsync(
                            'UPDATE attendances SET check_in_time = COALESCE(check_in_time, ?), field_id = ?, task_type_id = ?, synced = 0 WHERE id = ?',
                            checkInTime,
                            attendanceFieldId,
                            attendanceTaskTypeId,
                            existingAttendance.id
                        );
                    } else {
                        await db.runAsync(
                            'INSERT INTO attendances (worker_id, date, check_in_time, field_id, task_type_id, synced) VALUES (?, ?, ?, ?, ?, 0)',
                            workerId,
                            today,
                            checkInTime,
                            attendanceFieldId,
                            attendanceTaskTypeId
                        );
                    }
                }
            }
        }
        setForm({ id: null, name: '', rut: '', contractor_id: null, card_id: null });
        setMarkAttendanceOnSave(false);
        setShowFieldDropdown(false);
        setShowTaskTypeDropdown(false);
        setFieldSearch('');
        setTaskTypeSearch('');
        await loadData();
    };

    const startEdit = (worker: WorkerRow) => {
        setForm({
            id: worker.id,
            name: worker.name,
            rut: worker.rut,
            contractor_id: worker.contractor_id ?? null,
            card_id: null,
        });
        setMarkAttendanceOnSave(false);
        setShowFieldDropdown(false);
        setShowTaskTypeDropdown(false);
        setFieldSearch('');
        setTaskTypeSearch('');
    };

    const handleCardScan = async (code: string) => {
        setScannerMode(null);
        const scannedCode = code.trim();
        if (!scannedCode) {
            Alert.alert('Código inválido', 'No se pudo leer la tarjeta.');
            return;
        }

        const db = await getDB();
        const card: any = await db.getFirstAsync('SELECT id, code FROM cards WHERE code = ?', scannedCode);
        if (!card) {
            Alert.alert('Tarjeta no encontrada', 'La tarjeta escaneada no existe en la base local. Sincroniza e intenta de nuevo.');
            return;
        }

        setForm((prev) => ({ ...prev, card_id: card.id }));
        Alert.alert('Tarjeta seleccionada', `Se asignará la tarjeta ${card.code} al guardar el jornalero.`);
    };

    const filteredFields = fields.filter((item) =>
        item.name.toLowerCase().includes(fieldSearch.trim().toLowerCase())
    );
    const filteredTaskTypes = taskTypes.filter((item) =>
        item.name.toLowerCase().includes(taskTypeSearch.trim().toLowerCase())
    );

    return (
        <View style={globalStyles.container}>
            <ScreenHeader title="Mantenedor Jornaleros" onBack={onBack} />
            {scannerMode === 'card' ? (
                <Scanner onScanned={(data) => handleCardScan(data)} onClose={() => setScannerMode(null)} showDebug />
            ) : (
                <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                    <View style={globalStyles.card}>
                        <Text style={globalStyles.subtitle}>{form.id ? 'Editar Jornalero' : 'Nuevo Jornalero'}</Text>
                        <TextInput
                            style={globalStyles.input}
                            placeholder="Nombre"
                            value={form.name}
                            onChangeText={(value) => setForm({ ...form, name: value })}
                        />
                        <TextInput
                            style={globalStyles.input}
                            placeholder="RUT / ID"
                            value={form.rut}
                            onChangeText={(value) => setForm({ ...form, rut: value })}
                        />
                        <Text style={styles.label}>Contratista</Text>
                        <View style={styles.chipContainer}>
                            {contractors.map((c) => {
                                const selected = form.contractor_id === c.id;
                                return (
                                    <TouchableOpacity
                                        key={c.id}
                                        style={[styles.chip, selected && styles.chipSelected]}
                                        onPress={() => setForm({ ...form, contractor_id: c.id })}
                                    >
                                        <Text style={[styles.chipText, selected && { color: COLORS.white }]}>{c.name}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                            {contractors.length === 0 && (
                                <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>Sin contratistas cargados.</Text>
                            )}
                        </View>
                        {!form.id && (
                            <>
                                <Text style={styles.label}>Tarjeta (opcional)</Text>
                                <View style={styles.cardActions}>
                                    <TouchableOpacity style={[globalStyles.button, { flex: 1 }]} onPress={() => setScannerMode('card')}>
                                        <Text style={globalStyles.buttonText}>
                                            {form.card_id ? 'Escanear otra tarjeta' : 'Asignar tarjeta (scan)'}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[globalStyles.secondaryButton, styles.clearCardButton]}
                                        onPress={() => {
                                            setForm({ ...form, card_id: null });
                                            setMarkAttendanceOnSave(false);
                                            setShowFieldDropdown(false);
                                            setShowTaskTypeDropdown(false);
                                            setFieldSearch('');
                                            setTaskTypeSearch('');
                                        }}
                                    >
                                        <Text style={globalStyles.secondaryButtonText}>Quitar</Text>
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.helper}>
                                    Tarjeta seleccionada: {cards.find((card) => card.id === form.card_id)?.code || 'Sin tarjeta'}
                                </Text>
                                {form.card_id && (
                                    <View style={styles.switchRow}>
                                        <Text style={styles.switchLabel}>Tomar como asistencia al guardar</Text>
                                        <Switch
                                            value={markAttendanceOnSave}
                                            onValueChange={(value) => {
                                                setMarkAttendanceOnSave(value);
                                                if (!value) {
                                                    setShowFieldDropdown(false);
                                                    setShowTaskTypeDropdown(false);
                                                }
                                            }}
                                        />
                                    </View>
                                )}
                                {form.card_id && markAttendanceOnSave && (
                                    <>
                                        <Text style={styles.label}>Campo</Text>
                                        <TouchableOpacity
                                            style={styles.dropdownButton}
                                            onPress={() => {
                                                setShowFieldDropdown((prev) => !prev);
                                                setShowTaskTypeDropdown(false);
                                            }}
                                        >
                                            <Text style={styles.dropdownButtonText}>
                                                {fields.find((f) => f.id === attendanceFieldId)?.name || 'Seleccionar campo'}
                                            </Text>
                                        </TouchableOpacity>
                                        {showFieldDropdown && (
                                            <View style={styles.dropdownList}>
                                                <TextInput
                                                    style={styles.searchInput}
                                                    placeholder="Buscar campo..."
                                                    value={fieldSearch}
                                                    onChangeText={setFieldSearch}
                                                />
                                                <ScrollView style={styles.dropdownScroll}>
                                                    {filteredFields.map((field) => (
                                                        <TouchableOpacity
                                                            key={field.id}
                                                            style={styles.dropdownItem}
                                                            onPress={() => {
                                                                setAttendanceFieldId(field.id);
                                                                setShowFieldDropdown(false);
                                                                setFieldSearch('');
                                                            }}
                                                        >
                                                            <Text style={styles.dropdownItemText}>{field.name}</Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                    {filteredFields.length === 0 && (
                                                        <Text style={styles.dropdownEmpty}>Sin resultados</Text>
                                                    )}
                                                </ScrollView>
                                            </View>
                                        )}

                                        <Text style={styles.label}>Tipo de tarea</Text>
                                        <TouchableOpacity
                                            style={styles.dropdownButton}
                                            onPress={() => {
                                                setShowTaskTypeDropdown((prev) => !prev);
                                                setShowFieldDropdown(false);
                                            }}
                                        >
                                            <Text style={styles.dropdownButtonText}>
                                                {taskTypes.find((t) => t.id === attendanceTaskTypeId)?.name || 'Seleccionar tipo de tarea'}
                                            </Text>
                                        </TouchableOpacity>
                                        {showTaskTypeDropdown && (
                                            <View style={styles.dropdownList}>
                                                <TextInput
                                                    style={styles.searchInput}
                                                    placeholder="Buscar tipo de tarea..."
                                                    value={taskTypeSearch}
                                                    onChangeText={setTaskTypeSearch}
                                                />
                                                <ScrollView style={styles.dropdownScroll}>
                                                    {filteredTaskTypes.map((taskType) => (
                                                        <TouchableOpacity
                                                            key={taskType.id}
                                                            style={styles.dropdownItem}
                                                            onPress={() => {
                                                                setAttendanceTaskTypeId(taskType.id);
                                                                setShowTaskTypeDropdown(false);
                                                                setTaskTypeSearch('');
                                                            }}
                                                        >
                                                            <Text style={styles.dropdownItemText}>{taskType.name}</Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                    {filteredTaskTypes.length === 0 && (
                                                        <Text style={styles.dropdownEmpty}>Sin resultados</Text>
                                                    )}
                                                </ScrollView>
                                            </View>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity
                                style={[globalStyles.secondaryButton, { flex: 1 }]}
                                onPress={() => {
                                    setForm({ id: null, name: '', rut: '', contractor_id: null, card_id: null });
                                    setMarkAttendanceOnSave(false);
                                    setShowFieldDropdown(false);
                                    setShowTaskTypeDropdown(false);
                                    setFieldSearch('');
                                    setTaskTypeSearch('');
                                }}
                            >
                                <Text style={globalStyles.secondaryButtonText}>Limpiar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[globalStyles.button, { flex: 1 }]} onPress={saveWorker}>
                                <Text style={globalStyles.buttonText}>Guardar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={globalStyles.card}>
                        <Text style={globalStyles.subtitle}>Jornaleros</Text>
                        <FlatList
                            data={workers}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.row} onPress={() => startEdit(item)}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.title}>{item.name}</Text>
                                        <Text style={styles.subtitle}>{item.rut || 'Sin RUT'}</Text>
                                        <Text style={styles.meta}>
                                            Contratista: {contractors.find((c) => c.id === item.contractor_id)?.name || 'N/D'}
                                        </Text>
                                        <Text style={styles.meta}>Tarjeta hoy: {item.card_code || 'Sin tarjeta'}</Text>
                                    </View>
                                    <View style={[styles.badge, item.synced ? styles.badgeSynced : styles.badgePending]}>
                                        <Text style={[styles.badgeText, item.synced ? styles.badgeTextSynced : styles.badgeTextPending]}>
                                            {item.synced ? 'Synced' : 'Pendiente'}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={<Text style={styles.empty}>No hay jornaleros.</Text>}
                        />
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    label: {
        marginBottom: 4,
        color: COLORS.textSecondary,
    },
    helper: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginTop: 4,
        marginBottom: 12,
    },
    cardActions: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 4,
    },
    clearCardButton: {
        minWidth: 90,
        justifyContent: 'center',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
        marginBottom: 12,
    },
    switchLabel: {
        color: COLORS.text,
        fontWeight: '600',
        marginRight: 12,
        flex: 1,
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
        overflow: 'hidden',
    },
    searchInput: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: COLORS.text,
    },
    dropdownScroll: {
        maxHeight: 180,
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
    dropdownEmpty: {
        color: COLORS.textSecondary,
        textAlign: 'center',
        paddingVertical: 12,
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
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
    },
    subtitle: {
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    meta: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginTop: 4,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        marginLeft: 8,
    },
    badgeSynced: {
        backgroundColor: 'rgba(46, 125, 50, 0.15)',
    },
    badgePending: {
        backgroundColor: 'rgba(255, 152, 0, 0.15)',
    },
    badgeText: {
        fontWeight: '700',
    },
    badgeTextSynced: {
        color: COLORS.success,
    },
    badgeTextPending: {
        color: COLORS.accent,
    },
    empty: {
        textAlign: 'center',
        color: COLORS.textSecondary,
        marginTop: 12,
    },
});

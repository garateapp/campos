import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getDB } from '../db/database';
import Scanner from '../components/Scanner';
import { Field } from '../types';
import { COLORS, globalStyles } from '../theme';

import ScreenHeader from '../components/ScreenHeader';

export default function AttendanceScreen({ onBack }: { onBack: () => void }) {
    const [fields, setFields] = useState<Field[]>([]);
    const [selectedField, setSelectedField] = useState<Field | null>(null);
    const [defaultFieldId, setDefaultFieldId] = useState<number | null>(null);
    const [hasAppliedDefaultField, setHasAppliedDefaultField] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [isLoadingFields, setIsLoadingFields] = useState(false);

    // ... (rest of the state and logic)

    useEffect(() => {
        loadDefaultFieldFromUser();
        loadFields();
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

    const loadFields = async () => {
        setIsLoadingFields(true);
        try {
            const db = await getDB();

            const result = await db.getAllAsync('SELECT id, name FROM fields ORDER BY name');
            if ((result as any[]).length > 0) {
                setFields(result as Field[]);
                return;
            }

            // Fallback: infer field ids from crops if fields catalog is empty.
            const fallback = await db.getAllAsync(`
                SELECT DISTINCT
                    c.field_id AS id,
                    COALESCE(f.name, 'Campo #' || c.field_id) AS name
                FROM crops c
                LEFT JOIN fields f ON f.id = c.field_id
                WHERE c.field_id IS NOT NULL
                ORDER BY name
            `);
            setFields(fallback as Field[]);
        } finally {
            setIsLoadingFields(false);
        }
    };

    const handleScan = async (code: string) => {
        // ... (Scan logic remains same)
        setShowScanner(false);
        if (!selectedField) return;

        const db = await getDB();

        // 1. Resolve Card -> Worker
        const cardRes: any = await db.getFirstAsync('SELECT id FROM cards WHERE code = ?', code);
        if (!cardRes) {
            Alert.alert('Error', 'Card not found');
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        const assignment: any = await db.getFirstAsync(
            'SELECT worker_id FROM card_assignments WHERE card_id = ? AND date = ? AND deleted_at IS NULL',
            cardRes.id, today
        );

        if (!assignment) {
            Alert.alert('Error', 'Card not assigned for today');
            return;
        }

        // 2. Check duplicate attendance
        const exists: any = await db.getFirstAsync(
            'SELECT id FROM attendances WHERE worker_id = ? AND date = ?',
            assignment.worker_id, today
        );

        if (exists) {
            Alert.alert('Warning', 'Worker already present');
            return;
        }

        // 3. Save
        const time = new Date().toLocaleTimeString();
        try {
            await db.runAsync(
                'INSERT INTO attendances (worker_id, date, check_in_time, field_id, task_type_id, synced) VALUES (?, ?, ?, ?, ?, 0)',
                assignment.worker_id, today, time, selectedField.id, 1
            );
            Alert.alert('Success', 'Attendance recorded!');
        } catch (e) {
            Alert.alert('Error', 'Failed to save');
        }
    };

    return (
        <View style={globalStyles.container}>
            <ScreenHeader title="Asistencia" onBack={onBack} />

            {showScanner ? (
                <Scanner onScanned={handleScan} onClose={() => setShowScanner(false)} />
            ) : (
                <>
                    <Text style={globalStyles.subtitle}>Seleccione Campo:</Text>
                    {selectedField ? (
                        <View style={globalStyles.card}>
                            <Text style={[globalStyles.text, { fontSize: 20, marginBottom: 20, fontWeight: 'bold', textAlign: 'center' }]}>
                                {selectedField.name}
                            </Text>

                            <TouchableOpacity style={globalStyles.button} onPress={() => setShowScanner(true)}>
                                <Text style={globalStyles.buttonText}>ESCANEAR TARJETA</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[globalStyles.secondaryButton, { marginTop: 10 }]} onPress={() => setSelectedField(null)}>
                                <Text style={globalStyles.secondaryButtonText}>Cambiar Campo</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            {isLoadingFields ? (
                                <View style={styles.loadingBox}>
                                    <ActivityIndicator size="large" color={COLORS.primary} />
                                    <Text style={styles.helperText}>Cargando campos...</Text>
                                </View>
                            ) : (
                                <FlatList
                                    data={fields}
                                    keyExtractor={(item) => item.id.toString()}
                                    contentContainerStyle={{ paddingBottom: 20 }}
                                    ListEmptyComponent={
                                        <View style={globalStyles.card}>
                                            <Text style={[globalStyles.text, { textAlign: 'center' }]}>
                                                No hay campos disponibles en este dispositivo.
                                            </Text>
                                            <Text style={styles.helperText}>
                                                Sincroniza desde el inicio y luego recarga.
                                            </Text>
                                            <TouchableOpacity style={globalStyles.button} onPress={loadFields}>
                                                <Text style={globalStyles.buttonText}>RECARGAR CAMPOS</Text>
                                            </TouchableOpacity>
                                        </View>
                                    }
                                    renderItem={({ item }) => (
                                        <TouchableOpacity style={[globalStyles.card, { padding: 20 }]} onPress={() => setSelectedField(item)}>
                                            <Text style={[globalStyles.text, { fontSize: 18 }]}>{item.name}</Text>
                                        </TouchableOpacity>
                                    )}
                                />
                            )}
                        </>
                    )}
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    loadingBox: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 30,
    },
    helperText: {
        marginTop: 10,
        textAlign: 'center',
        color: COLORS.textSecondary,
    },
});

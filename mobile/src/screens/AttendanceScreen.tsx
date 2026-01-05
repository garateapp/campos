import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert } from 'react-native';
import { getDB } from '../db/database';
import Scanner from '../components/Scanner';
import { Field } from '../types';
import { COLORS, globalStyles } from '../theme';

import ScreenHeader from '../components/ScreenHeader';

export default function AttendanceScreen({ onBack }: { onBack: () => void }) {
    const [fields, setFields] = useState<Field[]>([]);
    const [selectedField, setSelectedField] = useState<Field | null>(null);
    const [showScanner, setShowScanner] = useState(false);

    // ... (rest of the state and logic)

    useEffect(() => {
        loadFields();
    }, []);

    const loadFields = async () => {
        const db = await getDB();
        const result = await db.getAllAsync('SELECT * FROM fields ORDER BY name');
        setFields(result as Field[]);
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
            'SELECT worker_id FROM card_assignments WHERE card_id = ? AND date = ?',
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
                    <Text style={globalStyles.subtitle}>Seleccione Cuartel (Field):</Text>
                    {selectedField ? (
                        <View style={globalStyles.card}>
                            <Text style={[globalStyles.text, { fontSize: 20, marginBottom: 20, fontWeight: 'bold', textAlign: 'center' }]}>
                                {selectedField.name}
                            </Text>

                            <TouchableOpacity style={globalStyles.button} onPress={() => setShowScanner(true)}>
                                <Text style={globalStyles.buttonText}>ESCANEAR TARJETA</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[globalStyles.secondaryButton, { marginTop: 10 }]} onPress={() => setSelectedField(null)}>
                                <Text style={globalStyles.secondaryButtonText}>Cambiar Cuartel</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <FlatList
                            data={fields}
                            keyExtractor={(item) => item.id.toString()}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={[globalStyles.card, { padding: 20 }]} onPress={() => setSelectedField(item)}>
                                    <Text style={[globalStyles.text, { fontSize: 18 }]}>{item.name}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({});

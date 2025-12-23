import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert } from 'react-native';
import { getDB } from '../db/database';
import Scanner from '../components/Scanner';
import { Worker } from '../types';
import { COLORS, globalStyles } from '../theme';

export default function AssignmentScreen({ onBack }: { onBack: () => void }) {
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
    const [showScanner, setShowScanner] = useState(false);

    useEffect(() => {
        loadWorkers();
    }, []);

    const loadWorkers = async () => {
        const db = await getDB();
        const result = await db.getAllAsync('SELECT * FROM workers ORDER BY name');
        setWorkers(result as Worker[]);
    };

    const handleScan = async (code: string) => {
        setShowScanner(false);
        if (!selectedWorker) return;

        // 1. Find Card ID locally
        const db = await getDB();
        const cardResult: any = await db.getFirstAsync('SELECT id FROM cards WHERE code = ?', code);

        if (!cardResult) {
            Alert.alert('Error', 'Card not found in database. Please Sync.');
            return;
        }

        const today = new Date().toISOString().split('T')[0];

        // 2. Save Assignment
        try {
            await db.runAsync(
                'INSERT INTO card_assignments (worker_id, card_id, date, synced) VALUES (?, ?, ?, 0)',
                selectedWorker.id, cardResult.id, today
            );
            Alert.alert('Success', `Card ${code} assigned to ${selectedWorker.name}`);
            setSelectedWorker(null);
        } catch (e) {
            Alert.alert('Error', 'Failed to save assignment');
        }
    };

    return (
        <View style={globalStyles.container}>
            <View style={{ marginBottom: 20 }}>
                <TouchableOpacity onPress={onBack} style={{ padding: 10 }}>
                    <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>← Volver</Text>
                </TouchableOpacity>
                <Text style={globalStyles.title}>Asignar Tarjetas</Text>
            </View>

            {showScanner ? (
                <Scanner onScanned={handleScan} onClose={() => setShowScanner(false)} />
            ) : (
                <>
                    <Text style={globalStyles.subtitle}>Seleccione Trabajador:</Text>
                    {selectedWorker ? (
                        <View style={globalStyles.card}>
                            <Text style={[globalStyles.text, { fontSize: 20, marginBottom: 20, fontWeight: 'bold', textAlign: 'center' }]}>
                                {selectedWorker.name}
                            </Text>

                            <TouchableOpacity style={globalStyles.button} onPress={() => setShowScanner(true)}>
                                <Text style={globalStyles.buttonText}>ESCANEAR TARJETA</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[globalStyles.secondaryButton, { marginTop: 10 }]} onPress={() => setSelectedWorker(null)}>
                                <Text style={globalStyles.secondaryButtonText}>Cambiar Trabajador</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <FlatList
                            data={workers}
                            keyExtractor={(item) => item.id.toString()}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={[globalStyles.card, { padding: 20 }]} onPress={() => setSelectedWorker(item)}>
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

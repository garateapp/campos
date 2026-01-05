import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, Switch, TextInput } from 'react-native';
import { getDB } from '../db/database';
import Scanner from '../components/Scanner';
import { Worker } from '../types';
import { COLORS, globalStyles } from '../theme';

import ScreenHeader from '../components/ScreenHeader';

export default function AssignmentScreen({ onBack }: { onBack: () => void }) {
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
    const [scannerMode, setScannerMode] = useState<'card' | null>(null);
    const [identityChecked, setIdentityChecked] = useState(false);
    const [newWorker, setNewWorker] = useState({ name: '', rut: '' });

    useEffect(() => {
        loadWorkers();
    }, []);

    const loadWorkers = async () => {
        const db = await getDB();
        const result = await db.getAllAsync('SELECT * FROM workers ORDER BY name');
        setWorkers(result as Worker[]);
    };

    const handleCardScan = async (code: string) => {
        if (!identityChecked) {
            Alert.alert('Validación requerida', 'Confirma la identidad del jornalero antes de asignar.');
            return;
        }
        if (!selectedWorker) return;

        const db = await getDB();
        const cardResult: any = await db.getFirstAsync('SELECT id FROM cards WHERE code = ?', code);

        if (!cardResult) {
            Alert.alert('Error', 'Card not found in database. Please Sync.');
            return;
        }

        const today = new Date().toISOString().split('T')[0];

        try {
            await db.runAsync(
                'INSERT INTO card_assignments (worker_id, card_id, date, synced) VALUES (?, ?, ?, 0)',
                selectedWorker.id, cardResult.id, today
            );
            // opcional: marcar trabajador como validado
            await db.runAsync('UPDATE workers SET is_identity_validated = 1, synced = 0 WHERE id = ?', selectedWorker.id);

            Alert.alert('Success', `Card ${code} assigned to ${selectedWorker.name}`);
            setSelectedWorker(null);
            setIdentityChecked(false);
            setScannerMode(null);
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
        const insertedId = result.lastInsertRowId || result.insertId;
        const worker: any = await db.getFirstAsync('SELECT * FROM workers WHERE id = ?', insertedId);
        if (worker) {
            setSelectedWorker(worker as Worker);
            setIdentityChecked(true);
            setScannerMode('card');
        }
    };

    return (
        <View style={globalStyles.container}>
            <ScreenHeader title="Asignar Tarjetas" onBack={onBack} />

            {scannerMode === 'card' ? (
                <Scanner onScanned={handleScan} onClose={() => setScannerMode(null)} showDebug />
            ) : (
                <>
                    <Text style={globalStyles.subtitle}>Seleccione Trabajador:</Text>
                    {selectedWorker ? (
                        <View style={globalStyles.card}>
                            <Text style={[globalStyles.text, { fontSize: 20, marginBottom: 20, fontWeight: 'bold', textAlign: 'center' }]}>
                                {selectedWorker.name}
                            </Text>

                            <View style={styles.identityRow}>
                                <Text style={styles.identityLabel}>Identidad verificada</Text>
                                <Switch value={identityChecked} onValueChange={setIdentityChecked} />
                            </View>

                            <TouchableOpacity style={globalStyles.button} onPress={() => setScannerMode('card')}>
                                <Text style={globalStyles.buttonText}>ESCANEAR TARJETA</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[globalStyles.secondaryButton, { marginTop: 10 }]} onPress={() => setSelectedWorker(null)}>
                                <Text style={globalStyles.secondaryButtonText}>Cambiar Trabajador</Text>
                            </TouchableOpacity>
                        </View>
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
});

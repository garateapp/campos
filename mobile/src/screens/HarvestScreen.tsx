import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, TextInput } from 'react-native';
import { getDB } from '../db/database';
import Scanner from '../components/Scanner';
import { Field, Species, HarvestContainer } from '../types';
import { COLORS, globalStyles } from '../theme';

export default function HarvestScreen({ onBack }: { onBack: () => void }) {
    const [fields, setFields] = useState<Field[]>([]);
    const [selectedField, setSelectedField] = useState<Field | null>(null);

    const [containers, setContainers] = useState<HarvestContainer[]>([]);
    const [selectedContainer, setSelectedContainer] = useState<HarvestContainer | null>(null);

    const [quantity, setQuantity] = useState('1');
    const [showScanner, setShowScanner] = useState(false);

    // Steps: 0=Field, 1=Container, 2=Scanning
    const [step, setStep] = useState(0);

    useEffect(() => {
        loadContext();
    }, []);

    const loadContext = async () => {
        const db = await getDB();
        const fieldsRes = await db.getAllAsync('SELECT * FROM fields ORDER BY name');
        setFields(fieldsRes as Field[]);

        const containersRes = await db.getAllAsync('SELECT * FROM harvest_containers ORDER BY name');
        setContainers(containersRes as HarvestContainer[]);
    };

    const handleScan = async (code: string) => {
        setShowScanner(false);
        if (!selectedField || !selectedContainer) return;

        const db = await getDB();
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

        try {
            await db.runAsync(
                'INSERT INTO harvest_collections (worker_id, date, harvest_container_id, quantity, field_id, synced) VALUES (?, ?, ?, ?, ?, 0)',
                assignment.worker_id, today, selectedContainer.id, parseInt(quantity) || 1, selectedField.id
            );
            Alert.alert('Success', `Registered +${quantity}`);
        } catch (e) {
            Alert.alert('Error', 'Failed to save');
        }
    };

    const renderFieldSelection = () => (
        <>
            <Text style={globalStyles.subtitle}>Seleccione Cuartel:</Text>
            <FlatList
                data={fields}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingBottom: 20 }}
                renderItem={({ item }) => (
                    <TouchableOpacity style={[globalStyles.card, { padding: 20 }]} onPress={() => { setSelectedField(item); setStep(1); }}>
                        <Text style={[globalStyles.text, { fontSize: 18 }]}>{item.name}</Text>
                    </TouchableOpacity>
                )}
            />
        </>
    );

    const renderContainerSelection = () => (
        <>
            <TouchableOpacity onPress={() => setStep(0)} style={{ marginBottom: 10 }}>
                <Text style={{ color: COLORS.primary }}>← Cambiar Cuartel</Text>
            </TouchableOpacity>
            <Text style={globalStyles.subtitle}>Seleccione Envase:</Text>
            <FlatList
                data={containers}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingBottom: 20 }}
                renderItem={({ item }) => (
                    <TouchableOpacity style={[globalStyles.card, { padding: 20 }]} onPress={() => { setSelectedContainer(item); setStep(2); }}>
                        <Text style={[globalStyles.text, { fontSize: 18 }]}>{item.name}</Text>
                    </TouchableOpacity>
                )}
            />
        </>
    );

    const renderScanning = () => (
        <View style={globalStyles.card}>
            <View style={{ marginBottom: 20 }}>
                <Text style={[globalStyles.text, { fontWeight: 'bold' }]}>Cuartel: {selectedField?.name}</Text>
                <Text style={[globalStyles.text, { fontWeight: 'bold' }]}>Envase: {selectedContainer?.name}</Text>
            </View>

            <Text style={globalStyles.text}>Cantidad a sumar:</Text>
            <TextInput
                style={[globalStyles.input, { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginVertical: 10 }]}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
            />

            <TouchableOpacity style={globalStyles.button} onPress={() => setShowScanner(true)}>
                <Text style={globalStyles.buttonText}>ESCANEAR TARJETA</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[globalStyles.secondaryButton, { marginTop: 10 }]} onPress={() => setStep(0)}>
                <Text style={globalStyles.secondaryButtonText}>Cambiar Selección</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={globalStyles.container}>
            <View style={{ marginBottom: 20 }}>
                <TouchableOpacity onPress={onBack} style={{ padding: 10 }}>
                    <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>← Volver</Text>
                </TouchableOpacity>
                <Text style={globalStyles.title}>Recolección Cosecha</Text>
            </View>

            {showScanner ? (
                <Scanner onScanned={handleScan} onClose={() => setShowScanner(false)} />
            ) : (
                <>
                    {step === 0 && renderFieldSelection()}
                    {step === 1 && renderContainerSelection()}
                    {step === 2 && renderScanning()}
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({});

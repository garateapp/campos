import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { getDB } from '../db/database';
import { DirectCost, Field } from '../types';
import { COLORS, globalStyles } from '../theme';
import ScreenHeader from '../components/ScreenHeader';

type CostForm = {
    field_id: number | null;
    category: string;
    amount: string;
    date: string;
    notes: string;
};

export default function DirectCostsScreen({ onBack }: { onBack: () => void }) {
    const [fields, setFields] = useState<Field[]>([]);
    const [costs, setCosts] = useState<DirectCost[]>([]);
    const [form, setForm] = useState<CostForm>({
        field_id: null,
        category: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const db = await getDB();
        const f = await db.getAllAsync('SELECT * FROM fields ORDER BY name');
        const c = await db.getAllAsync('SELECT * FROM direct_costs ORDER BY date DESC');
        setFields(f as Field[]);
        setCosts(c as DirectCost[]);
    };

    const saveCost = async () => {
        if (!form.category.trim()) {
            Alert.alert('Falta categoría', 'Ingresa la categoría de costo');
            return;
        }
        const amount = parseFloat(form.amount) || 0;
        const db = await getDB();
        await db.runAsync(
            'INSERT INTO direct_costs (field_id, category, amount, date, notes) VALUES (?, ?, ?, ?, ?)',
            form.field_id ?? null,
            form.category.trim(),
            amount,
            form.date,
            form.notes.trim()
        );
        setForm({
            field_id: null,
            category: '',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            notes: '',
        });
        await loadData();
    };

    const renderFieldChips = () => (
        <View style={styles.chipContainer}>
            {fields.map((field) => {
                const selected = form.field_id === field.id;
                return (
                    <TouchableOpacity
                        key={field.id}
                        style={[styles.chip, selected && styles.chipSelected]}
                        onPress={() => setForm({ ...form, field_id: field.id })}
                    >
                        <Text style={[styles.chipText, selected && { color: COLORS.white }]}>{field.name}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    const totalCosts = costs.reduce((acc, item) => acc + (item.amount || 0), 0);

    return (
        <View style={globalStyles.container}>
            <ScreenHeader title="Costos Directos" onBack={onBack} />

            <View style={globalStyles.card}>
                <Text style={globalStyles.subtitle}>Agregar Costo</Text>
                <Text style={styles.label}>Cuartel</Text>
                {renderFieldChips()}
                <TextInput
                    style={globalStyles.input}
                    placeholder="Categoría (fertilizante, riego, etc.)"
                    value={form.category}
                    onChangeText={(value) => setForm({ ...form, category: value })}
                />
                <TextInput
                    style={globalStyles.input}
                    placeholder="Monto"
                    keyboardType="numeric"
                    value={form.amount}
                    onChangeText={(value) => setForm({ ...form, amount: value })}
                />
                <TextInput
                    style={globalStyles.input}
                    placeholder="Fecha (YYYY-MM-DD)"
                    value={form.date}
                    onChangeText={(value) => setForm({ ...form, date: value })}
                />
                <TextInput
                    style={globalStyles.input}
                    placeholder="Notas"
                    value={form.notes}
                    onChangeText={(value) => setForm({ ...form, notes: value })}
                />
                <TouchableOpacity style={globalStyles.button} onPress={saveCost}>
                    <Text style={globalStyles.buttonText}>Guardar Costo</Text>
                </TouchableOpacity>
            </View>

            <View style={globalStyles.card}>
                <Text style={globalStyles.subtitle}>Costos Registrados</Text>
                <FlatList
                    data={costs}
                    keyExtractor={(item) => (item.id || Math.random()).toString()}
                    renderItem={({ item }) => (
                        <View style={styles.listItem}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.itemTitle}>{item.category}</Text>
                                <Text style={styles.itemText}>Fecha: {item.date}</Text>
                                <Text style={styles.itemText}>
                                    Cuartel: {fields.find((f) => f.id === item.field_id)?.name || 'N/D'}
                                </Text>
                                {item.notes ? <Text style={styles.itemText}>Notas: {item.notes}</Text> : null}
                            </View>
                            <Text style={styles.itemBadge}>${item.amount?.toFixed(0) || 0}</Text>
                        </View>
                    )}
                    ListEmptyComponent={<Text style={styles.empty}>Aún no hay costos.</Text>}
                />
                <Text style={[styles.itemTitle, { marginTop: 8 }]}>Total: ${totalCosts.toFixed(0)}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    label: {
        marginBottom: 4,
        color: COLORS.textSecondary,
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
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    itemText: {
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    itemBadge: {
        backgroundColor: COLORS.accent,
        color: COLORS.white,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        overflow: 'hidden',
    },
    empty: {
        textAlign: 'center',
        color: COLORS.textSecondary,
        marginTop: 10,
    },
});

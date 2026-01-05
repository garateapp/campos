import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { getDB } from '../db/database';
import { SupplyItem, UnitOfMeasure } from '../types';
import { COLORS, globalStyles } from '../theme';
import ScreenHeader from '../components/ScreenHeader';

type SupplyForm = {
    name: string;
    unit: string;
    quantity: string;
    unit_cost: string;
};

export default function InventoryScreen({ onBack }: { onBack: () => void }) {
    const [supplies, setSupplies] = useState<SupplyItem[]>([]);
    const [units, setUnits] = useState<UnitOfMeasure[]>([]);
    const [form, setForm] = useState<SupplyForm>({
        name: '',
        unit: 'kg',
        quantity: '',
        unit_cost: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const db = await getDB();
        const rows = await db.getAllAsync('SELECT * FROM supplies ORDER BY name');
        const unitRows = await db.getAllAsync('SELECT * FROM unit_of_measures ORDER BY name');
        setSupplies(rows as SupplyItem[]);
        setUnits(unitRows as UnitOfMeasure[]);
    };

    const saveSupply = async () => {
        if (!form.name.trim()) {
            Alert.alert('Falta nombre', 'Ingresa el nombre del insumo');
            return;
        }
        const db = await getDB();
        await db.runAsync(
            'INSERT INTO supplies (name, unit, quantity, unit_cost) VALUES (?, ?, ?, ?)',
            form.name.trim(),
            form.unit.trim(),
            parseFloat(form.quantity) || 0,
            parseFloat(form.unit_cost) || 0
        );
        setForm({ name: '', unit: 'kg', quantity: '', unit_cost: '' });
        await loadData();
    };

    const totalInventoryValue = supplies.reduce((acc, item) => acc + (item.quantity || 0) * (item.unit_cost || 0), 0);

    return (
        <View style={globalStyles.container}>
            <ScreenHeader title="Inventario de Insumos" onBack={onBack} />

            <View style={globalStyles.card}>
                <Text style={globalStyles.subtitle}>Agregar Insumo</Text>
                <TextInput
                    style={globalStyles.input}
                    placeholder="Nombre"
                    value={form.name}
                    onChangeText={(value) => setForm({ ...form, name: value })}
                />
                <Text style={styles.label}>Unidad</Text>
                <View style={styles.chipContainer}>
                    {(units.length ? units : [{ id: 0, name: 'kg', code: 'kg' } as UnitOfMeasure]).map((u) => {
                        const selected = form.unit === (u.code || u.name);
                        return (
                            <TouchableOpacity
                                key={u.id}
                                style={[styles.chip, selected && styles.chipSelected]}
                                onPress={() => setForm({ ...form, unit: u.code || u.name || '' })}
                            >
                                <Text style={[styles.chipText, selected && { color: COLORS.white }]}>{u.code || u.name}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
                <TextInput
                    style={globalStyles.input}
                    placeholder="Cantidad"
                    keyboardType="numeric"
                    value={form.quantity}
                    onChangeText={(value) => setForm({ ...form, quantity: value })}
                />
                <TextInput
                    style={globalStyles.input}
                    placeholder="Costo Unitario"
                    keyboardType="numeric"
                    value={form.unit_cost}
                    onChangeText={(value) => setForm({ ...form, unit_cost: value })}
                />
                <TouchableOpacity style={globalStyles.button} onPress={saveSupply}>
                    <Text style={globalStyles.buttonText}>Guardar Insumo</Text>
                </TouchableOpacity>
            </View>

            <View style={globalStyles.card}>
                <Text style={globalStyles.subtitle}>Inventario</Text>
                <FlatList
                    data={supplies}
                    keyExtractor={(item) => (item.id || Math.random()).toString()}
                    renderItem={({ item }) => (
                        <View style={styles.listItem}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.itemTitle}>{item.name}</Text>
                                <Text style={styles.itemText}>Cantidad: {item.quantity || 0} {item.unit || ''}</Text>
                            </View>
                            <View>
                                <Text style={styles.itemBadge}>${item.unit_cost || 0}/{item.unit || ''}</Text>
                                <Text style={styles.itemText}>Valor: ${(item.quantity || 0) * (item.unit_cost || 0)}</Text>
                            </View>
                        </View>
                    )}
                    ListEmptyComponent={<Text style={styles.empty}>Aún no hay insumos.</Text>}
                />
                <Text style={[styles.itemTitle, { marginTop: 8 }]}>Valor inventario: ${totalInventoryValue.toFixed(0)}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
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
        backgroundColor: COLORS.secondary,
        color: COLORS.white,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        textAlign: 'center',
        overflow: 'hidden',
    },
    empty: {
        textAlign: 'center',
        color: COLORS.textSecondary,
        marginTop: 10,
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
    label: {
        marginBottom: 4,
        color: COLORS.textSecondary,
    },
});

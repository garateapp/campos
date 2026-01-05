import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { getDB } from '../db/database';
import { Field, ProfitabilityEntry } from '../types';
import { COLORS, globalStyles } from '../theme';
import ScreenHeader from '../components/ScreenHeader';

type GroupRow = { field_id: number | null; total: number };

export default function ProfitabilityScreen({ onBack }: { onBack: () => void }) {
    const [fields, setFields] = useState<Field[]>([]);
    const [entries, setEntries] = useState<ProfitabilityEntry[]>([]);
    const [unitPrice, setUnitPrice] = useState('0');
    const [costMap, setCostMap] = useState<Record<number, number>>({});
    const [harvestMap, setHarvestMap] = useState<Record<number, number>>({});

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (fields.length) recompute();
    }, [unitPrice, fields, costMap, harvestMap]);

    const loadData = async () => {
        const db = await getDB();
        const fieldRows = await db.getAllAsync('SELECT * FROM fields ORDER BY name');
        const costRows = await db.getAllAsync('SELECT field_id, SUM(amount) as total FROM direct_costs GROUP BY field_id');
        const harvestRows = await db.getAllAsync('SELECT field_id, SUM(quantity) as total FROM harvest_collections GROUP BY field_id');

        const costDict: Record<number, number> = {};
        (costRows as GroupRow[]).forEach((row) => {
            if (row.field_id !== null) costDict[row.field_id] = Number(row.total) || 0;
        });

        const harvestDict: Record<number, number> = {};
        (harvestRows as GroupRow[]).forEach((row) => {
            if (row.field_id !== null) harvestDict[row.field_id] = Number(row.total) || 0;
        });

        setFields(fieldRows as Field[]);
        setCostMap(costDict);
        setHarvestMap(harvestDict);
    };

    const recompute = () => {
        const price = parseFloat(unitPrice) || 0;
        const list = fields.map<ProfitabilityEntry>((field) => {
            const costs = costMap[field.id] || 0;
            const harvestQty = harvestMap[field.id] || 0;
            const revenue = harvestQty * price;
            const margin = revenue - costs;
            return {
                field_id: field.id,
                field_name: field.name,
                total_costs: costs,
                harvest_quantity: harvestQty,
                revenue,
                margin,
            };
        });
        setEntries(list);
    };

    const totalCosts = entries.reduce((sum, i) => sum + i.total_costs, 0);
    const totalRevenue = entries.reduce((sum, i) => sum + i.revenue, 0);
    const totalMargin = totalRevenue - totalCosts;

    return (
        <View style={globalStyles.container}>
            <ScreenHeader title="Rentabilidad por Sector" onBack={onBack} />

            <View style={globalStyles.card}>
                <Text style={globalStyles.subtitle}>Supuestos</Text>
                <Text style={styles.label}>Precio unitario estimado (por unidad cosechada)</Text>
                <TextInput
                    style={globalStyles.input}
                    keyboardType="numeric"
                    value={unitPrice}
                    onChangeText={setUnitPrice}
                    placeholder="Precio"
                />
                <TouchableOpacity style={globalStyles.secondaryButton} onPress={loadData}>
                    <Text style={globalStyles.secondaryButtonText}>Actualizar datos</Text>
                </TouchableOpacity>
            </View>

            <View style={globalStyles.card}>
                <Text style={globalStyles.subtitle}>Sectores</Text>
                <FlatList
                    data={entries}
                    keyExtractor={(item) => item.field_id.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.listItem}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.itemTitle}>{item.field_name}</Text>
                                <Text style={styles.itemText}>Cosecha: {item.harvest_quantity.toFixed(0)} unidades</Text>
                                <Text style={styles.itemText}>Costos: ${item.total_costs.toFixed(0)}</Text>
                                <Text style={styles.itemText}>Ingreso: ${item.revenue.toFixed(0)}</Text>
                                <Text style={styles.itemText}>Costo/unidad: {item.harvest_quantity > 0 ? (item.total_costs / item.harvest_quantity).toFixed(2) : 'N/D'}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={[styles.margin, { color: item.margin >= 0 ? COLORS.success : COLORS.error }]}>
                                    Margen ${item.margin.toFixed(0)}
                                </Text>
                            </View>
                        </View>
                    )}
                    ListEmptyComponent={<Text style={styles.empty}>Aún no hay datos para calcular.</Text>}
                />
                <View style={{ marginTop: 8 }}>
                    <Text style={styles.itemTitle}>Resumen</Text>
                    <Text style={styles.itemText}>Costos totales: ${totalCosts.toFixed(0)}</Text>
                    <Text style={styles.itemText}>Ingresos estimados: ${totalRevenue.toFixed(0)}</Text>
                    <Text style={[styles.itemText, { color: totalMargin >= 0 ? COLORS.success : COLORS.error }]}>
                        Margen total: ${totalMargin.toFixed(0)}
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    label: {
        marginBottom: 4,
        color: COLORS.textSecondary,
    },
    listItem: {
        flexDirection: 'row',
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
    margin: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    empty: {
        textAlign: 'center',
        color: COLORS.textSecondary,
        marginTop: 10,
    },
});

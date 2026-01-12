import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { getDB } from '../db/database';
import { Crop, Field, Planting } from '../types';
import { COLORS, globalStyles } from '../theme';
import ScreenHeader from '../components/ScreenHeader';

type PlantingForm = {
    crop_name: string;
    field_id: number | null;
    planting_date: string;
    density: string;
    notes: string;
};

export default function PlantingsScreen({ onBack }: { onBack: () => void }) {
    const [fields, setFields] = useState<Field[]>([]);
    const [crops, setCrops] = useState<Crop[]>([]);
    const [plantings, setPlantings] = useState<Planting[]>([]);
    const [form, setForm] = useState<PlantingForm>({
        crop_name: '',
        field_id: null,
        planting_date: new Date().toISOString().split('T')[0],
        density: '',
        notes: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const db = await getDB();
        const f = await db.getAllAsync('SELECT * FROM fields ORDER BY name');
        const c = await db.getAllAsync('SELECT * FROM crops ORDER BY name');
        const p = await db.getAllAsync('SELECT * FROM plantings ORDER BY planting_date DESC');
        setFields(f as Field[]);
        setCrops(c as Crop[]);
        setPlantings(p as Planting[]);
    };

    const savePlanting = async () => {
        if (!form.crop_name.trim()) {
            Alert.alert('Falta cultivo', 'Selecciona o escribe un cultivo');
            return;
        }
        const db = await getDB();
        await db.runAsync(
            'INSERT INTO plantings (crop_name, field_id, planting_date, density, notes) VALUES (?, ?, ?, ?, ?)',
            form.crop_name.trim(),
            form.field_id ?? null,
            form.planting_date,
            parseInt(form.density, 10) || 0,
            form.notes.trim()
        );
        setForm({
            crop_name: '',
            field_id: null,
            planting_date: new Date().toISOString().split('T')[0],
            density: '',
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

    const renderCropChips = () => (
        <View style={styles.chipContainer}>
            {crops.map((crop) => {
                const selected = form.crop_name === crop.name;
                return (
                    <TouchableOpacity
                        key={crop.id || crop.name}
                        style={[styles.chip, selected && styles.chipSelected]}
                        onPress={() => setForm({ ...form, crop_name: crop.name })}
                    >
                        <Text style={[styles.chipText, selected && { color: COLORS.white }]}>{crop.name}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    return (
        <View style={globalStyles.container}>
            <ScreenHeader title="Plantings" onBack={onBack} />

            <View style={globalStyles.card}>
                <Text style={globalStyles.subtitle}>Registrar Siembra</Text>
                <Text style={styles.label}>Cultivo</Text>
                {renderCropChips()}
                <TextInput
                    style={globalStyles.input}
                    placeholder="Cultivo (escribe o selecciona)"
                    value={form.crop_name}
                    onChangeText={(value) => setForm({ ...form, crop_name: value })}
                />
                <Text style={styles.label}>Cuartel</Text>
                {renderFieldChips()}
                <TextInput
                    style={globalStyles.input}
                    placeholder="Fecha (YYYY-MM-DD)"
                    value={form.planting_date}
                    onChangeText={(value) => setForm({ ...form, planting_date: value })}
                />
                <TextInput
                    style={globalStyles.input}
                    placeholder="Densidad (plantas/ha)"
                    keyboardType="numeric"
                    value={form.density}
                    onChangeText={(value) => setForm({ ...form, density: value })}
                />
                <TextInput
                    style={globalStyles.input}
                    placeholder="Notas"
                    value={form.notes}
                    onChangeText={(value) => setForm({ ...form, notes: value })}
                />
                <TouchableOpacity style={globalStyles.button} onPress={savePlanting}>
                    <Text style={globalStyles.buttonText}>Guardar Siembra</Text>
                </TouchableOpacity>
            </View>

            <View style={globalStyles.card}>
                <Text style={globalStyles.subtitle}>Labores Registradas</Text>
                <FlatList
                    data={plantings}
                    keyExtractor={(item) => (item.id || Math.random()).toString()}
                    renderItem={({ item }) => (
                        <View style={styles.listItem}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.itemTitle}>{item.crop_name}</Text>
                                <Text style={styles.itemText}>Fecha: {item.planting_date}</Text>
                                <Text style={styles.itemText}>
                                    Cuartel: {fields.find((f) => f.id === item.field_id)?.name || 'N/D'}
                                </Text>
                            </View>
                            <View>
                                <Text style={styles.itemBadge}>{item.density || 0} densidad</Text>
                            </View>
                        </View>
                    )}
                    ListEmptyComponent={<Text style={styles.empty}>Aún no hay Labores.</Text>}
                />
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
        textAlign: 'center',
        overflow: 'hidden',
    },
    empty: {
        textAlign: 'center',
        color: COLORS.textSecondary,
        marginTop: 10,
    },
});

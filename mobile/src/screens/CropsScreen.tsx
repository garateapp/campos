import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, ScrollView } from 'react-native';
import { getDB } from '../db/database';
import { Crop, Field, Species, Variety } from '../types';
import { COLORS, globalStyles } from '../theme';
import ScreenHeader from '../components/ScreenHeader';

type CropForm = {
    name: string;
    species_id: number | null;
    variety_id: number | null;
    field_id: number | null;
    area: string;
    season: string;
};

export default function CropsScreen({ onBack }: { onBack: () => void }) {
    const [fields, setFields] = useState<Field[]>([]);
    const [species, setSpecies] = useState<Species[]>([]);
    const [varieties, setVarieties] = useState<Variety[]>([]);
    const [crops, setCrops] = useState<Crop[]>([]);
    const [form, setForm] = useState<CropForm>({
        name: '',
        species_id: null,
        variety_id: null,
        field_id: null,
        area: '',
        season: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const db = await getDB();
        const f = await db.getAllAsync('SELECT * FROM fields ORDER BY name');
        const s = await db.getAllAsync('SELECT * FROM species ORDER BY name');
        const v = await db.getAllAsync('SELECT * FROM varieties ORDER BY name');
        const c = await db.getAllAsync('SELECT * FROM crops ORDER BY id DESC');
        setFields(f as Field[]);
        setSpecies(s as Species[]);
        setVarieties(v as Variety[]);
        setCrops(c as Crop[]);
    };

    const saveCrop = async () => {
        if (!form.name.trim()) {
            Alert.alert('Falta nombre', 'Ingresa un nombre de cultivo');
            return;
        }
        const db = await getDB();
        const speciesName = species.find(s => s.id === form.species_id)?.name || '';
        const varietyName = varieties.find(v => v.id === form.variety_id)?.name || '';
        await db.runAsync(
            'INSERT INTO crops (name, species, species_id, variety, variety_id, field_id, area, season) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            form.name.trim(),
            speciesName,
            form.species_id ?? null,
            varietyName,
            form.variety_id ?? null,
            form.field_id ?? null,
            parseFloat(form.area) || 0,
            form.season.trim()
        );
        setForm({ name: '', species_id: null, variety_id: null, field_id: null, area: '', season: '' });
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

    const renderSpeciesChips = () => (
        <View style={styles.chipContainer}>
            {species.map((item) => {
                const selected = form.species_id === item.id;
                return (
                    <TouchableOpacity
                        key={item.id}
                        style={[styles.chip, selected && styles.chipSelected]}
                        onPress={() => setForm({ ...form, species_id: item.id, variety_id: null })}
                    >
                        <Text style={[styles.chipText, selected && { color: COLORS.white }]}>{item.name}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    const renderVarietyChips = () => {
        const filtered = varieties.filter((v) => v.species_id === form.species_id);
        if (!form.species_id) return null;
        return (
            <View style={styles.chipContainer}>
                {filtered.map((item) => {
                    const selected = form.variety_id === item.id;
                    return (
                        <TouchableOpacity
                            key={item.id}
                            style={[styles.chip, selected && styles.chipSelected]}
                            onPress={() => setForm({ ...form, variety_id: item.id })}
                        >
                            <Text style={[styles.chipText, selected && { color: COLORS.white }]}>{item.name}</Text>
                        </TouchableOpacity>
                    );
                })}
                {filtered.length === 0 && (
                    <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 4 }}>No hay variedades para esta especie.</Text>
                )}
            </View>
        );
    };

    return (
        <View style={globalStyles.container}>
            <ScreenHeader title="Crops" onBack={onBack} />

            <View style={globalStyles.card}>
                <Text style={globalStyles.subtitle}>Nuevo Cultivo</Text>
                <TextInput
                    style={globalStyles.input}
                    placeholder="Nombre del cultivo"
                    value={form.name}
                    onChangeText={(value) => setForm({ ...form, name: value })}
                />

                <Text style={styles.label}>Especie</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {renderSpeciesChips()}
                </ScrollView>

                <Text style={styles.label}>Variedad</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {renderVarietyChips()}
                </ScrollView>

                <Text style={styles.label}>Cuartel</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {renderFieldChips()}
                </ScrollView>

                <TextInput
                    style={globalStyles.input}
                    placeholder="Superficie (ha)"
                    keyboardType="numeric"
                    value={form.area}
                    onChangeText={(value) => setForm({ ...form, area: value })}
                />
                <TextInput
                    style={globalStyles.input}
                    placeholder="Temporada"
                    value={form.season}
                    onChangeText={(value) => setForm({ ...form, season: value })}
                />
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity style={[globalStyles.secondaryButton, { flex: 1 }]} onPress={() => setForm({ name: '', species_id: null, variety_id: null, field_id: null, area: '', season: '' })}>
                        <Text style={globalStyles.secondaryButtonText}>Limpiar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[globalStyles.button, { flex: 1 }]} onPress={saveCrop}>
                        <Text style={globalStyles.buttonText}>Guardar Cultivo</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={globalStyles.card}>
                <Text style={globalStyles.subtitle}>Cultivos Registrados</Text>
                <FlatList
                    data={crops}
                    keyExtractor={(item) => (item.id || Math.random()).toString()}
                    renderItem={({ item }) => (
                        <View style={styles.listItem}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.itemTitle}>{item.name}</Text>
                                <Text style={styles.itemText}>Especie: {item.species || 'N/D'}</Text>
                    <Text style={styles.itemText}>Variedad: {item.variety || 'N/D'}</Text>
                    <Text style={styles.itemText}>Cuartel: {fields.find((f) => f.id === item.field_id)?.name || 'N/D'}</Text>
                            </View>
                            <View>
                                <Text style={styles.itemBadge}>{item.area || 0} ha</Text>
                                {item.season ? <Text style={styles.itemText}>{item.season}</Text> : null}
                            </View>
                        </View>
                    )}
                    ListEmptyComponent={<Text style={styles.empty}>Aún no hay cultivos.</Text>}
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
});

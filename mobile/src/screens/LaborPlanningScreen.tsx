import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { getDB } from '../db/database';
import { Field, LaborPlan } from '../types';
import { COLORS, globalStyles } from '../theme';
import ScreenHeader from '../components/ScreenHeader';

type LaborForm = {
    field_id: number | null;
    task: string;
    scheduled_date: string;
    workers_needed: string;
    hours: string;
    notes: string;
};

export default function LaborPlanningScreen({ onBack }: { onBack: () => void }) {
    const [fields, setFields] = useState<Field[]>([]);
    const [plans, setPlans] = useState<LaborPlan[]>([]);
    const [form, setForm] = useState<LaborForm>({
        field_id: null,
        task: '',
        scheduled_date: new Date().toISOString().split('T')[0],
        workers_needed: '',
        hours: '',
        notes: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const db = await getDB();
        const f = await db.getAllAsync('SELECT * FROM fields ORDER BY name');
        const p = await db.getAllAsync('SELECT * FROM labor_plans ORDER BY scheduled_date DESC');
        setFields(f as Field[]);
        setPlans(p as LaborPlan[]);
    };

    const savePlan = async () => {
        if (!form.task.trim()) {
            Alert.alert('Falta tarea', 'Ingresa la tarea a planificar');
            return;
        }
        const db = await getDB();
        await db.runAsync(
            'INSERT INTO labor_plans (field_id, task, scheduled_date, workers_needed, hours, notes) VALUES (?, ?, ?, ?, ?, ?)',
            form.field_id ?? null,
            form.task.trim(),
            form.scheduled_date,
            parseInt(form.workers_needed, 10) || 0,
            parseFloat(form.hours) || 0,
            form.notes.trim()
        );
        setForm({
            field_id: null,
            task: '',
            scheduled_date: new Date().toISOString().split('T')[0],
            workers_needed: '',
            hours: '',
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

    return (
        <View style={globalStyles.container}>
            <ScreenHeader title="Planificación Laboral" onBack={onBack} />

            <View style={globalStyles.card}>
                <Text style={globalStyles.subtitle}>Nueva Tarea</Text>
                <Text style={styles.label}>Cuartel</Text>
                {renderFieldChips()}
                <TextInput
                    style={globalStyles.input}
                    placeholder="Tarea (riego, poda, etc.)"
                    value={form.task}
                    onChangeText={(value) => setForm({ ...form, task: value })}
                />
                <TextInput
                    style={globalStyles.input}
                    placeholder="Fecha (YYYY-MM-DD)"
                    value={form.scheduled_date}
                    onChangeText={(value) => setForm({ ...form, scheduled_date: value })}
                />
                <TextInput
                    style={globalStyles.input}
                    placeholder="Trabajadores necesarios"
                    keyboardType="numeric"
                    value={form.workers_needed}
                    onChangeText={(value) => setForm({ ...form, workers_needed: value })}
                />
                <TextInput
                    style={globalStyles.input}
                    placeholder="Horas estimadas"
                    keyboardType="numeric"
                    value={form.hours}
                    onChangeText={(value) => setForm({ ...form, hours: value })}
                />
                <TextInput
                    style={globalStyles.input}
                    placeholder="Notas"
                    value={form.notes}
                    onChangeText={(value) => setForm({ ...form, notes: value })}
                />
                <TouchableOpacity style={globalStyles.button} onPress={savePlan}>
                    <Text style={globalStyles.buttonText}>Guardar Plan</Text>
                </TouchableOpacity>
            </View>

            <View style={globalStyles.card}>
                <Text style={globalStyles.subtitle}>Tareas Planificadas</Text>
                <FlatList
                    data={plans}
                    keyExtractor={(item) => (item.id || Math.random()).toString()}
                    renderItem={({ item }) => (
                        <View style={styles.listItem}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.itemTitle}>{item.task}</Text>
                                <Text style={styles.itemText}>Fecha: {item.scheduled_date}</Text>
                                <Text style={styles.itemText}>
                                    Cuartel: {fields.find((f) => f.id === item.field_id)?.name || 'N/D'}
                                </Text>
                                {item.notes ? <Text style={styles.itemText}>Notas: {item.notes}</Text> : null}
                            </View>
                            <View>
                                <Text style={styles.itemBadge}>{item.workers_needed || 0} pers</Text>
                                <Text style={styles.itemText}>{item.hours || 0} hrs</Text>
                            </View>
                        </View>
                    )}
                    ListEmptyComponent={<Text style={styles.empty}>Aún no hay tareas.</Text>}
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

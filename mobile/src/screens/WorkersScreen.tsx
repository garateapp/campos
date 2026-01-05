import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { getDB } from '../db/database';
import { COLORS, globalStyles } from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import { Worker } from '../types';

type WorkerForm = {
    id?: number | null;
    name: string;
    rut: string;
    contractor_id: number | null;
};

export default function WorkersScreen({ onBack }: { onBack: () => void }) {
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [contractors, setContractors] = useState<{ id: number; name: string }[]>([]);
    const [form, setForm] = useState<WorkerForm>({ name: '', rut: '', contractor_id: null });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const db = await getDB();
        const w = await db.getAllAsync('SELECT * FROM workers ORDER BY name');
        const c = await db.getAllAsync('SELECT * FROM contractors ORDER BY name');
        setWorkers(w as Worker[]);
        setContractors(c as any[]);
    };

    const saveWorker = async () => {
        if (!form.name.trim()) {
            Alert.alert('Falta nombre', 'Ingresa el nombre del jornalero');
            return;
        }
        const db = await getDB();
        if (form.id) {
            await db.runAsync(
                'UPDATE workers SET name = ?, rut = ?, contractor_id = ?, synced = 0 WHERE id = ?',
                form.name.trim(),
                form.rut.trim(),
                form.contractor_id ?? null,
                form.id
            );
        } else {
            await db.runAsync(
                'INSERT INTO workers (name, rut, contractor_id, synced) VALUES (?, ?, ?, 0)',
                form.name.trim(),
                form.rut.trim(),
                form.contractor_id ?? null
            );
        }
        setForm({ id: null, name: '', rut: '', contractor_id: null });
        await loadData();
    };

    const startEdit = (worker: Worker) => {
        setForm({
            id: worker.id,
            name: worker.name,
            rut: worker.rut,
            contractor_id: worker.contractor_id ?? null,
        });
    };

    return (
        <View style={globalStyles.container}>
            <ScreenHeader title="Mantenedor Jornaleros" onBack={onBack} />
            <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                <View style={globalStyles.card}>
                    <Text style={globalStyles.subtitle}>{form.id ? 'Editar Jornalero' : 'Nuevo Jornalero'}</Text>
                    <TextInput
                        style={globalStyles.input}
                        placeholder="Nombre"
                        value={form.name}
                        onChangeText={(value) => setForm({ ...form, name: value })}
                    />
                    <TextInput
                        style={globalStyles.input}
                        placeholder="RUT / ID"
                        value={form.rut}
                        onChangeText={(value) => setForm({ ...form, rut: value })}
                    />
                    <Text style={styles.label}>Contratista</Text>
                    <View style={styles.chipContainer}>
                        {contractors.map((c) => {
                            const selected = form.contractor_id === c.id;
                            return (
                                <TouchableOpacity
                                    key={c.id}
                                    style={[styles.chip, selected && styles.chipSelected]}
                                    onPress={() => setForm({ ...form, contractor_id: c.id })}
                                >
                                    <Text style={[styles.chipText, selected && { color: COLORS.white }]}>{c.name}</Text>
                                </TouchableOpacity>
                            );
                        })}
                        {contractors.length === 0 && (
                            <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>Sin contratistas cargados.</Text>
                        )}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity
                            style={[globalStyles.secondaryButton, { flex: 1 }]}
                            onPress={() => setForm({ id: null, name: '', rut: '', contractor_id: null })}
                        >
                            <Text style={globalStyles.secondaryButtonText}>Limpiar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[globalStyles.button, { flex: 1 }]} onPress={saveWorker}>
                            <Text style={globalStyles.buttonText}>Guardar</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={globalStyles.card}>
                    <Text style={globalStyles.subtitle}>Jornaleros</Text>
                    <FlatList
                        data={workers}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.row} onPress={() => startEdit(item)}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.title}>{item.name}</Text>
                                    <Text style={styles.subtitle}>{item.rut || 'Sin RUT'}</Text>
                                    <Text style={styles.meta}>
                                        Contratista: {contractors.find((c) => c.id === item.contractor_id)?.name || 'N/D'}
                                    </Text>
                                </View>
                                <View style={[styles.badge, item.synced ? styles.badgeSynced : styles.badgePending]}>
                                    <Text style={[styles.badgeText, item.synced ? styles.badgeTextSynced : styles.badgeTextPending]}>
                                        {item.synced ? 'Synced' : 'Pendiente'}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={<Text style={styles.empty}>No hay jornaleros.</Text>}
                    />
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
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
    },
    subtitle: {
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    meta: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginTop: 4,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        marginLeft: 8,
    },
    badgeSynced: {
        backgroundColor: 'rgba(46, 125, 50, 0.15)',
    },
    badgePending: {
        backgroundColor: 'rgba(255, 152, 0, 0.15)',
    },
    badgeText: {
        fontWeight: '700',
    },
    badgeTextSynced: {
        color: COLORS.success,
    },
    badgeTextPending: {
        color: COLORS.accent,
    },
    empty: {
        textAlign: 'center',
        color: COLORS.textSecondary,
        marginTop: 12,
    },
});

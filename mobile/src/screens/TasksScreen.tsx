import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { getDB } from '../db/database';
import { COLORS, globalStyles } from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import { Field, TaskType, Worker, TaskItem, TaskAssignment } from '../types';

type TaskForm = {
    name: string;
    field_id: number | null;
    task_type_id: number | null;
    scheduled_date: string;
    notes: string;
    status: string;
    worker_id: number | null;
    hours: string;
};

export default function TasksScreen({ onBack }: { onBack: () => void }) {
    const [fields, setFields] = useState<Field[]>([]);
    const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
    const [form, setForm] = useState<TaskForm>({
        name: '',
        field_id: null,
        task_type_id: null,
        scheduled_date: new Date().toISOString().split('T')[0],
        notes: '',
        status: 'pendiente',
        worker_id: null,
        hours: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const db = await getDB();
        const f = await db.getAllAsync('SELECT * FROM fields ORDER BY name');
        const t = await db.getAllAsync('SELECT * FROM task_types ORDER BY name');
        const w = await db.getAllAsync('SELECT * FROM workers ORDER BY name');
        const taskRows = await db.getAllAsync('SELECT * FROM tasks ORDER BY scheduled_date DESC');
        const assignRows = await db.getAllAsync('SELECT * FROM task_assignments');
        setFields(f as Field[]);
        setTaskTypes(t as TaskType[]);
        setWorkers(w as Worker[]);
        setTasks(taskRows as TaskItem[]);
        setAssignments(assignRows as TaskAssignment[]);
    };

    const saveTask = async () => {
        if (!form.name.trim()) {
            Alert.alert('Falta nombre', 'Ingresa un nombre de tarea');
            return;
        }
        const db = await getDB();
        const result = await db.runAsync(
            'INSERT INTO tasks (name, field_id, task_type_id, scheduled_date, status, notes, synced) VALUES (?, ?, ?, ?, ?, ?, 0)',
            form.name.trim(),
            form.field_id ?? null,
            form.task_type_id ?? null,
            form.scheduled_date,
            form.status,
            form.notes.trim()
        );

        // Assign worker if provided
        if (form.worker_id) {
            await db.runAsync(
                'INSERT INTO task_assignments (task_id, worker_id, hours, synced) VALUES (?, ?, ?, 0)',
                result.lastInsertRowId || result.insertId || null,
                form.worker_id,
                parseFloat(form.hours) || null
            );
        }

        setForm({
            name: '',
            field_id: null,
            task_type_id: null,
            scheduled_date: new Date().toISOString().split('T')[0],
            notes: '',
            status: 'pendiente',
            worker_id: null,
            hours: '',
        });
        await loadData();
    };

    const renderChipRow = <T extends { id: number; name: string }>({
        data,
        selectedId,
        onSelect,
    }: {
        data: T[];
        selectedId: number | null;
        onSelect: (id: number) => void;
    }) => (
        <View style={styles.chipContainer}>
            {data.map((item) => {
                const selected = selectedId === item.id;
                return (
                    <TouchableOpacity
                        key={item.id}
                        style={[styles.chip, selected && styles.chipSelected]}
                        onPress={() => onSelect(item.id)}
                    >
                        <Text style={[styles.chipText, selected && { color: COLORS.white }]}>{item.name}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    const assignmentForTask = (taskId: number) =>
        assignments.filter((a) => a.task_id === taskId).map((a) => ({
            ...a,
            worker: workers.find((w) => w.id === a.worker_id)?.name || 'Trabajador',
        }));

    const statusOptions = [
        { key: 'pendiente', label: 'Pendiente' },
        { key: 'en_progreso', label: 'En progreso' },
        { key: 'finalizada', label: 'Finalizada' },
    ];

    return (
        <View style={globalStyles.container}>
            <ScreenHeader title="Tareas" onBack={onBack} />

            <View style={globalStyles.card}>
                <Text style={globalStyles.subtitle}>Nueva tarea</Text>
                <TextInput
                    style={globalStyles.input}
                    placeholder="Nombre de la tarea"
                    value={form.name}
                    onChangeText={(value) => setForm({ ...form, name: value })}
                />
                <Text style={styles.label}>Tipo de tarea</Text>
                {renderChipRow({
                    data: taskTypes,
                    selectedId: form.task_type_id,
                    onSelect: (id) => setForm({ ...form, task_type_id: id }),
                })}

                <Text style={styles.label}>Cuartel</Text>
                {renderChipRow({
                    data: fields,
                    selectedId: form.field_id,
                    onSelect: (id) => setForm({ ...form, field_id: id }),
                })}

                <TextInput
                    style={globalStyles.input}
                    placeholder="Fecha (YYYY-MM-DD)"
                    value={form.scheduled_date}
                    onChangeText={(value) => setForm({ ...form, scheduled_date: value })}
                />
                <Text style={styles.label}>Estado</Text>
                <View style={styles.chipContainer}>
                    {statusOptions.map((s) => {
                        const selected = form.status === s.key;
                        return (
                            <TouchableOpacity
                                key={s.key}
                                style={[styles.chip, selected && styles.chipSelected]}
                                onPress={() => setForm({ ...form, status: s.key })}
                            >
                                <Text style={[styles.chipText, selected && { color: COLORS.white }]}>{s.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
                <TextInput
                    style={globalStyles.input}
                    placeholder="Notas"
                    value={form.notes}
                    onChangeText={(value) => setForm({ ...form, notes: value })}
                />

                <Text style={styles.label}>Asignar trabajador</Text>
                {renderChipRow({
                    data: workers,
                    selectedId: form.worker_id,
                    onSelect: (id) => setForm({ ...form, worker_id: id }),
                })}
                <TextInput
                    style={globalStyles.input}
                    placeholder="Horas estimadas"
                    keyboardType="numeric"
                    value={form.hours}
                    onChangeText={(value) => setForm({ ...form, hours: value })}
                />

                <TouchableOpacity style={globalStyles.button} onPress={saveTask}>
                    <Text style={globalStyles.buttonText}>Guardar tarea</Text>
                </TouchableOpacity>
            </View>

            <View style={globalStyles.card}>
                <Text style={globalStyles.subtitle}>Tareas registradas</Text>
                <FlatList
                    data={tasks}
                    keyExtractor={(item) => (item.id || Math.random()).toString()}
                    renderItem={({ item }) => {
                        const assigns = assignmentForTask(item.id!);
                        return (
                            <View style={styles.listItem}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.itemTitle}>{item.name}</Text>
                                    <Text style={styles.itemText}>
                                        Tipo: {taskTypes.find((t) => t.id === item.task_type_id)?.name || 'N/D'}
                                    </Text>
                                    <Text style={styles.itemText}>
                                        Campo: {fields.find((f) => f.id === item.field_id)?.name || 'N/D'}
                                    </Text>
                                    <Text style={styles.itemText}>Fecha: {item.scheduled_date || 'N/D'}</Text>
                                    {assigns.length > 0 && (
                                        <Text style={styles.itemText}>
                                            Asignado a: {assigns.map((a) => a.worker).join(', ')} {assigns[0].hours ? `(${assigns[0].hours} h)` : ''}
                                        </Text>
                                    )}
                                </View>
                                <View>
                                    <Text style={styles.statusBadge}>{item.status || 'pendiente'}</Text>
                                </View>
                            </View>
                        );
                    }}
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
    label: {
        marginBottom: 4,
        color: COLORS.textSecondary,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
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
    statusBadge: {
        backgroundColor: COLORS.accent,
        color: COLORS.white,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        overflow: 'hidden',
        textTransform: 'capitalize',
        fontWeight: '700',
    },
    empty: {
        textAlign: 'center',
        color: COLORS.textSecondary,
        marginTop: 10,
    },
});

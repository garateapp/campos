import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { getDB } from '../db/database';
import { COLORS, globalStyles } from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import { Attendance, Field, TaskType, Worker } from '../types';

type AttendanceRow = Attendance & {
    worker_name?: string;
    field_name?: string;
    task_type_name?: string;
};

export default function AttendanceListScreen({ onBack }: { onBack: () => void }) {
    const [rows, setRows] = useState<AttendanceRow[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const db = await getDB();
        const data = await db.getAllAsync(`
            SELECT a.id, a.worker_id, a.date, a.check_in_time, a.field_id, a.task_type_id, a.synced,
                   w.name as worker_name, f.name as field_name, t.name as task_type_name
            FROM attendances a
            LEFT JOIN workers w ON w.id = a.worker_id
            LEFT JOIN fields f ON f.id = a.field_id
            LEFT JOIN task_types t ON t.id = a.task_type_id
            ORDER BY a.date DESC, a.check_in_time DESC
        `);
        setRows(data as AttendanceRow[]);
    };

    return (
        <View style={globalStyles.container}>
            <ScreenHeader title="Asistencia" onBack={onBack} />
            <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                <FlatList
                    data={rows}
                    keyExtractor={(item) => (item.id || Math.random()).toString()}
                    renderItem={({ item }) => (
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.title}>{item.worker_name || 'Trabajador'}</Text>
                                <Text style={styles.subtitle}>
                                    {item.date} {item.check_in_time ? `- ${item.check_in_time}` : ''}
                                </Text>
                                <Text style={styles.meta}>Campo: {item.field_name || 'N/D'}</Text>
                                <Text style={styles.meta}>Labor: {item.task_type_name || 'N/D'}</Text>
                            </View>
                            <View style={[styles.badge, item.synced ? styles.badgeSynced : styles.badgePending]}>
                                <Text style={[styles.badgeText, item.synced ? styles.badgeTextSynced : styles.badgeTextPending]}>
                                    {item.synced ? 'Synced' : 'Pendiente'}
                                </Text>
                            </View>
                        </View>
                    )}
                    ListEmptyComponent={<Text style={styles.empty}>No hay asistencias.</Text>}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
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

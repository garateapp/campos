import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { getDB } from '../db/database';
import { COLORS, globalStyles } from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import { CardAssignment, Worker, Card } from '../types';

type AssignmentRow = CardAssignment & {
    worker_name?: string;
    card_code?: string;
};

export default function CardAssignmentsScreen({ onBack }: { onBack: () => void }) {
    const [rows, setRows] = useState<AssignmentRow[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const db = await getDB();
        const data = await db.getAllAsync(`
            SELECT ca.id, ca.worker_id, ca.card_id, ca.date, ca.synced,
                   w.name as worker_name, c.code as card_code
            FROM card_assignments ca
            LEFT JOIN workers w ON w.id = ca.worker_id
            LEFT JOIN cards c ON c.id = ca.card_id
            ORDER BY ca.date DESC, ca.id DESC
        `);
        setRows(data as AssignmentRow[]);
    };

    return (
        <View style={globalStyles.container}>
            <ScreenHeader title="Tarjetas Asignadas" onBack={onBack} />
            <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                <FlatList
                    data={rows}
                    keyExtractor={(item) => (item.id || Math.random()).toString()}
                    renderItem={({ item }) => (
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.title}>{item.card_code || 'N/D'}</Text>
                                <Text style={styles.subtitle}>{item.worker_name || 'Sin trabajador'}</Text>
                                <Text style={styles.meta}>Fecha: {item.date}</Text>
                            </View>
                            <View style={[styles.badge, item.synced ? styles.badgeSynced : styles.badgePending]}>
                                <Text style={[styles.badgeText, item.synced ? styles.badgeTextSynced : styles.badgeTextPending]}>
                                    {item.synced ? 'Synced' : 'Pendiente'}
                                </Text>
                            </View>
                        </View>
                    )}
                    ListEmptyComponent={<Text style={styles.empty}>No hay asignaciones.</Text>}
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

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getDB } from '../db/database';
import { COLORS, globalStyles } from '../theme';
import ScreenHeader from '../components/ScreenHeader';

type ScoreCard = {
    title: string;
    value: string;
    hint?: string;
};

export default function HarvestScoreScreen({ onBack }: { onBack: () => void }) {
    const [cards, setCards] = useState<ScoreCard[]>([]);

    useEffect(() => {
        loadScores();
    }, []);

    const loadScores = async () => {
        const db = await getDB();
        const totalRow: any = await db.getFirstAsync('SELECT SUM(quantity) as total FROM harvest_collections');
        const total = Number(totalRow?.total || 0);

        const regRow: any = await db.getFirstAsync('SELECT COUNT(*) as count FROM harvest_collections');
        const regs = Number(regRow?.count || 0);

        const distinctWorkers: any[] = await db.getAllAsync('SELECT COUNT(DISTINCT worker_id) as workers FROM harvest_collections');
        const workers = Number(distinctWorkers?.[0]?.workers || 0);

        const perWorker = workers > 0 ? Math.round(total / workers) : 0;

        const perDayRow: any = await db.getFirstAsync(`
            SELECT AVG(total_day) as avg_day FROM (
                SELECT date, SUM(quantity) as total_day FROM harvest_collections GROUP BY date
            )
        `);
        const avgDay = Number(perDayRow?.avg_day || 0);

        setCards([
            { title: 'Total Cosechado', value: `${total.toLocaleString('es-CL', { maximumFractionDigits: 0 })} kg`, hint: `${regs} registros` },
            { title: 'Promedio por Trabajador', value: `${perWorker.toLocaleString('es-CL', { maximumFractionDigits: 0 })} kg` },
            { title: 'Promedio Diario', value: `${avgDay.toLocaleString('es-CL', { maximumFractionDigits: 0 })} kg` },
        ]);
    };

    return (
        <View style={globalStyles.container}>
            <ScreenHeader title="Score de Cosecha" onBack={onBack} />
            <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                <View style={styles.grid}>
                    {cards.map((c) => (
                        <View key={c.title} style={styles.card}>
                            <Text style={styles.cardTitle}>{c.title}</Text>
                            <Text style={styles.cardValue}>{c.value}</Text>
                            {c.hint ? <Text style={styles.cardHint}>{c.hint}</Text> : null}
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    card: {
        width: '48%',
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginBottom: 6,
    },
    cardValue: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.primary,
    },
    cardHint: {
        marginTop: 4,
        color: COLORS.textSecondary,
        fontSize: 12,
    },
});

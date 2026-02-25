import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { getDB } from '../db/database';
import { COLORS, globalStyles } from '../theme';
import ScreenHeader from '../components/ScreenHeader';

type ScoreCard = {
    title: string;
    value: string;
    hint?: string;
};

type WorkerScore = {
    workerId: number;
    workerName: string;
    records: number;
    totalUnits: number;
    totalKg: number;
    unconfiguredUnits: number;
};

export default function HarvestScoreScreen({ onBack }: { onBack: () => void }) {
    const [cards, setCards] = useState<ScoreCard[]>([]);
    const [workerScores, setWorkerScores] = useState<WorkerScore[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        loadScores();
    }, []);

    const formatKg = (value: number) => {
        const safe = Number.isFinite(value) ? value : 0;
        try {
            return safe.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
        } catch {
            return safe.toFixed(1);
        }
    };

    const formatInt = (value: number) => {
        const safe = Number.isFinite(value) ? value : 0;
        try {
            return safe.toLocaleString('es-CL', { maximumFractionDigits: 0 });
        } catch {
            return String(Math.round(safe));
        }
    };

    const loadScores = async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
            const db = await getDB();
            const today = new Date().toISOString().split('T')[0];
            const containerInfo: any[] = await db.getAllAsync('PRAGMA table_info(harvest_containers)');
            const hasQuantityPerBin = containerInfo.some((c) => c.name === 'quantity_per_bin');
            const hasBinWeightKg = containerInfo.some((c) => c.name === 'bin_weight_kg');

            const kgPerUnitExpr = (alias: string) =>
                hasQuantityPerBin && hasBinWeightKg
                    ? `
            CASE
                WHEN ${alias}.quantity_per_bin > 0 AND ${alias}.bin_weight_kg IS NOT NULL
                    THEN (${alias}.bin_weight_kg * 1.0 / ${alias}.quantity_per_bin)
                ELSE NULL
            END
        `
                    : 'NULL';

            const totalsRow: any = await db.getFirstAsync(`
            SELECT
                COUNT(hc.id) AS regs,
                SUM(hc.quantity) AS total_units,
                SUM(hc.quantity * COALESCE(${kgPerUnitExpr('h')}, 0)) AS total_kg,
                SUM(CASE WHEN ${kgPerUnitExpr('h')} IS NULL THEN hc.quantity ELSE 0 END) AS unconfigured_units
            FROM harvest_collections hc
            LEFT JOIN harvest_containers h ON h.id = hc.harvest_container_id
            WHERE hc.date = ?
        `, today);

            const workersRows: any[] = await db.getAllAsync(`
            SELECT
                hc.worker_id AS worker_id,
                COALESCE(w.name, 'Sin nombre') AS worker_name,
                COUNT(hc.id) AS regs,
                SUM(hc.quantity) AS total_units,
                SUM(hc.quantity * COALESCE(${kgPerUnitExpr('h')}, 0)) AS total_kg,
                SUM(CASE WHEN ${kgPerUnitExpr('h')} IS NULL THEN hc.quantity ELSE 0 END) AS unconfigured_units
            FROM harvest_collections hc
            LEFT JOIN workers w ON w.id = hc.worker_id
            LEFT JOIN harvest_containers h ON h.id = hc.harvest_container_id
            WHERE hc.date = ?
            GROUP BY hc.worker_id, w.name
            ORDER BY total_kg DESC, total_units DESC, worker_name ASC
        `, today);

            const perDayRow: any = await db.getFirstAsync(`
            SELECT
                AVG(total_day_kg) as avg_day_kg,
                AVG(total_day_units) as avg_day_units
            FROM (
                SELECT hc.date, SUM(hc.quantity * COALESCE(${kgPerUnitExpr('h')}, 0)) as total_day_kg
                , SUM(hc.quantity) as total_day_units
                FROM harvest_collections hc
                LEFT JOIN harvest_containers h ON h.id = hc.harvest_container_id
                WHERE hc.date = ?
                GROUP BY hc.date
            ) AS day_totals
        `, today);

            const daysRow: any = await db.getFirstAsync(
                'SELECT COUNT(DISTINCT date) as active_days FROM harvest_collections WHERE date = ?',
                today
            );

            const regs = Number(totalsRow?.regs || 0);
            const totalUnits = Number(totalsRow?.total_units || 0);
            const totalKg = Number(totalsRow?.total_kg || 0);
            const unconfiguredUnits = Number(totalsRow?.unconfigured_units || 0);
            const avgDayKg = Number(perDayRow?.avg_day_kg || 0);
            const avgDayUnits = Number(perDayRow?.avg_day_units || 0);
            const activeDays = Number(daysRow?.active_days || 0);

            const normalizedWorkers: WorkerScore[] = workersRows.map((row) => ({
                workerId: Number(row.worker_id),
                workerName: String(row.worker_name || 'Sin nombre'),
                records: Number(row.regs || 0),
                totalUnits: Number(row.total_units || 0),
                totalKg: Number(row.total_kg || 0),
                unconfiguredUnits: Number(row.unconfigured_units || 0),
            }));

            const workers = normalizedWorkers.length;
            const avgPerWorkerKg = workers > 0 ? totalKg / workers : 0;
            const avgPerWorkerUnits = workers > 0 ? totalUnits / workers : 0;

            const totalHint = [
                `${formatInt(regs)} registros`,
                `${formatInt(totalUnits)} unidades`,
                unconfiguredUnits > 0 ? `${formatInt(unconfiguredUnits)} sin config` : null,
            ]
                .filter(Boolean)
                .join(' · ');

            setCards([
                {
                    title: 'Total Cosechado',
                    value: totalKg > 0 ? `${formatKg(totalKg)} kg` : `${formatInt(totalUnits)} unidades`,
                    hint: totalHint,
                },
                {
                    title: 'Promedio por Cosechador',
                    value: totalKg > 0 ? `${formatKg(avgPerWorkerKg)} kg` : `${formatKg(avgPerWorkerUnits)} un`,
                    hint: `${workers} cosechadores`,
                },
                {
                    title: 'Promedio Diario',
                    value: totalKg > 0 ? `${formatKg(avgDayKg)} kg` : `${formatKg(avgDayUnits)} un`,
                    hint: `${activeDays} días con registros (hoy)`,
                },
            ]);
            setWorkerScores(normalizedWorkers);
        } catch (error) {
            console.error('HarvestScore load error', error);
            setLoadError('No se pudo calcular el score en kg. Mostrando acumulados por unidades.');

            const db = await getDB();
            const today = new Date().toISOString().split('T')[0];
            const totalsFallback: any = await db.getFirstAsync(`
                SELECT COUNT(id) AS regs, SUM(quantity) AS total_units
                FROM harvest_collections
                WHERE date = ?
            `, today);

            const workersFallback: any[] = await db.getAllAsync(`
                SELECT
                    hc.worker_id AS worker_id,
                    COALESCE(w.name, 'Sin nombre') AS worker_name,
                    COUNT(hc.id) AS regs,
                    SUM(hc.quantity) AS total_units
                FROM harvest_collections hc
                LEFT JOIN workers w ON w.id = hc.worker_id
                WHERE hc.date = ?
                GROUP BY hc.worker_id, w.name
                ORDER BY total_units DESC, worker_name ASC
            `, today);

            const regs = Number(totalsFallback?.regs || 0);
            const totalUnits = Number(totalsFallback?.total_units || 0);
            const workers = workersFallback.length;
            const avgPerWorkerUnits = workers > 0 ? totalUnits / workers : 0;

            setCards([
                {
                    title: 'Total Cosechado',
                    value: `${formatInt(totalUnits)} unidades`,
                    hint: `${formatInt(regs)} registros`,
                },
                {
                    title: 'Promedio por Cosechador',
                    value: `${formatKg(avgPerWorkerUnits)} un`,
                    hint: `${workers} cosechadores`,
                },
                {
                    title: 'Promedio Diario',
                    value: 'N/D',
                    hint: 'No disponible por error de cálculo',
                },
            ]);

            setWorkerScores(
                workersFallback.map((row) => ({
                    workerId: Number(row.worker_id),
                    workerName: String(row.worker_name || 'Sin nombre'),
                    records: Number(row.regs || 0),
                    totalUnits: Number(row.total_units || 0),
                    totalKg: 0,
                    unconfiguredUnits: Number(row.total_units || 0),
                }))
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={globalStyles.container}>
            <ScreenHeader title="Score de Cosecha" onBack={onBack} />
            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, paddingBottom: 24 }}>
                <TouchableOpacity style={styles.refreshButton} onPress={loadScores} disabled={isLoading}>
                    <Text style={styles.refreshButtonText}>{isLoading ? 'Actualizando...' : 'Recargar score'}</Text>
                </TouchableOpacity>
                {loadError ? (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{loadError}</Text>
                    </View>
                ) : null}
                <View style={styles.grid}>
                    {cards.map((c) => (
                        <View key={c.title} style={styles.card}>
                            <Text style={styles.cardTitle}>{c.title}</Text>
                            <Text style={styles.cardValue}>{c.value}</Text>
                            {c.hint ? <Text style={styles.cardHint}>{c.hint}</Text> : null}
                        </View>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Acumulado por Cosechador</Text>
                    {workerScores.length === 0 ? (
                        <View style={styles.emptyBox}>
                            <Text style={styles.emptyText}>Aún no hay registros de cosecha.</Text>
                        </View>
                    ) : (
                        workerScores.map((row, index) => {
                            const hint = [
                                `${formatInt(row.totalUnits)} unidades`,
                                `${formatInt(row.records)} registros`,
                                row.unconfiguredUnits > 0 ? `${formatInt(row.unconfiguredUnits)} sin config` : null,
                            ]
                                .filter(Boolean)
                                .join(' · ');

                            return (
                                <View key={`${row.workerId}-${index}`} style={styles.workerCard}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.workerName}>{index + 1}. {row.workerName}</Text>
                                        <Text style={styles.workerHint}>{hint}</Text>
                                    </View>
                                    <Text style={styles.workerValue}>
                                        {row.totalKg > 0 ? `${formatKg(row.totalKg)} kg` : `${formatInt(row.totalUnits)} un`}
                                    </Text>
                                </View>
                            );
                        })
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    refreshButton: {
        alignSelf: 'flex-end',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 10,
        backgroundColor: COLORS.white,
    },
    refreshButtonText: {
        color: COLORS.primary,
        fontWeight: '700',
        fontSize: 12,
    },
    errorBox: {
        backgroundColor: '#fff5f5',
        borderColor: '#f2c9c9',
        borderWidth: 1,
        borderRadius: 10,
        padding: 10,
        marginBottom: 10,
    },
    errorText: {
        color: '#8b2f2f',
        fontSize: 12,
    },
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
    section: {
        marginTop: 14,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 10,
    },
    workerCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
    },
    workerName: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
    },
    workerHint: {
        marginTop: 2,
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    workerValue: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.primary,
    },
    emptyBox: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 14,
    },
    emptyText: {
        color: COLORS.textSecondary,
    },
});

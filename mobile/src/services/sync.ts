import axios from 'axios';
import { getDB } from '../db/database';
import { Worker, Card, Field, Species, HarvestContainer, CardAssignment } from '../types';

// Replace with your computer's IP address
const API_URL = 'http://172.16.0.145:5173/api/v1/sync';
const API_TOKEN = 'your_sanctum_token'; // TODO: Implement Login to get token

export const syncData = async () => {
    const db = await getDB();

    try {
        // 1. UPLOAD
        const unsyncedAttendances = await db.getAllAsync('SELECT * FROM attendances WHERE synced = 0');
        const unsyncedCollections = await db.getAllAsync('SELECT * FROM harvest_collections WHERE synced = 0');
        const unsyncedAssignments = await db.getAllAsync('SELECT * FROM card_assignments WHERE synced = 0');

        if (unsyncedAttendances.length > 0 || unsyncedCollections.length > 0 || unsyncedAssignments.length > 0) {
            await axios.post(`${API_URL}/upload`, {
                attendances: unsyncedAttendances,
                collections: unsyncedCollections,
                card_assignments: unsyncedAssignments
            }, {
                headers: { Authorization: `Bearer ${API_TOKEN}` }
            });

            // Mark as synced
            if (unsyncedAttendances.length > 0) await db.execAsync('UPDATE attendances SET synced = 1 WHERE synced = 0');
            if (unsyncedCollections.length > 0) await db.execAsync('UPDATE harvest_collections SET synced = 1 WHERE synced = 0');
            if (unsyncedAssignments.length > 0) await db.execAsync('UPDATE card_assignments SET synced = 1 WHERE synced = 0');
        }

        // 2. DOWNLOAD
        const response = await axios.get(`${API_URL}/download`, {
            headers: { Authorization: `Bearer ${API_TOKEN}` }
        });

        const data = response.data;

        await db.withTransactionAsync(async () => {
            // Workers
            await db.execAsync('DELETE FROM workers');
            for (const w of data.workers) {
                await db.runAsync('INSERT INTO workers (id, name, rut, contractor_id) VALUES (?, ?, ?, ?)', w.id, w.name, w.rut, w.contractor_id);
            }

            // Cards
            await db.execAsync('DELETE FROM cards');
            for (const c of data.cards) {
                await db.runAsync('INSERT INTO cards (id, code) VALUES (?, ?)', c.id, c.code);
            }

            // Fields
            await db.execAsync('DELETE FROM fields');
            for (const f of data.fields) {
                await db.runAsync('INSERT INTO fields (id, name) VALUES (?, ?)', f.id, f.name);
            }

            // Species
            await db.execAsync('DELETE FROM species');
            for (const s of data.species) {
                await db.runAsync('INSERT INTO species (id, name) VALUES (?, ?)', s.id, s.name);
            }

            // Harvest Containers
            await db.execAsync('DELETE FROM harvest_containers');
            for (const h of data.harvest_containers) {
                await db.runAsync('INSERT INTO harvest_containers (id, name, species_id) VALUES (?, ?, ?)', h.id, h.name, h.species_id);
            }

            // Card Assignments (Server) - Be careful not to overwrite local unsynced ones?
            // Actually, for simplicity, we wipe and replace server ones, but keep local logic separated? 
            // Ideally we merge. For now, simple replace of assignments from server.
            // But we must NOT delete local unsynced assignments.
            // Strategy: Delete only synced assignments? Or just rely on "last 2 days" from server.

            // Simple approach: Clear all assignments that are synced, keep unsynced.
            await db.execAsync('DELETE FROM card_assignments WHERE synced = 1');
            for (const a of data.card_assignments) {
                // Check if exists (local unsynced might conflict on IDs if using autoinc, but server IDs are persistent)
                // We should use separate ID columns or just trust server
                await db.runAsync('INSERT INTO card_assignments (worker_id, card_id, date, synced) VALUES (?, ?, ?, 1)', a.worker_id, a.card_id, a.date);
            }
        });

        return { success: true };

    } catch (error) {
        console.error('Sync Error', error);
        return { success: false, error: error };
    }
};

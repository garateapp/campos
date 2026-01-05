import axios from 'axios';
import { getDB } from '../db/database';

// Replace with your computer's IP address
const API_URL = 'https://campos.appgreenex.cl/api/v1/sync';

export const syncData = async (token: string) => {
    const db = await getDB();

    try {
        // 1. UPLOAD (send only unsynced rows)
        const unsyncedAttendances = await db.getAllAsync('SELECT * FROM attendances WHERE synced = 0');
        const unsyncedCollections = await db.getAllAsync('SELECT * FROM harvest_collections WHERE synced = 0');
        const unsyncedAssignments = await db.getAllAsync('SELECT * FROM card_assignments WHERE synced = 0');
        const unsyncedCrops = await db.getAllAsync('SELECT * FROM crops WHERE synced = 0');
        const unsyncedPlantings = await db.getAllAsync('SELECT * FROM plantings WHERE synced = 0');
        const unsyncedSupplies = await db.getAllAsync('SELECT * FROM supplies WHERE synced = 0');
        const unsyncedDirectCosts = await db.getAllAsync('SELECT * FROM direct_costs WHERE synced = 0');
        const unsyncedLaborPlans = await db.getAllAsync('SELECT * FROM labor_plans WHERE synced = 0');
        const unsyncedTasks = await db.getAllAsync('SELECT * FROM tasks WHERE synced = 0');
        const unsyncedTaskAssignments = await db.getAllAsync('SELECT * FROM task_assignments WHERE synced = 0');
        const unsyncedWorkers = await db.getAllAsync('SELECT * FROM workers WHERE synced = 0');

        const shouldUpload = [
            unsyncedAttendances,
            unsyncedCollections,
            unsyncedAssignments,
            unsyncedCrops,
            unsyncedPlantings,
            unsyncedSupplies,
            unsyncedDirectCosts,
            unsyncedLaborPlans,
            unsyncedTasks,
            unsyncedTaskAssignments,
            unsyncedWorkers,
        ].some(list => list.length > 0);

        if (shouldUpload) {
            await axios.post(`${API_URL}/upload`, {
                attendances: unsyncedAttendances,
                collections: unsyncedCollections,
                card_assignments: unsyncedAssignments,
                crops: unsyncedCrops,
                plantings: unsyncedPlantings,
                supplies: unsyncedSupplies,
                direct_costs: unsyncedDirectCosts,
                labor_plans: unsyncedLaborPlans,
                tasks: unsyncedTasks,
                task_assignments: unsyncedTaskAssignments,
                workers: unsyncedWorkers,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            await db.execAsync('UPDATE attendances SET synced = 1 WHERE synced = 0');
            await db.execAsync('UPDATE harvest_collections SET synced = 1 WHERE synced = 0');
            await db.execAsync('UPDATE card_assignments SET synced = 1 WHERE synced = 0');
            await db.execAsync('UPDATE crops SET synced = 1 WHERE synced = 0');
            await db.execAsync('UPDATE plantings SET synced = 1 WHERE synced = 0');
            await db.execAsync('UPDATE supplies SET synced = 1 WHERE synced = 0');
            await db.execAsync('UPDATE direct_costs SET synced = 1 WHERE synced = 0');
            await db.execAsync('UPDATE labor_plans SET synced = 1 WHERE synced = 0');
            await db.execAsync('UPDATE tasks SET synced = 1 WHERE synced = 0');
            await db.execAsync('UPDATE task_assignments SET synced = 1 WHERE synced = 0');
            await db.execAsync('UPDATE workers SET synced = 1 WHERE synced = 0');
        }

        // Snapshot of unsynced rows to keep them after refresh (should be none, but safe).
        const localUnsynced = {
            cardAssignments: await db.getAllAsync('SELECT * FROM card_assignments WHERE synced = 0'),
            crops: await db.getAllAsync('SELECT * FROM crops WHERE synced = 0'),
            plantings: await db.getAllAsync('SELECT * FROM plantings WHERE synced = 0'),
            supplies: await db.getAllAsync('SELECT * FROM supplies WHERE synced = 0'),
            direct_costs: await db.getAllAsync('SELECT * FROM direct_costs WHERE synced = 0'),
            labor_plans: await db.getAllAsync('SELECT * FROM labor_plans WHERE synced = 0'),
            tasks: await db.getAllAsync('SELECT * FROM tasks WHERE synced = 0'),
            task_assignments: await db.getAllAsync('SELECT * FROM task_assignments WHERE synced = 0'),
            workers: await db.getAllAsync('SELECT * FROM workers WHERE synced = 0'),
        };

        // 2. DOWNLOAD
        const response = await axios.get(`${API_URL}/download`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = response.data;

        await db.withTransactionAsync(async () => {
            // Workers (keep unsynced)
            await db.execAsync('DELETE FROM workers WHERE synced = 1');
            for (const w of data.workers) {
                await db.runAsync('INSERT INTO workers (id, name, rut, contractor_id, synced) VALUES (?, ?, ?, ?, 1)', w.id, w.name, w.rut, w.contractor_id);
            }
            for (const w of localUnsynced.workers) {
                await db.runAsync(
                    'INSERT OR IGNORE INTO workers (id, name, rut, contractor_id, synced) VALUES (?, ?, ?, ?, 0)',
                    w.id || null, w.name, w.rut, w.contractor_id
                );
            }

            // Contractors
            await db.execAsync('DELETE FROM contractors');
            for (const c of data.contractors || []) {
                await db.runAsync('INSERT INTO contractors (id, name) VALUES (?, ?)', c.id, c.name);
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

            // Varieties
            await db.execAsync('DELETE FROM varieties');
            for (const v of data.varieties || []) {
                await db.runAsync('INSERT INTO varieties (id, name, species_id) VALUES (?, ?, ?)', v.id, v.name, v.species_id);
            }

            // Harvest Containers
            await db.execAsync('DELETE FROM harvest_containers');
            for (const h of data.harvest_containers) {
                await db.runAsync('INSERT INTO harvest_containers (id, name, species_id) VALUES (?, ?, ?)', h.id, h.name, h.species_id);
            }

            // Task Types
            await db.execAsync('DELETE FROM task_types');
            for (const t of data.task_types || []) {
                await db.runAsync('INSERT INTO task_types (id, name) VALUES (?, ?)', t.id, t.name);
            }

            // Labor Types
            await db.execAsync('DELETE FROM labor_types');
            for (const lt of data.labor_types || []) {
                await db.runAsync('INSERT INTO labor_types (id, name) VALUES (?, ?)', lt.id, lt.name);
            }

            // Units of measure
            await db.execAsync('DELETE FROM unit_of_measures');
            for (const u of data.unit_of_measures || []) {
                await db.runAsync('INSERT INTO unit_of_measures (id, name, code) VALUES (?, ?, ?)', u.id, u.name, u.code);
            }

            // Card Assignments: keep unsynced, replace synced with server copy
            await db.execAsync('DELETE FROM card_assignments WHERE synced = 1');
            for (const a of data.card_assignments) {
                await db.runAsync('INSERT INTO card_assignments (worker_id, card_id, date, synced) VALUES (?, ?, ?, 1)', a.worker_id, a.card_id, a.date);
            }
            for (const a of localUnsynced.cardAssignments) {
                await db.runAsync(
                    'INSERT OR IGNORE INTO card_assignments (worker_id, card_id, date, synced) VALUES (?, ?, ?, 0)',
                    a.worker_id, a.card_id, a.date
                );
            }

            // Crops
            await db.execAsync('DELETE FROM crops WHERE synced = 1');
            for (const c of data.crops || []) {
                await db.runAsync(
                    'INSERT INTO crops (id, name, species, species_id, variety, variety_id, field_id, area, season, synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
                    c.id || null, c.name || '', c.species || null, c.species_id ?? null, c.variety || null, c.variety_id ?? null, c.field_id ?? null, c.area ?? null, c.season ?? null
                );
            }
            for (const c of localUnsynced.crops) {
                await db.runAsync(
                    'INSERT OR IGNORE INTO crops (name, species, species_id, variety, variety_id, field_id, area, season, synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)',
                    c.name, c.species, c.species_id, c.variety, c.variety_id, c.field_id, c.area, c.season
                );
            }

            // Plantings
            await db.execAsync('DELETE FROM plantings WHERE synced = 1');
            for (const p of data.plantings || []) {
                await db.runAsync(
                    'INSERT INTO plantings (id, crop_name, field_id, planting_date, density, notes, synced) VALUES (?, ?, ?, ?, ?, ?, 1)',
                    p.id || null, p.crop_name || '', p.field_id ?? null, p.planting_date || null, p.density ?? null, p.notes ?? null
                );
            }
            for (const p of localUnsynced.plantings) {
                await db.runAsync(
                    'INSERT OR IGNORE INTO plantings (crop_name, field_id, planting_date, density, notes, synced) VALUES (?, ?, ?, ?, ?, 0)',
                    p.crop_name, p.field_id, p.planting_date, p.density, p.notes
                );
            }

            // Supplies
            await db.execAsync('DELETE FROM supplies WHERE synced = 1');
            for (const s of data.supplies || []) {
                await db.runAsync(
                    'INSERT INTO supplies (id, name, unit, quantity, unit_cost, synced) VALUES (?, ?, ?, ?, ?, 1)',
                    s.id || null, s.name || '', s.unit || null, s.quantity ?? 0, s.unit_cost ?? 0
                );
            }
            for (const s of localUnsynced.supplies) {
                await db.runAsync(
                    'INSERT OR IGNORE INTO supplies (name, unit, quantity, unit_cost, synced) VALUES (?, ?, ?, ?, 0)',
                    s.name, s.unit, s.quantity, s.unit_cost
                );
            }

            // Direct Costs
            await db.execAsync('DELETE FROM direct_costs WHERE synced = 1');
            for (const d of data.direct_costs || []) {
                await db.runAsync(
                    'INSERT INTO direct_costs (id, field_id, category, amount, date, notes, synced) VALUES (?, ?, ?, ?, ?, ?, 1)',
                    d.id || null, d.field_id ?? null, d.category || '', d.amount ?? 0, d.date || null, d.notes ?? null
                );
            }
            for (const d of localUnsynced.direct_costs) {
                await db.runAsync(
                    'INSERT OR IGNORE INTO direct_costs (field_id, category, amount, date, notes, synced) VALUES (?, ?, ?, ?, ?, 0)',
                    d.field_id, d.category, d.amount, d.date, d.notes
                );
            }

            // Labor Plans
            await db.execAsync('DELETE FROM labor_plans WHERE synced = 1');
            for (const l of data.labor_plans || []) {
                await db.runAsync(
                    'INSERT INTO labor_plans (id, field_id, task, scheduled_date, workers_needed, hours, notes, synced) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
                    l.id || null, l.field_id ?? null, l.task || '', l.scheduled_date || null, l.workers_needed ?? null, l.hours ?? null, l.notes ?? null
                );
            }
            for (const l of localUnsynced.labor_plans) {
                await db.runAsync(
                    'INSERT OR IGNORE INTO labor_plans (field_id, task, scheduled_date, workers_needed, hours, notes, synced) VALUES (?, ?, ?, ?, ?, ?, 0)',
                    l.field_id, l.task, l.scheduled_date, l.workers_needed, l.hours, l.notes
                );
            }

            // Tasks
            await db.execAsync('DELETE FROM tasks WHERE synced = 1');
            for (const t of data.tasks || []) {
                await db.runAsync(
                    'INSERT INTO tasks (id, name, field_id, task_type_id, scheduled_date, status, notes, synced) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
                    t.id || null, t.name || '', t.field_id ?? null, t.task_type_id ?? null, t.scheduled_date || null, t.status || null, t.notes || null
                );
            }
            for (const t of localUnsynced.tasks) {
                await db.runAsync(
                    'INSERT OR IGNORE INTO tasks (name, field_id, task_type_id, scheduled_date, status, notes, synced) VALUES (?, ?, ?, ?, ?, ?, 0)',
                    t.name, t.field_id, t.task_type_id, t.scheduled_date, t.status, t.notes
                );
            }

            // Task assignments
            await db.execAsync('DELETE FROM task_assignments WHERE synced = 1');
            for (const ta of data.task_assignments || []) {
                await db.runAsync(
                    'INSERT INTO task_assignments (id, task_id, worker_id, hours, synced) VALUES (?, ?, ?, ?, 1)',
                    ta.id || null, ta.task_id ?? null, ta.worker_id ?? null, ta.hours ?? null
                );
            }
            for (const ta of localUnsynced.task_assignments) {
                await db.runAsync(
                    'INSERT OR IGNORE INTO task_assignments (task_id, worker_id, hours, synced) VALUES (?, ?, ?, 0)',
                    ta.task_id, ta.worker_id, ta.hours
                );
            }
        });

        return { success: true };

    } catch (error) {
        console.error('Sync Error', error);
        return { success: false, error: error };
    }
};

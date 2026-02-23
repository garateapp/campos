import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export const getDB = async () => {
    if (!db) {
        db = await SQLite.openDatabaseAsync('greenex.db');
    }
    return db;
};

// Danger: wipes all local data. Useful when user cambia de compañía para evitar mezclar registros.
export const resetLocalData = async () => {
    const database = await getDB();
    const tables = [
        'workers',
        'contractors',
        'cards',
        'fields',
        'species',
        'varieties',
        'harvest_containers',
        'card_assignments',
        'attendances',
        'harvest_collections',
        'crops',
        'plantings',
        'supplies',
        'direct_costs',
        'labor_plans',
        'inputs',
        'input_categories',
        'task_types',
        'labor_types',
        'unit_of_measures',
        'tasks',
        'task_assignments',
        'task_logs',
        'costs',
        'harvests',
    ];

    for (const table of tables) {
        await database.execAsync(`DELETE FROM ${table};`);
    }
};

const ensureColumn = async (table: string, column: string, definition: string) => {
    const database = await getDB();
    const info: any[] = await database.getAllAsync(`PRAGMA table_info(${table})`);
    const exists = info.some((c) => c.name === column);
    if (!exists) {
        await database.execAsync(`ALTER TABLE ${table} ADD COLUMN ${definition};`);
    }
};

export const initDB = async () => {
    const database = await getDB();

    // Workers
    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS workers (
      id INTEGER PRIMARY KEY,
      name TEXT,
      rut TEXT,
      contractor_id INTEGER,
      is_identity_validated INTEGER DEFAULT 0,
      synced INTEGER DEFAULT 0
    );
  `);

    await ensureColumn('workers', 'is_identity_validated', 'is_identity_validated INTEGER DEFAULT 0');
    await ensureColumn('workers', 'synced', 'synced INTEGER DEFAULT 0');

    // Cards
    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS cards (
        id INTEGER PRIMARY KEY,
        code TEXT
    );
  `);

    // Fields
    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS fields (
        id INTEGER PRIMARY KEY,
        name TEXT
    );
  `);

    // Species
    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS species (
        id INTEGER PRIMARY KEY,
        name TEXT
    );
  `);

    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS families (
        id INTEGER PRIMARY KEY,
        name TEXT
    );
  `);

    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS varieties (
        id INTEGER PRIMARY KEY,
        name TEXT,
        species_id INTEGER
    );
  `);

    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS contractors (
        id INTEGER PRIMARY KEY,
        name TEXT
    );
  `);

    // Harvest Containers
    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS harvest_containers (
        id INTEGER PRIMARY KEY,
        name TEXT,
        species_id INTEGER,
        quantity_per_bin INTEGER,
        bin_weight_kg REAL
    );
  `);
    await ensureColumn('harvest_containers', 'quantity_per_bin', 'quantity_per_bin INTEGER');
    await ensureColumn('harvest_containers', 'bin_weight_kg', 'bin_weight_kg REAL');

    // Card Assignments (Local Copy)
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS card_assignments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          worker_id INTEGER,
          card_id INTEGER,
          date TEXT,
          deleted_at TEXT,
          synced INTEGER DEFAULT 0
      );
  `);
    await ensureColumn('card_assignments', 'deleted_at', 'deleted_at TEXT');

    // Attendances (To Sync Up)
    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS attendances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        worker_id INTEGER,
        date TEXT,
        check_in_time TEXT,
        check_out_time TEXT,
        field_id INTEGER,
        task_type_id INTEGER,
        synced INTEGER DEFAULT 0
    );
  `);
    await ensureColumn('attendances', 'check_out_time', 'check_out_time TEXT');

    // Harvest Collections (To Sync Up)
    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS harvest_collections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        worker_id INTEGER,
        card_id INTEGER,
        date TEXT,
        harvest_container_id INTEGER,
        quantity INTEGER,
        field_id INTEGER,
        is_bin_completed INTEGER DEFAULT 0,
        manual_bin_units INTEGER,
        created_at_ms INTEGER,
        synced INTEGER DEFAULT 0
    );
  `);
    await ensureColumn('harvest_collections', 'card_id', 'card_id INTEGER');
    await ensureColumn('harvest_collections', 'is_bin_completed', 'is_bin_completed INTEGER DEFAULT 0');
    await ensureColumn('harvest_collections', 'manual_bin_units', 'manual_bin_units INTEGER');
    await ensureColumn('harvest_collections', 'created_at_ms', 'created_at_ms INTEGER');

    // Crops catalog
    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS crops (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        species TEXT,
        species_id INTEGER,
        variety TEXT,
        variety_id INTEGER,
        field_id INTEGER,
        area REAL,
        season TEXT,
        synced INTEGER DEFAULT 0
    );
  `);

    await ensureColumn('crops', 'species_id', 'species_id INTEGER');
    await ensureColumn('crops', 'variety', 'variety TEXT');
    await ensureColumn('crops', 'variety_id', 'variety_id INTEGER');

    // Plantings register
    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS plantings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        crop_name TEXT,
        field_id INTEGER,
        planting_date TEXT,
        density INTEGER,
        notes TEXT,
        synced INTEGER DEFAULT 0
    );
  `);

    // Supplies inventory
    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS supplies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        unit TEXT,
        quantity REAL,
        unit_cost REAL,
        synced INTEGER DEFAULT 0
    );
  `);

    // Direct costs
    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS direct_costs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        field_id INTEGER,
        category TEXT,
        amount REAL,
        date TEXT,
        notes TEXT,
        synced INTEGER DEFAULT 0
    );
  `);

    // Labor planning
    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS labor_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        field_id INTEGER,
        task TEXT,
        scheduled_date TEXT,
        workers_needed INTEGER,
        hours REAL,
        notes TEXT,
        synced INTEGER DEFAULT 0
    );
  `);

    // Input categories (web: input_categories)
    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS input_categories (
        id INTEGER PRIMARY KEY,
        name TEXT
    );
  `);

    // Inputs (web: inputs)
    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS inputs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        unit TEXT,
        current_stock REAL,
        min_stock_alert REAL,
        unit_cost REAL,
        input_category_id INTEGER,
        field_id INTEGER,
        synced INTEGER DEFAULT 0
    );
  `);

    // Task types (web: task_types)
    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS task_types (
        id INTEGER PRIMARY KEY,
        name TEXT
    );
  `);

    // Labor types (web: labor_types)
    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS labor_types (
        id INTEGER PRIMARY KEY,
        name TEXT
    );
  `);

    // Units of measure (web: unit_of_measures)
    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS unit_of_measures (
        id INTEGER PRIMARY KEY,
        name TEXT,
        code TEXT
    );
  `);

    // Tasks (simplified)
    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        field_id INTEGER,
        task_type_id INTEGER,
        scheduled_date TEXT,
        status TEXT,
        notes TEXT,
        synced INTEGER DEFAULT 0
    );
  `);

    // Task assignments
    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS task_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER,
        worker_id INTEGER,
        hours REAL,
        synced INTEGER DEFAULT 0
    );
  `);

    // Task logs
    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS task_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER,
        description TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        synced INTEGER DEFAULT 0
    );
  `);

    // Costs (web: costs)
    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS costs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        field_id INTEGER,
        planting_id INTEGER,
        category TEXT,
        amount REAL,
        cost_date TEXT,
        notes TEXT,
        synced INTEGER DEFAULT 0
    );
  `);

    // Harvests (web: harvests)
    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS harvests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        planting_id INTEGER,
        field_id INTEGER,
        quantity_kg REAL,
        harvest_date TEXT,
        synced INTEGER DEFAULT 0
    );
  `);

    console.log('Database initialized');
};

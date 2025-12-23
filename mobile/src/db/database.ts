import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export const getDB = async () => {
    if (!db) {
        db = await SQLite.openDatabaseAsync('greenex.db');
    }
    return db;
};

export const initDB = async () => {
    const database = await getDB();

    // Workers
    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS workers (
      id INTEGER PRIMARY KEY,
      name TEXT,
      rut TEXT,
      contractor_id INTEGER
    );
  `);

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

    // Harvest Containers
    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS harvest_containers (
        id INTEGER PRIMARY KEY,
        name TEXT,
        species_id INTEGER
    );
  `);

    // Card Assignments (Local Copy)
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS card_assignments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          worker_id INTEGER,
          card_id INTEGER,
          date TEXT,
          synced INTEGER DEFAULT 0
      );
  `);

    // Attendances (To Sync Up)
    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS attendances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        worker_id INTEGER,
        date TEXT,
        check_in_time TEXT,
        field_id INTEGER,
        task_type_id INTEGER,
        synced INTEGER DEFAULT 0
    );
  `);

    // Harvest Collections (To Sync Up)
    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS harvest_collections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        worker_id INTEGER,
        date TEXT,
        harvest_container_id INTEGER,
        quantity INTEGER,
        field_id INTEGER,
        synced INTEGER DEFAULT 0
    );
  `);

    console.log('Database initialized');
};

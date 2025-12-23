export interface Worker {
    id: number;
    name: string;
    rut: string;
    contractor_id: number;
}

export interface Card {
    id: number;
    code: string;
}

export interface Field {
    id: number;
    name: string;
}

export interface Species {
    id: number;
    name: string;
    harvest_containers?: HarvestContainer[];
}

export interface HarvestContainer {
    id: number;
    name: string;
    species_id: number;
}

export interface CardAssignment {
    id?: number;
    worker_id: number;
    card_id: number;
    date: string;
    synced?: number;
}

export interface Attendance {
    id?: number;
    worker_id: number;
    date: string;
    check_in_time: string;
    field_id: number;
    task_type_id: number;
    synced?: number;
}

export interface HarvestCollection {
    id?: number;
    worker_id: number;
    date: string;
    harvest_container_id: number;
    quantity: number;
    field_id: number;
    synced?: number;
}

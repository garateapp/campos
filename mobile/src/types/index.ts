export interface Worker {
    id: number;
    name: string;
    rut: string;
    contractor_id: number;
    synced?: number;
    is_identity_validated?: number;
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
    deleted_at?: string | null;
    synced?: number;
}

export interface Attendance {
    id?: number;
    worker_id: number;
    date: string;
    check_in_time: string;
    check_out_time?: string | null;
    field_id: number;
    task_type_id: number;
    synced?: number;
}

export interface HarvestCollection {
    id?: number;
    worker_id: number;
    card_id?: number;
    date: string;
    harvest_container_id: number;
    quantity: number;
    field_id: number;
    created_at_ms?: number;
    synced?: number;
}

export interface Crop {
    id?: number;
    name: string;
    species?: string;
    species_id?: number | null;
    variety?: string;
    variety_id?: number | null;
    field_id?: number | null;
    area?: number;
    season?: string;
    synced?: number;
}

export interface Planting {
    id?: number;
    crop_name: string;
    field_id?: number | null;
    planting_date: string;
    density?: number;
    notes?: string;
    synced?: number;
}

export interface SupplyItem {
    id?: number;
    name: string;
    unit?: string;
    quantity: number;
    unit_cost?: number;
    synced?: number;
}

export interface DirectCost {
    id?: number;
    field_id?: number | null;
    category: string;
    amount: number;
    date: string;
    notes?: string;
    synced?: number;
}

export interface LaborPlan {
    id?: number;
    field_id?: number | null;
    task: string;
    scheduled_date: string;
    workers_needed?: number;
    hours?: number;
    notes?: string;
    synced?: number;
}

export interface ProfitabilityEntry {
    field_id: number;
    field_name: string;
    total_costs: number;
    harvest_quantity: number;
    revenue: number;
    margin: number;
}

export interface Contractor {
    id: number;
    name: string;
}

export interface Variety {
    id: number;
    name: string;
    species_id?: number;
}

export interface InputCategory {
    id: number;
    name: string;
}

export interface InputItem {
    id?: number;
    name: string;
    unit?: string;
    current_stock?: number;
    min_stock_alert?: number;
    unit_cost?: number;
    input_category_id?: number;
    field_id?: number | null;
    synced?: number;
}

export interface TaskType {
    id: number;
    name: string;
}

export interface LaborType {
    id: number;
    name: string;
}

export interface UnitOfMeasure {
    id: number;
    name: string;
    code?: string;
}

export interface TaskItem {
    id?: number;
    name: string;
    field_id?: number | null;
    task_type_id?: number | null;
    scheduled_date?: string;
    status?: string;
    notes?: string;
    synced?: number;
}

export interface TaskAssignment {
    id?: number;
    task_id: number;
    worker_id: number;
    hours?: number;
    synced?: number;
}

export interface TaskLog {
    id?: number;
    task_id: number;
    description: string;
    created_at?: string;
    synced?: number;
}

export interface CostItem {
    id?: number;
    field_id?: number | null;
    planting_id?: number | null;
    category?: string;
    amount: number;
    cost_date?: string;
    notes?: string;
    synced?: number;
}

export interface HarvestItem {
    id?: number;
    planting_id?: number | null;
    field_id?: number | null;
    quantity_kg?: number;
    harvest_date?: string;
    synced?: number;
}

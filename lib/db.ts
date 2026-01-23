import { Pool } from 'pg';

// Crear pool de conexiones
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  password_hash: string;
  is_admin: boolean;
  created_at: Date;
}

export interface Supply {
  id: number;
  name: string;
  supply_type: 'water_bottle' | 'dish_soap' | 'cleaning';
  duration_days: number;
  current_user_id: number;
  last_purchase_date: Date | null;
  is_blocked: boolean;
  rotation_order: number[];
  created_at: Date;
  updated_at: Date;
}

export interface SupplyHistory {
  id: number;
  supply_id: number;
  user_id: number;
  purchase_date: Date;
  actual_duration_days: number | null;
  notes: string | null;
  created_at: Date;
}

export interface DishRecord {
  id: number;
  user_id: number;
  record_date: Date;
  action: 'wash' | 'dry' | 'both';
  notes: string | null;
  created_at: Date;
}

// Helper para ejecutar queries
export async function query<T>(
  text: string,
  params?: any[]
): Promise<{ rows: T[] }> {
  try {
    const result = await pool.query(text, params);
    return { rows: result.rows as T[] };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

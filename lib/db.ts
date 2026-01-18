import { sql } from '@vercel/postgres';

export interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  password_hash: string;
  is_admin: boolean;
  notification_days_before: number;
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

export interface NotificationLog {
  id: number;
  supply_id: number;
  user_id: number;
  notification_type: 'reminder' | 'overdue';
  sent_at: Date;
  email_sent: boolean;
  email_error: string | null;
}

// Helper para ejecutar queries
export async function query<T>(
  text: string,
  params?: any[]
): Promise<{ rows: T[] }> {
  try {
    const result = await sql.query(text, params);
    return { rows: result.rows as T[] };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

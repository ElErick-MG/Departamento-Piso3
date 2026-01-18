import { NextResponse } from 'next/server';
import { query, User } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/users - Obtener todos los usuarios
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const result = await query<User>(
      'SELECT id, name, email, username, is_admin, notification_days_before, created_at FROM users ORDER BY name'
    );

    return NextResponse.json({ users: result.rows });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
  }
}

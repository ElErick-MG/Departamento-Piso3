import { NextRequest, NextResponse } from 'next/server';
import { query, Supply, User, SupplyHistory } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { differenceInDays } from 'date-fns';

// GET /api/supplies - Obtener todos los suministros con info de usuario actual
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const result = await query<Supply & { current_user_name: string; current_user_email: string }>(
      `SELECT s.*, u.name as current_user_name, u.email as current_user_email
       FROM supplies s
       LEFT JOIN users u ON s.current_user_id = u.id
       ORDER BY s.id`
    );

    const supplies = result.rows.map(supply => {
      const daysRemaining = supply.last_purchase_date
        ? supply.duration_days - differenceInDays(new Date(), new Date(supply.last_purchase_date))
        : supply.duration_days;

      const expiresAt = supply.last_purchase_date
        ? new Date(new Date(supply.last_purchase_date).getTime() + supply.duration_days * 24 * 60 * 60 * 1000)
        : null;

      return {
        ...supply,
        daysRemaining,
        expiresAt,
        status: daysRemaining < 0 ? 'overdue' : daysRemaining <= 2 ? 'warning' : 'ok',
      };
    });

    return NextResponse.json({ supplies });
  } catch (error) {
    console.error('Error fetching supplies:', error);
    return NextResponse.json({ error: 'Error al obtener suministros' }, { status: 500 });
  }
}

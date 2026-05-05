import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

type WaterBottleStateRow = {
  id: number;
  current_cycle_number: number;
  updated_at: string;
};

type WaterBottleRow = {
  id: number;
  cycle_number: number;
  user_id: number;
  spun_at: string;
  confirmed_at: string | null;
  confirmed_by_user_id: number | null;
};

async function getOrCreateCycleNumber(): Promise<number> {
  const stateResult = await query<WaterBottleStateRow>(
    'SELECT * FROM water_bottle_state LIMIT 1'
  );

  if (stateResult.rows.length > 0) {
    return stateResult.rows[0].current_cycle_number;
  }

  const insertResult = await query<WaterBottleStateRow>(
    `INSERT INTO water_bottle_state (current_cycle_number)
     VALUES (1)
     RETURNING *`
  );

  return insertResult.rows[0].current_cycle_number;
}

// POST /api/water-bottle/confirm - Confirmar compra por asignado
export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const cycleNumber = await getOrCreateCycleNumber();

    const latestResult = await query<WaterBottleRow>(
      `SELECT * FROM water_bottle_roulette
       WHERE cycle_number = $1
       ORDER BY spun_at DESC
       LIMIT 1`,
      [cycleNumber]
    );

    const latest = latestResult.rows[0];

    if (!latest) {
      return NextResponse.json({ error: 'No hay ruleta activa' }, { status: 404 });
    }

    if (latest.confirmed_at) {
      return NextResponse.json({ error: 'La compra ya fue confirmada' }, { status: 409 });
    }

    if (!session.isAdmin && latest.user_id !== session.userId) {
      return NextResponse.json({ error: 'Solo el asignado puede confirmar' }, { status: 403 });
    }

    const updateResult = await query<WaterBottleRow>(
      `UPDATE water_bottle_roulette
       SET confirmed_at = NOW(), confirmed_by_user_id = $1
       WHERE id = $2
       RETURNING *`,
      [session.userId, latest.id]
    );

    return NextResponse.json({
      result: updateResult.rows[0],
    });
  } catch (error) {
    console.error('Error confirming water bottle:', error);
    return NextResponse.json({ error: 'Error al confirmar compra' }, { status: 500 });
  }
}

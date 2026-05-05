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

type UserRow = {
  id: number;
  name: string;
};

async function getOrCreateState(): Promise<WaterBottleStateRow> {
  const stateResult = await query<WaterBottleStateRow>(
    'SELECT * FROM water_bottle_state LIMIT 1'
  );

  if (stateResult.rows.length > 0) {
    return stateResult.rows[0];
  }

  const insertResult = await query<WaterBottleStateRow>(
    `INSERT INTO water_bottle_state (current_cycle_number)
     VALUES (1)
     RETURNING *`
  );

  return insertResult.rows[0];
}

// POST /api/water-bottle/reset - Reiniciar ciclo (solo admin)
export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!session.isAdmin) {
      return NextResponse.json(
        { error: 'Solo administradores pueden reiniciar la ruleta' },
        { status: 403 }
      );
    }

    const state = await getOrCreateState();

    const usersResult = await query<UserRow>(
      'SELECT id, name FROM users ORDER BY id ASC'
    );

    const historyResult = await query<WaterBottleRow>(
      'SELECT * FROM water_bottle_roulette WHERE cycle_number = $1',
      [state.current_cycle_number]
    );

    const purchased = new Set(historyResult.rows.map(row => row.user_id));

    if (usersResult.rows.length === 0 || purchased.size < usersResult.rows.length) {
      return NextResponse.json(
        { error: 'Aun no han comprado todos en el ciclo actual' },
        { status: 400 }
      );
    }

    const nextCycle = state.current_cycle_number + 1;

    await query(
      'UPDATE water_bottle_state SET current_cycle_number = $1, updated_at = NOW() WHERE id = $2',
      [nextCycle, state.id]
    );

    return NextResponse.json({
      success: true,
      cycleNumber: nextCycle,
      message: 'Ruleta reiniciada exitosamente',
    });
  } catch (error) {
    console.error('Error resetting water bottle:', error);
    return NextResponse.json({ error: 'Error al reiniciar ruleta' }, { status: 500 });
  }
}

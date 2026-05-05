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
  user_name: string;
};

type UserRow = {
  id: number;
  name: string;
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

// GET /api/water-bottle - Estado de la ruleta y ciclo actual
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const cycleNumber = await getOrCreateCycleNumber();

    const historyResult = await query<WaterBottleRow>(
      `SELECT wbr.*, u.name as user_name
       FROM water_bottle_roulette wbr
       JOIN users u ON wbr.user_id = u.id
       WHERE wbr.cycle_number = $1
       ORDER BY wbr.spun_at DESC`,
      [cycleNumber]
    );

    const usersResult = await query<UserRow>(
      'SELECT id, name FROM users ORDER BY id ASC'
    );

    const uniquePurchasers = new Set(historyResult.rows.map(row => row.user_id));

    return NextResponse.json({
      cycleNumber,
      history: historyResult.rows,
      users: usersResult.rows,
      cycleComplete: uniquePurchasers.size === usersResult.rows.length && usersResult.rows.length > 0,
    });
  } catch (error) {
    console.error('Error fetching water bottle status:', error);
    return NextResponse.json({ error: 'Error al obtener ruleta' }, { status: 500 });
  }
}

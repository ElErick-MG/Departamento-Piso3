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

function pickRandom(ids: number[]) {
  const index = Math.floor(Math.random() * ids.length);
  return ids[index];
}

// POST /api/water-bottle/spin - Ejecuta ruleta y guarda resultado
export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const cycleNumber = await getOrCreateCycleNumber();

    const usersResult = await query<UserRow>(
      'SELECT id, name FROM users ORDER BY id ASC'
    );
    const users = usersResult.rows;

    if (users.length === 0) {
      return NextResponse.json({ error: 'No hay usuarios disponibles' }, { status: 400 });
    }

    const historyResult = await query<WaterBottleRow>(
      'SELECT * FROM water_bottle_roulette WHERE cycle_number = $1 ORDER BY spun_at DESC',
      [cycleNumber]
    );

    const history = historyResult.rows;
    const lastSpin = history[0];
    const purchased = new Set(history.map(row => row.user_id));

    if (purchased.size === users.length) {
      return NextResponse.json(
        { error: 'Ciclo completo. Un admin debe reiniciar la ruleta.' },
        { status: 409 }
      );
    }

    const eligible = users
      .map(user => user.id)
      .filter(id => !purchased.has(id) && id !== lastSpin?.user_id);

    const fallbackEligible = users
      .map(user => user.id)
      .filter(id => !purchased.has(id));

    if (fallbackEligible.length === 0) {
      return NextResponse.json(
        { error: 'No hay usuarios elegibles para este ciclo.' },
        { status: 409 }
      );
    }

    const selectedUserId = pickRandom(eligible.length > 0 ? eligible : fallbackEligible);

    const insertResult = await query<WaterBottleRow>(
      `INSERT INTO water_bottle_roulette (cycle_number, user_id)
       VALUES ($1, $2)
       RETURNING *`,
      [cycleNumber, selectedUserId]
    );

    const selectedUser = users.find(user => user.id === selectedUserId);

    return NextResponse.json({
      result: insertResult.rows[0],
      user: selectedUser,
      cycleNumber,
    });
  } catch (error) {
    console.error('Error spinning water bottle:', error);
    return NextResponse.json({ error: 'Error al girar la ruleta' }, { status: 500 });
  }
}

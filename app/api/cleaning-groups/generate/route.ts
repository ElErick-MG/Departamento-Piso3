import { NextRequest, NextResponse } from 'next/server';
import { addWeeks, endOfWeek, startOfWeek } from 'date-fns';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { generateNextCleaningGroup } from '@/lib/cleaningGroups';

type CleaningGroupRow = {
  id: number;
  week_start: string;
  week_end: string;
  user_ids: number[];
  group_size: number;
  created_at: string;
};

type UserRow = {
  id: number;
  name: string;
  email: string;
  username: string;
};

function getWeekRangeFrom(date: Date) {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
  return { weekStart, weekEnd };
}

// POST /api/cleaning-groups/generate - Generar grupo de la semana siguiente
export async function POST(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const latestResult = await query<CleaningGroupRow>(
      'SELECT * FROM cleaning_groups ORDER BY week_start DESC LIMIT 1'
    );
    const latestGroup = latestResult.rows[0];

    const baseDate = latestGroup
      ? addWeeks(new Date(latestGroup.week_start), 1)
      : addWeeks(new Date(), 1);
    const { weekStart, weekEnd } = getWeekRangeFrom(baseDate);

    const existingResult = await query<CleaningGroupRow>(
      'SELECT * FROM cleaning_groups WHERE week_start = $1 LIMIT 1',
      [weekStart]
    );

    if (existingResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'Ya existe un grupo para esa semana.' },
        { status: 409 }
      );
    }

    const usersResult = await query<UserRow>(
      'SELECT id, name, email, username FROM users ORDER BY id ASC'
    );

    const lastUserIds = latestGroup?.user_ids ?? [];
    const nextGroup = generateNextCleaningGroup(usersResult.rows, lastUserIds);

    const insertResult = await query<CleaningGroupRow>(
      `INSERT INTO cleaning_groups (week_start, week_end, user_ids, group_size)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [weekStart, weekEnd, nextGroup.userIds, nextGroup.groupSize]
    );

    return NextResponse.json({
      group: insertResult.rows[0],
    });
  } catch (error) {
    console.error('Error generating cleaning group:', error);
    return NextResponse.json(
      { error: 'Error al generar grupo de aseo' },
      { status: 500 }
    );
  }
}

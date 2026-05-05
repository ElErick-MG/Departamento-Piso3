import { NextResponse } from 'next/server';
import { endOfWeek, format, startOfWeek } from 'date-fns';
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

function getWeekRange(date: Date) {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
  return { weekStart, weekEnd };
}

async function fetchCurrentGroup(dateString: string) {
  const currentResult = await query<CleaningGroupRow>(
    'SELECT * FROM cleaning_groups WHERE week_start <= $1 AND week_end >= $1 ORDER BY week_start DESC LIMIT 1',
    [dateString]
  );
  return currentResult.rows[0];
}

// GET /api/cleaning-groups/current - Grupo activo de la semana actual
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const today = new Date();
    const { weekStart, weekEnd } = getWeekRange(today);
    const weekStartString = format(weekStart, 'yyyy-MM-dd');
    const weekEndString = format(weekEnd, 'yyyy-MM-dd');

    let currentGroup = await fetchCurrentGroup(format(today, 'yyyy-MM-dd'));

    if (!currentGroup) {
      const latestResult = await query<CleaningGroupRow>(
        'SELECT * FROM cleaning_groups ORDER BY week_start DESC LIMIT 1'
      );
      const latestGroup = latestResult.rows[0];

      const usersResult = await query<UserRow>(
        'SELECT id, name, email, username FROM users ORDER BY id ASC'
      );

      const lastUserIds = latestGroup?.user_ids ?? [];
      const nextGroup = generateNextCleaningGroup(usersResult.rows, lastUserIds);

      try {
        const insertResult = await query<CleaningGroupRow>(
          `INSERT INTO cleaning_groups (week_start, week_end, user_ids, group_size)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [weekStartString, weekEndString, nextGroup.userIds, nextGroup.groupSize]
        );
        currentGroup = insertResult.rows[0];
      } catch (error) {
        currentGroup = await fetchCurrentGroup(format(today, 'yyyy-MM-dd'));
      }
    }

    if (!currentGroup) {
      return NextResponse.json({ group: null });
    }

    const usersResult = await query<UserRow>(
      'SELECT id, name, email, username FROM users WHERE id = ANY($1::int[]) ORDER BY id ASC',
      [currentGroup.user_ids]
    );

    return NextResponse.json({
      group: currentGroup,
      members: usersResult.rows,
    });
  } catch (error) {
    console.error('Error fetching current cleaning group:', error);
    return NextResponse.json(
      { error: 'Error al obtener grupo actual' },
      { status: 500 }
    );
  }
}

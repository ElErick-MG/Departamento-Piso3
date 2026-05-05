import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

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

// GET /api/cleaning-groups/history - Historial completo
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const groupsResult = await query<CleaningGroupRow>(
      'SELECT * FROM cleaning_groups ORDER BY week_start DESC'
    );

    if (groupsResult.rows.length === 0) {
      return NextResponse.json({ groups: [] });
    }

    const allUserIds = Array.from(
      new Set(groupsResult.rows.flatMap(group => group.user_ids))
    );

    const usersResult = await query<UserRow>(
      'SELECT id, name, email, username FROM users WHERE id = ANY($1::int[])',
      [allUserIds]
    );

    const usersById = new Map(usersResult.rows.map(user => [user.id, user]));

    const groups = groupsResult.rows.map(group => ({
      ...group,
      members: group.user_ids.map(id => usersById.get(id)).filter(Boolean),
    }));

    return NextResponse.json({ groups });
  } catch (error) {
    console.error('Error fetching cleaning group history:', error);
    return NextResponse.json(
      { error: 'Error al obtener historial' },
      { status: 500 }
    );
  }
}

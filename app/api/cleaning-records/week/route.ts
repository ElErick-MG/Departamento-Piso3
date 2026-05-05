import { NextRequest, NextResponse } from 'next/server';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { query, DishRecord } from '@/lib/db';
import { getSession } from '@/lib/auth';

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

function getGuayaquilDate(): Date {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Guayaquil',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(new Date());
  const year = Number(parts.find(part => part.type === 'year')?.value);
  const month = Number(parts.find(part => part.type === 'month')?.value);
  const day = Number(parts.find(part => part.type === 'day')?.value);
  return new Date(year, month - 1, day);
}

function parseDateInput(dateInput: string | null): Date {
  if (!dateInput) {
    return getGuayaquilDate();
  }

  const [year, month, day] = dateInput.split('-').map(Number);
  if (!year || !month || !day) {
    return getGuayaquilDate();
  }

  return new Date(year, month - 1, day);
}

// GET /api/cleaning-records/week?date=YYYY-MM-DD - Registros de la semana actual
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get('date');
    const targetDate = parseDateInput(dateParam);

    const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 });

    const weekStartString = format(weekStart, 'yyyy-MM-dd');
    const weekEndString = format(weekEnd, 'yyyy-MM-dd');

    const recordsResult = await query<DishRecord & { user_name: string }>(
      `SELECT dr.*, u.name as user_name
       FROM dish_records dr
       JOIN users u ON dr.user_id = u.id
       WHERE dr.record_date::date >= $1::date AND dr.record_date::date <= $2::date
       ORDER BY dr.record_date DESC, dr.created_at DESC`,
      [weekStartString, weekEndString]
    );

    const groupResult = await query<CleaningGroupRow>(
      'SELECT * FROM cleaning_groups WHERE week_start <= $1 AND week_end >= $1 ORDER BY week_start DESC LIMIT 1',
      [format(targetDate, 'yyyy-MM-dd')]
    );
    const currentGroup = groupResult.rows[0] || null;

    let members: UserRow[] = [];
    if (currentGroup) {
      const membersResult = await query<UserRow>(
        'SELECT id, name, email, username FROM users WHERE id = ANY($1::int[]) ORDER BY name',
        [currentGroup.user_ids]
      );
      members = membersResult.rows;
    }

    return NextResponse.json({
      records: recordsResult.rows,
      weekStart: weekStartString,
      weekEnd: weekEndString,
      group: currentGroup,
      members,
    });
  } catch (error) {
    console.error('Error fetching cleaning records:', error);
    return NextResponse.json({ error: 'Error al obtener registros' }, { status: 500 });
  }
}

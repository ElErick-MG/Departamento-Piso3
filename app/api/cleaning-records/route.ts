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

const TASK_TYPES = [
  'wash',
  'dry',
  'both',
  'aseo_general',
  'lavar_ducha',
  'limpiar_tacho',
  'limpiar_microondas',
  'lavar_manteles',
] as const;

type TaskType = (typeof TASK_TYPES)[number];

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

function getWeekRange(date: Date) {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
  return { weekStart, weekEnd };
}

async function getCurrentGroup(targetDate: Date) {
  const dateString = format(targetDate, 'yyyy-MM-dd');
  const groupResult = await query<CleaningGroupRow>(
    'SELECT * FROM cleaning_groups WHERE week_start <= $1 AND week_end >= $1 ORDER BY week_start DESC LIMIT 1',
    [dateString]
  );

  return groupResult.rows[0];
}

function isMemberOfGroup(userId: number, group: CleaningGroupRow | undefined) {
  if (!group) {
    return false;
  }

  return group.user_ids.includes(userId);
}

// POST /api/cleaning-records - Registrar tarea de aseo semanal
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { date, action, notes, userId } = await request.json();

    if (!action) {
      return NextResponse.json(
        { error: 'action es requerido' },
        { status: 400 }
      );
    }

    if (!TASK_TYPES.includes(action)) {
      return NextResponse.json(
        { error: 'action no es valida para aseo semanal' },
        { status: 400 }
      );
    }

    const recordDate = parseDateInput(date);
    const { weekStart, weekEnd } = getWeekRange(recordDate);

    const currentGroup = await getCurrentGroup(recordDate);
    const isMember = isMemberOfGroup(session.userId, currentGroup);

    if (!isMember && !session.isAdmin) {
      return NextResponse.json(
        { error: 'Solo el grupo asignado o admin puede registrar' },
        { status: 403 }
      );
    }

    const targetUserId = session.isAdmin && Number.isFinite(Number(userId))
      ? Number(userId)
      : session.userId;

    const dateString = format(recordDate, 'yyyy-MM-dd');
    const weekStartString = format(weekStart, 'yyyy-MM-dd');
    const weekEndString = format(weekEnd, 'yyyy-MM-dd');

    if (dateString < weekStartString || dateString > weekEndString) {
      return NextResponse.json(
        { error: 'La fecha debe estar dentro de la semana actual' },
        { status: 400 }
      );
    }

    await query(
      `INSERT INTO dish_records (user_id, record_date, action, notes)
       VALUES ($1, $2, $3, $4)`,
      [targetUserId, dateString, action, notes || null]
    );

    return NextResponse.json({
      success: true,
      message: 'Registro creado exitosamente',
    });
  } catch (error) {
    console.error('Error creating cleaning record:', error);
    return NextResponse.json({ error: 'Error al crear registro' }, { status: 500 });
  }
}

// DELETE /api/cleaning-records?id=X - Eliminar registro (autor o admin)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 });
    }

    const recordResult = await query<DishRecord>(
      'SELECT * FROM dish_records WHERE id = $1',
      [id]
    );
    const record = recordResult.rows[0];

    if (!record) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    if (!session.isAdmin && record.user_id !== session.userId) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar este registro' },
        { status: 403 }
      );
    }

    await query('DELETE FROM dish_records WHERE id = $1', [id]);

    return NextResponse.json({
      success: true,
      message: 'Registro eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error deleting cleaning record:', error);
    return NextResponse.json({ error: 'Error al eliminar registro' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { query, DishRecord, User } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { es } from 'date-fns/locale';

// GET /api/dishes?week=YYYY-WW - Obtener registros de platos
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const weekParam = searchParams.get('week');
    const dateParam = searchParams.get('date');

    let startDate: Date;
    let endDate: Date;

    if (weekParam) {
      // Formato: YYYY-WW
      const [year, week] = weekParam.split('-').map(Number);
      const firstDayOfYear = new Date(year, 0, 1);
      const daysOffset = (week - 1) * 7;
      startDate = startOfWeek(new Date(firstDayOfYear.getTime() + daysOffset * 24 * 60 * 60 * 1000), { weekStartsOn: 1 });
      endDate = endOfWeek(startDate, { weekStartsOn: 1 });
    } else if (dateParam) {
      const date = new Date(dateParam);
      startDate = startOfWeek(date, { weekStartsOn: 1 });
      endDate = endOfWeek(date, { weekStartsOn: 1 });
    } else {
      // Semana actual por defecto
      startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
      endDate = endOfWeek(new Date(), { weekStartsOn: 1 });
    }

    const result = await query<DishRecord & { user_name: string }>(
      `SELECT dr.*, u.name as user_name
       FROM dish_records dr
       JOIN users u ON dr.user_id = u.id
       WHERE dr.record_date >= $1 AND dr.record_date <= $2
       ORDER BY dr.record_date DESC, dr.created_at DESC`,
      [format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd')]
    );

    return NextResponse.json({
      records: result.rows,
      weekStart: format(startDate, 'yyyy-MM-dd'),
      weekEnd: format(endDate, 'yyyy-MM-dd'),
    });
  } catch (error) {
    console.error('Error fetching dish records:', error);
    return NextResponse.json({ error: 'Error al obtener registros' }, { status: 500 });
  }
}

// POST /api/dishes - Registrar lavado/secado de platos
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { userId, date, action, notes } = await request.json();

    if (!userId || !date || !action) {
      return NextResponse.json(
        { error: 'userId, date y action son requeridos' },
        { status: 400 }
      );
    }

    if (!['wash', 'dry', 'both'].includes(action)) {
      return NextResponse.json(
        { error: 'action debe ser: wash, dry o both' },
        { status: 400 }
      );
    }

    // Insertar registro
    await query(
      `INSERT INTO dish_records (user_id, record_date, action, notes)
       VALUES ($1, $2, $3, $4)`,
      [userId, date, action, notes || null]
    );

    return NextResponse.json({
      success: true,
      message: 'Registro creado exitosamente',
    });
  } catch (error) {
    console.error('Error creating dish record:', error);
    return NextResponse.json({ error: 'Error al crear registro' }, { status: 500 });
  }
}

// DELETE /api/dishes?id=X - Eliminar registro (opcional)
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

    await query('DELETE FROM dish_records WHERE id = $1', [id]);

    return NextResponse.json({
      success: true,
      message: 'Registro eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error deleting dish record:', error);
    return NextResponse.json({ error: 'Error al eliminar registro' }, { status: 500 });
  }
}

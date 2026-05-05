import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

type ReserveRow = {
  id: number;
  user_id: number;
  item_name: string;
  quantity: number;
  category: string;
  notes: string | null;
  status: 'active' | 'consumed';
  purchased_at: string;
  consumed_at: string | null;
  created_at: string;
};

// PATCH /api/reserves/:id - Marcar como consumido
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await context.params;

    const currentResult = await query<ReserveRow>(
      'SELECT * FROM reserves WHERE id = $1',
      [id]
    );

    const current = currentResult.rows[0];

    if (!current) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }

    if (current.status === 'consumed' || current.quantity <= 0) {
      return NextResponse.json({ error: 'La reserva ya esta agotada' }, { status: 409 });
    }

    const nextQuantity = current.quantity - 1;
    const nextStatus: ReserveRow['status'] = nextQuantity <= 0 ? 'consumed' : 'active';
    const consumedAt = nextStatus === 'consumed' ? 'NOW()' : 'NULL';

    const result = await query<ReserveRow>(
      `UPDATE reserves
       SET quantity = $1,
           status = $2,
           consumed_at = ${consumedAt}
       WHERE id = $3
       RETURNING *`,
      [nextQuantity, nextStatus, id]
    );

    return NextResponse.json({ reserve: result.rows[0] });
  } catch (error) {
    console.error('Error updating reserve:', error);
    return NextResponse.json({ error: 'Error al actualizar reserva' }, { status: 500 });
  }
}

// DELETE /api/reserves/:id - Eliminar (solo admin)
export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!session.isAdmin) {
      return NextResponse.json({ error: 'Solo admin puede eliminar' }, { status: 403 });
    }

    const { id } = await context.params;

    await query('DELETE FROM reserves WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting reserve:', error);
    return NextResponse.json({ error: 'Error al eliminar reserva' }, { status: 500 });
  }
}

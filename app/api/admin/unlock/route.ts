import { NextRequest, NextResponse } from 'next/server';
import { query, Supply } from '@/lib/db';
import { getSession } from '@/lib/auth';

// POST /api/admin/unlock - ADMIN forzar desbloqueo de turno
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!session.isAdmin) {
      return NextResponse.json(
        { error: 'Solo administradores pueden desbloquear turnos' },
        { status: 403 }
      );
    }

    const { supplyId, skipToNextUser } = await request.json();

    if (!supplyId) {
      return NextResponse.json({ error: 'supplyId es requerido' }, { status: 400 });
    }

    if (skipToNextUser) {
      // Obtener suministro para avanzar al siguiente
      const supplyResult = await query<Supply>(
        'SELECT * FROM supplies WHERE id = $1',
        [supplyId]
      );

      const supply = supplyResult.rows[0];

      if (supply) {
        const currentIndex = supply.rotation_order.indexOf(supply.current_user_id);
        const nextIndex = (currentIndex + 1) % supply.rotation_order.length;
        const nextUserId = supply.rotation_order[nextIndex];

        await query(
          `UPDATE supplies 
           SET current_user_id = $1, 
               is_blocked = FALSE, 
               last_purchase_date = NOW(),
               updated_at = NOW()
           WHERE id = $2`,
          [nextUserId, supplyId]
        );
      }
    } else {
      // Solo desbloquear sin avanzar turno
      await query(
        'UPDATE supplies SET is_blocked = FALSE, updated_at = NOW() WHERE id = $1',
        [supplyId]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Turno desbloqueado exitosamente',
    });
  } catch (error) {
    console.error('Error unlocking supply:', error);
    return NextResponse.json({ error: 'Error al desbloquear turno' }, { status: 500 });
  }
}

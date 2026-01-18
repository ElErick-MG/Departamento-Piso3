import { NextRequest, NextResponse } from 'next/server';
import { query, Supply, SupplyHistory } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { differenceInDays } from 'date-fns';

// POST /api/supplies/complete - Marcar compra completada con validación secuencial
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { supplyId, notes } = await request.json();

    if (!supplyId) {
      return NextResponse.json({ error: 'supplyId es requerido' }, { status: 400 });
    }

    // Obtener suministro actual
    const supplyResult = await query<Supply>(
      'SELECT * FROM supplies WHERE id = $1',
      [supplyId]
    );

    const supply = supplyResult.rows[0];

    if (!supply) {
      return NextResponse.json({ error: 'Suministro no encontrado' }, { status: 404 });
    }

    // Validación: verificar que sea el turno del usuario actual
    if (supply.current_user_id !== session.userId) {
      return NextResponse.json(
        { error: 'No es tu turno. Solo el usuario asignado puede marcar la compra.' },
        { status: 403 }
      );
    }

    // Validación: verificar si está bloqueado (turno anterior no completado)
    if (supply.is_blocked) {
      return NextResponse.json(
        { error: 'Este turno está bloqueado. El usuario anterior debe completar su compra primero.' },
        { status: 403 }
      );
    }

    // Calcular duración real si hay una compra anterior
    let actualDuration = null;
    if (supply.last_purchase_date) {
      actualDuration = differenceInDays(new Date(), new Date(supply.last_purchase_date));
    }

    // Registrar en historial
    await query(
      `INSERT INTO supply_history (supply_id, user_id, purchase_date, actual_duration_days, notes)
       VALUES ($1, $2, NOW(), $3, $4)`,
      [supplyId, session.userId, actualDuration, notes || null]
    );

    // Encontrar siguiente usuario en la rotación
    const currentIndex = supply.rotation_order.indexOf(supply.current_user_id);
    const nextIndex = (currentIndex + 1) % supply.rotation_order.length;
    const nextUserId = supply.rotation_order[nextIndex];

    // Actualizar suministro: nueva fecha de compra, siguiente usuario
    await query(
      `UPDATE supplies 
       SET last_purchase_date = NOW(), 
           current_user_id = $1, 
           is_blocked = FALSE,
           updated_at = NOW()
       WHERE id = $2`,
      [nextUserId, supplyId]
    );

    return NextResponse.json({
      success: true,
      message: 'Compra registrada exitosamente',
      actualDuration,
    });
  } catch (error) {
    console.error('Error completing supply:', error);
    return NextResponse.json({ error: 'Error al registrar compra' }, { status: 500 });
  }
}

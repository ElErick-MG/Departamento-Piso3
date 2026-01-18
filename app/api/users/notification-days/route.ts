import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

// PATCH /api/users/notification-days - Actualizar días de anticipación para notificaciones
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { userId, notificationDaysBefore } = await request.json();

    if (!userId || notificationDaysBefore === undefined) {
      return NextResponse.json(
        { error: 'userId y notificationDaysBefore son requeridos' },
        { status: 400 }
      );
    }

    if (notificationDaysBefore < 0 || notificationDaysBefore > 30) {
      return NextResponse.json(
        { error: 'notificationDaysBefore debe estar entre 0 y 30' },
        { status: 400 }
      );
    }

    // Verificar permisos: solo puede actualizar su propia config o ser admin
    if (session.userId !== userId && !session.isAdmin) {
      return NextResponse.json(
        { error: 'No tienes permiso para modificar este usuario' },
        { status: 403 }
      );
    }

    await query(
      'UPDATE users SET notification_days_before = $1 WHERE id = $2',
      [notificationDaysBefore, userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Preferencia de notificación actualizada',
    });
  } catch (error) {
    console.error('Error updating notification days:', error);
    return NextResponse.json(
      { error: 'Error al actualizar preferencia' },
      { status: 500 }
    );
  }
}

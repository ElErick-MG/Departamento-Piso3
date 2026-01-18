import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

// PATCH /api/supplies/duration - Ajustar duración de un suministro
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { supplyId, durationDays } = await request.json();

    if (!supplyId || !durationDays || durationDays < 1) {
      return NextResponse.json(
        { error: 'supplyId y durationDays válidos son requeridos' },
        { status: 400 }
      );
    }

    // Actualizar duración
    await query(
      'UPDATE supplies SET duration_days = $1, updated_at = NOW() WHERE id = $2',
      [durationDays, supplyId]
    );

    return NextResponse.json({
      success: true,
      message: 'Duración actualizada exitosamente',
    });
  } catch (error) {
    console.error('Error updating duration:', error);
    return NextResponse.json({ error: 'Error al actualizar duración' }, { status: 500 });
  }
}

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
  user_name: string;
};

// GET /api/reserves?status=active|consumed|all
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const statusParam = request.nextUrl.searchParams.get('status');
    const statusFilter = statusParam && statusParam !== 'all' ? statusParam : null;

    const result = await query<ReserveRow>(
      `SELECT r.*, u.name as user_name
       FROM reserves r
       JOIN users u ON r.user_id = u.id
       WHERE ($1::text IS NULL OR r.status = $1)
       ORDER BY r.purchased_at DESC, r.created_at DESC`,
      [statusFilter]
    );

    return NextResponse.json({ reserves: result.rows });
  } catch (error) {
    console.error('Error fetching reserves:', error);
    return NextResponse.json({ error: 'Error al obtener reservas' }, { status: 500 });
  }
}

// POST /api/reserves - Crear reserva
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { itemName, quantity, category, notes, purchasedAt } = await request.json();

    if (!itemName) {
      return NextResponse.json({ error: 'itemName es requerido' }, { status: 400 });
    }

    const normalizedQuantity = Number.isFinite(Number(quantity)) ? Number(quantity) : 1;
    const normalizedCategory = category?.trim() ? category.trim() : 'otro';
    const normalizedNotes = notes?.trim() ? notes.trim() : null;

    const result = await query<ReserveRow>(
      `INSERT INTO reserves (user_id, item_name, quantity, category, notes, purchased_at)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, NOW()))
       RETURNING *`,
      [session.userId, itemName.trim(), normalizedQuantity, normalizedCategory, normalizedNotes, purchasedAt || null]
    );

    return NextResponse.json({ reserve: result.rows[0] });
  } catch (error) {
    console.error('Error creating reserve:', error);
    return NextResponse.json({ error: 'Error al crear reserva' }, { status: 500 });
  }
}

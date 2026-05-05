'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface ReserveItem {
  id: number;
  user_id: number;
  user_name: string;
  item_name: string;
  quantity: number;
  category: string;
  notes: string | null;
  status: 'active' | 'consumed';
  purchased_at: string;
  consumed_at: string | null;
  created_at: string;
}

interface SessionUser {
  userId: number;
  username: string;
  isAdmin: boolean;
}

type StatusFilter = 'active' | 'consumed' | 'all';

const CATEGORY_OPTIONS = [
  { value: 'limpieza', label: 'Limpieza' },
  { value: 'comida', label: 'Comida' },
  { value: 'higiene', label: 'Higiene' },
  { value: 'otro', label: 'Otro' },
];

export default function ReservesPage() {
  const [reserves, setReserves] = useState<ReserveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionUser | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [formData, setFormData] = useState({
    itemName: '',
    quantity: 1,
    category: 'otro',
    notes: '',
    purchasedAt: format(new Date(), 'yyyy-MM-dd'),
  });
  const router = useRouter();

  useEffect(() => {
    fetchSession();
  }, []);

  useEffect(() => {
    fetchReserves();
  }, [statusFilter]);

  const fetchSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = await response.json();
        setSession(data.user);
      }
    } catch (error) {
      console.error('Error fetching session:', error);
    }
  };

  const fetchReserves = async () => {
    try {
      const response = await fetch(`/api/reserves?status=${statusFilter}`);
      const data = await response.json();
      setReserves(data.reserves || []);
    } catch (error) {
      console.error('Error fetching reserves:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupedReserves = useMemo(() => {
    return reserves.reduce((acc: Record<string, ReserveItem[]>, item) => {
      const key = item.user_name;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {});
  }, [reserves]);

  const handleAddReserve = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.itemName.trim()) {
      alert('Ingresa el nombre del producto.');
      return;
    }

    try {
      const response = await fetch('/api/reserves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName: formData.itemName.trim(),
          quantity: formData.quantity,
          category: formData.category,
          notes: formData.notes.trim() || null,
          purchasedAt: formData.purchasedAt,
        }),
      });

      if (response.ok) {
        setFormData({
          itemName: '',
          quantity: 1,
          category: 'otro',
          notes: '',
          purchasedAt: format(new Date(), 'yyyy-MM-dd'),
        });
        await fetchReserves();
      } else {
        const data = await response.json();
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      alert('❌ Error de conexión');
    }
  };

  const handleConsume = async (id: number) => {
    try {
      const response = await fetch(`/api/reserves/${id}`, {
        method: 'PATCH',
      });
      const data = await response.json();

      if (response.ok) {
        await fetchReserves();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      alert('❌ Error de conexión');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta reserva?')) return;

    try {
      const response = await fetch(`/api/reserves/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (response.ok) {
        await fetchReserves();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      alert('❌ Error de conexión');
    }
  };

  const statusBadge = (status: ReserveItem['status']) => {
    return status === 'consumed'
      ? 'bg-gray-200 text-gray-700'
      : 'bg-green-100 text-green-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                <span className="text-4xl">🧾</span>
                Reservas del departamento
              </h1>
              <p className="text-sm text-gray-600 mt-1">Lista compartida de compras y reservas</p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <span className="text-lg">←</span>
              <span>Dashboard</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="bg-white rounded-2xl shadow-lg border border-blue-100 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Reservas</h2>
              <p className="text-xs sm:text-sm text-gray-500">Comparte lo que compraste para el depa.</p>
            </div>
            <div className="flex items-center gap-2">
              {(['active', 'consumed', 'all'] as StatusFilter[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                    statusFilter === status
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {status === 'active' ? 'Disponibles' : status === 'consumed' ? 'Agotadas' : 'Todas'}
                </button>
              ))}
            </div>
          </div>

          {Object.keys(groupedReserves).length === 0 ? (
            <p className="text-sm text-gray-500">No hay reservas registradas.</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedReserves).map(([userName, items]) => (
                <div key={userName} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-gray-900">{userName}</p>
                    <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      {items.length} item{items.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-blue-100 bg-blue-50 rounded-lg p-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">{item.item_name}</p>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusBadge(item.status)}`}>
                              {item.status === 'active' ? 'Disponible' : 'Agotado'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Cantidad restante: {item.quantity} · Categoria: {item.category}
                          </p>
                          {item.notes && (
                            <p className="text-xs text-gray-600 mt-2 italic">"{item.notes}"</p>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handleConsume(item.id)}
                            disabled={item.status === 'consumed' || item.quantity <= 0}
                            className="text-xs font-semibold px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            Consumir 1
                          </button>
                          {session?.isAdmin && (
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-xs font-semibold px-3 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl shadow-lg border border-blue-100 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Agregar reserva</h2>
          <form onSubmit={handleAddReserve} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Producto</label>
              <input
                type="text"
                value={formData.itemName}
                onChange={(event) => setFormData({ ...formData, itemName: event.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="Ej: Aceite, detergente"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad</label>
                <input
                  type="number"
                  min={1}
                  value={formData.quantity}
                  onChange={(event) => setFormData({ ...formData, quantity: Number(event.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                <select
                  value={formData.category}
                  onChange={(event) => setFormData({ ...formData, category: event.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de compra</label>
              <input
                type="date"
                value={formData.purchasedAt}
                onChange={(event) => setFormData({ ...formData, purchasedAt: event.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notas (opcional)</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="Ej: Promocion 2x1"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-2.5 rounded-lg transition shadow-sm"
            >
              Guardar reserva
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SessionUser {
  userId: number;
  username: string;
  isAdmin: boolean;
}

interface WaterBottleHistoryItem {
  id: number;
  cycle_number: number;
  user_id: number;
  user_name: string;
  spun_at: string;
  confirmed_at: string | null;
  confirmed_by_user_id: number | null;
}

interface WaterBottleUser {
  id: number;
  name: string;
}

interface CleaningGroup {
  id: number;
  week_start: string;
  week_end: string;
  user_ids: number[];
  group_size: number;
}

interface GroupMember {
  id: number;
  name: string;
}

interface ReserveItem {
  id: number;
  user_id: number;
  user_name: string;
  item_name: string;
  quantity: number;
  category: string;
  status: 'active' | 'consumed';
  purchased_at: string;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionUser | null>(null);
  const [waterBottleHistory, setWaterBottleHistory] = useState<WaterBottleHistoryItem[]>([]);
  const [waterBottleUsers, setWaterBottleUsers] = useState<WaterBottleUser[]>([]);
  const [waterBottleCycle, setWaterBottleCycle] = useState<number | null>(null);
  const [waterBottleComplete, setWaterBottleComplete] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rouletteDisplay, setRouletteDisplay] = useState('');
  const [cleaningGroup, setCleaningGroup] = useState<CleaningGroup | null>(null);
  const [cleaningMembers, setCleaningMembers] = useState<GroupMember[]>([]);
  const [recentReserves, setRecentReserves] = useState<ReserveItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (!spinning) {
      setRouletteDisplay(waterBottleHistory[0]?.user_name ?? '');
    }
  }, [spinning, waterBottleHistory]);

  const loadDashboard = async () => {
    setLoading(true);
    await Promise.all([
      fetchSession(),
      fetchWaterBottle(),
      fetchCleaningGroup(),
      fetchReserves(),
    ]);
    setLoading(false);
  };

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

  const fetchWaterBottle = async () => {
    try {
      const response = await fetch('/api/water-bottle');
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      setWaterBottleHistory(data.history || []);
      setWaterBottleUsers(data.users || []);
      setWaterBottleCycle(data.cycleNumber ?? null);
      setWaterBottleComplete(Boolean(data.cycleComplete));
    } catch (error) {
      console.error('Error fetching water bottle:', error);
    }
  };

  const fetchCleaningGroup = async () => {
    try {
      const response = await fetch('/api/cleaning-groups/current');
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      setCleaningGroup(data.group || null);
      setCleaningMembers(data.members || []);
    } catch (error) {
      console.error('Error fetching cleaning group:', error);
    }
  };

  const fetchReserves = async () => {
    try {
      const response = await fetch('/api/reserves?status=active');
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      setRecentReserves((data.reserves || []).slice(0, 5));
    } catch (error) {
      console.error('Error fetching reserves:', error);
    }
  };

  const formatWeekRange = (start: string, end: string) => {
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);
      return `${format(startDate, "d MMM", { locale: es })} - ${format(endDate, "d MMM, yyyy", { locale: es })}`;
    } catch (error) {
      return `${start} - ${end}`;
    }
  };


  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleSpin = async () => {
    if (spinning) return;

    setSpinning(true);
    let index = 0;
    const names = waterBottleUsers.map(user => user.name);
    const interval = setInterval(() => {
      setRouletteDisplay(names.length > 0 ? names[index % names.length] : '...');
      index += 1;
    }, 120);

    try {
      const response = await fetch('/api/water-bottle/spin', { method: 'POST' });
      const data = await response.json();

      if (response.ok) {
        await fetchWaterBottle();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      alert('❌ Error de conexión');
    } finally {
      clearInterval(interval);
      setSpinning(false);
    }
  };

  const handleConfirm = async () => {
    try {
      const response = await fetch('/api/water-bottle/confirm', { method: 'POST' });
      const data = await response.json();

      if (response.ok) {
        alert('✅ Compra confirmada');
        await fetchWaterBottle();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      alert('❌ Error de conexión');
    }
  };

  const handleReset = async () => {
    if (!confirm('¿Reiniciar el ciclo de la ruleta?')) return;

    try {
      const response = await fetch('/api/water-bottle/reset', { method: 'POST' });
      const data = await response.json();

      if (response.ok) {
        alert('✅ Ruleta reiniciada');
        await fetchWaterBottle();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      alert('❌ Error de conexión');
    }
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
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Departamento Piso 3
              </h1>
              {session ? (
                <p className="text-sm sm:text-base mt-1">
                  <span className="text-gray-600">Bienvenido, </span>
                  <span className="font-bold text-blue-600">{session.username.charAt(0).toUpperCase() + session.username.slice(1).toLowerCase()}</span>
                  {session.isAdmin && <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold">Admin</span>}
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Gestión de tareas y turnos</p>
              )}
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => router.push('/settings')}
                className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-gray-700 hover:text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-600 rounded-lg transition-all duration-200 font-medium text-sm flex-1 sm:flex-initial"
              >
                <span className="text-lg">⚙️</span>
                <span className="hidden sm:inline">Ajustes</span>
              </button>
              <button
                onClick={() => router.push('/cleaning')}
                className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-gray-700 hover:text-white hover:bg-gradient-to-r hover:from-green-500 hover:to-green-600 rounded-lg transition-all duration-200 font-medium text-sm flex-1 sm:flex-initial"
              >
                <span className="text-lg">🍽️</span>
                <span className="hidden sm:inline">Aseo</span>
              </button>
              <button
                onClick={() => router.push('/reserves')}
                className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-gray-700 hover:text-white hover:bg-gradient-to-r hover:from-purple-500 hover:to-purple-600 rounded-lg transition-all duration-200 font-medium text-sm flex-1 sm:flex-initial"
              >
                <span className="text-lg">🧾</span>
                <span className="hidden sm:inline">Reservas</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-red-600 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 rounded-lg transition-all duration-200 font-semibold border border-red-200 hover:border-transparent text-sm flex-1 sm:flex-initial"
              >
                <span className="text-lg">🚪</span>
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <section className="mb-8 grid gap-4 lg:grid-cols-[1fr_1.1fr]">
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Grupo de aseo semanal</h2>
              <button
                onClick={() => router.push('/cleaning')}
                className="text-sm text-blue-600 hover:text-blue-800 transition"
              >
                Ver detalles
              </button>
            </div>
            {cleaningGroup ? (
              <div>
                <p className="text-sm text-gray-600">Semana activa</p>
                <p className="text-base font-semibold text-gray-900 mt-1">
                  {cleaningMembers.length > 0
                    ? cleaningMembers.map(member => member.name).join(', ')
                    : 'Grupo asignado'}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {formatWeekRange(cleaningGroup.week_start, cleaningGroup.week_end)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Sin grupo asignado para esta semana.</p>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Reservas recientes</h2>
              <button
                onClick={() => router.push('/reserves')}
                className="text-sm text-blue-600 hover:text-blue-800 transition"
              >
                Ver todas
              </button>
            </div>
            {recentReserves.length === 0 ? (
              <p className="text-sm text-gray-500">No hay reservas activas.</p>
            ) : (
              <div className="space-y-2">
                {recentReserves.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.item_name}</p>
                      <p className="text-xs text-gray-500">{item.user_name} · {item.quantity} uds · {item.category}</p>
                    </div>
                    <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      Disponible
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mb-8 bg-white rounded-2xl shadow-lg border border-blue-100 p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">🎡</span>
                Ruleta del botellon
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Ciclo actual: {waterBottleCycle ?? '—'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleSpin}
                disabled={spinning || waterBottleUsers.length === 0 || waterBottleComplete}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow-sm disabled:opacity-50"
              >
                {spinning ? 'Girando...' : 'Girar ruleta'}
              </button>
              <button
                onClick={handleConfirm}
                disabled={waterBottleHistory.length === 0}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold px-4 py-2 rounded-lg shadow-sm disabled:opacity-50"
              >
                Confirmar compra
              </button>
              {session?.isAdmin && (
                <button
                  onClick={handleReset}
                  disabled={!waterBottleComplete}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold px-4 py-2 rounded-lg shadow-sm disabled:opacity-50"
                >
                  Reset ciclo
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-4 flex flex-col items-center justify-center text-center">
              <p className="text-xs uppercase tracking-wider text-blue-600 font-semibold">Resultado</p>
              <div className="mt-3 text-2xl sm:text-3xl font-bold text-gray-900 min-h-[2.5rem]">
                {rouletteDisplay || waterBottleHistory[0]?.user_name || '—'}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {waterBottleHistory[0]?.confirmed_at ? 'Compra confirmada' : 'Pendiente de confirmacion'}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-blue-100 p-4 lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-900">Historial del ciclo</p>
                {waterBottleComplete && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Ciclo completo</span>
                )}
              </div>
              <div className="space-y-2 max-h-56 overflow-auto pr-2">
                {waterBottleHistory.length === 0 ? (
                  <p className="text-sm text-gray-500">Aun no hay giros registrados.</p>
                ) : (
                  waterBottleHistory.map(item => (
                    <div key={item.id} className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.user_name}</p>
                        <p className="text-xs text-gray-500">{new Date(item.spun_at).toLocaleString()}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${item.confirmed_at ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {item.confirmed_at ? 'Confirmado' : 'Pendiente'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

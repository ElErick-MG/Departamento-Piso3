'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Supply {
  id: number;
  name: string;
  supply_type: string;
  duration_days: number;
  current_user_id: number;
  current_user_name: string;
  daysRemaining: number;
  expiresAt: string;
  status: 'ok' | 'warning' | 'overdue';
  is_blocked: boolean;
}

interface SessionUser {
  userId: number;
  username: string;
  isAdmin: boolean;
}

export default function DashboardPage() {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionUser | null>(null);
  const [completing, setCompleting] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchSupplies();
    fetchSession();
  }, []);

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

  const fetchSupplies = async () => {
    try {
      const response = await fetch('/api/supplies');
      const data = await response.json();
      setSupplies(data.supplies || []);
    } catch (error) {
      console.error('Error fetching supplies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (supplyId: number) => {
    setCompleting(supplyId);
    try {
      const response = await fetch('/api/supplies/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplyId }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ Compra registrada exitosamente');
        fetchSupplies();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      alert('❌ Error de conexión');
    } finally {
      setCompleting(null);
    }
  };

  const handleUnlock = async (supplyId: number) => {
    if (!confirm('¿Seguro que quieres desbloquear y avanzar este turno?')) return;

    try {
      const response = await fetch('/api/admin/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplyId, skipToNextUser: true }),
      });

      if (response.ok) {
        alert('✅ Turno desbloqueado y avanzado');
        fetchSupplies();
      } else {
        const data = await response.json();
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      alert('❌ Error de conexión');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'bg-green-100 border-green-300';
      case 'warning': return 'bg-yellow-100 border-yellow-300';
      case 'overdue': return 'bg-red-100 border-red-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'ok': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'overdue': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getProgressPercentage = (daysRemaining: number, duration: number) => {
    const percentage = (daysRemaining / duration) * 100;
    return Math.max(0, Math.min(100, percentage));
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
                onClick={() => router.push('/dishes')}
                className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-gray-700 hover:text-white hover:bg-gradient-to-r hover:from-green-500 hover:to-green-600 rounded-lg transition-all duration-200 font-medium text-sm flex-1 sm:flex-initial"
              >
                <span className="text-lg">🍽️</span>
                <span className="hidden sm:inline">Platos</span>
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
        <div className="mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Turnos de Compra</h2>
          <p className="text-gray-600 text-xs sm:text-sm">
            Cada persona debe completar su turno antes que el siguiente pueda marcar
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {supplies.map((supply) => {
            const isMyTurn = session?.userId === supply.current_user_id;
            const percentage = getProgressPercentage(supply.daysRemaining, supply.duration_days);

            return (
              <div
                key={supply.id}
                className={`rounded-xl border-2 p-6 shadow-sm transition ${getStatusColor(supply.status)}`}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{supply.name}</h3>
                    <p className="text-sm text-gray-600">Dura {supply.duration_days} días</p>
                  </div>
                  {supply.status === 'overdue' && (
                    <span className="text-2xl">⚠️</span>
                  )}
                  {supply.status === 'warning' && (
                    <span className="text-2xl">⏰</span>
                  )}
                  {supply.status === 'ok' && (
                    <span className="text-2xl">✅</span>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium">
                      {supply.daysRemaining > 0 ? `${supply.daysRemaining} días restantes` : 'VENCIDO'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${getProgressColor(supply.status)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {/* Current User */}
                <div className="bg-white bg-opacity-60 rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-600 mb-1">Turno actual:</p>
                  <p className="font-semibold text-gray-900">
                    {supply.current_user_name}
                    {isMyTurn && <span className="ml-2 text-blue-600">← Tú</span>}
                  </p>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  {isMyTurn && !supply.is_blocked && (
                    <button
                      onClick={() => handleComplete(supply.id)}
                      disabled={completing === supply.id}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50"
                    >
                      {completing === supply.id ? 'Registrando...' : '✓ Ya compré'}
                    </button>
                  )}

                  {isMyTurn && supply.is_blocked && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                      🔒 Turno bloqueado. El turno anterior debe completarse primero.
                    </div>
                  )}

                  {!isMyTurn && (
                    <div className="text-center text-sm text-gray-600 py-2">
                      No es tu turno
                    </div>
                  )}

                  {session?.isAdmin && (
                    <button
                      onClick={() => handleUnlock(supply.id)}
                      className="w-full bg-purple-100 hover:bg-purple-200 text-purple-800 font-medium py-2 px-4 rounded-lg transition text-sm"
                    >
                      🔓 Forzar siguiente turno (ADMIN)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

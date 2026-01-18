'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Supply {
  id: number;
  name: string;
  duration_days: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  notification_days_before: number;
  is_admin: boolean;
}

export default function SettingsPage() {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [suppliesRes, usersRes, sessionRes] = await Promise.all([
        fetch('/api/supplies'),
        fetch('/api/users'),
        fetch('/api/auth/session'),
      ]);

      const suppliesData = await suppliesRes.json();
      const usersData = await usersRes.json();
      const sessionData = await sessionRes.json();

      setSupplies(suppliesData.supplies || []);
      setUsers(usersData.users || []);
      
      if (sessionData.user) {
        const user = usersData.users?.find((u: User) => u.id === sessionData.user.userId);
        setCurrentUser(user || null);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDuration = async (supplyId: number, newDuration: number) => {
    if (newDuration < 1 || newDuration > 365) {
      alert('La duración debe estar entre 1 y 365 días');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/supplies/duration', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplyId, durationDays: newDuration }),
      });

      if (response.ok) {
        alert('✅ Duración actualizada');
        fetchData();
      } else {
        const data = await response.json();
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      alert('❌ Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateNotificationDays = async (userId: number, days: number) => {
    if (days < 0 || days > 30) {
      alert('Los días deben estar entre 0 y 30');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/users/notification-days', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, notificationDaysBefore: days }),
      });

      if (response.ok) {
        alert('✅ Preferencia de notificación actualizada');
        fetchData();
      } else {
        const data = await response.json();
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      alert('❌ Error de conexión');
    } finally {
      setSaving(false);
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
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">⚙️ Configuración</h1>
              <p className="text-sm text-gray-600">Ajusta duraciones y preferencias</p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-blue-600 hover:text-blue-800 transition font-medium"
            >
              ← Volver al Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Duraciones de Suministros */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">📦 Duraciones de Suministros</h2>
          <p className="text-sm text-gray-600 mb-6">
            Ajusta las duraciones basándote en el consumo real del departamento
          </p>
          
          <div className="space-y-4">
            {supplies.map((supply) => (
              <div key={supply.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">{supply.name}</p>
                  <p className="text-sm text-gray-600">Duración actual: {supply.duration_days} días</p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    defaultValue={supply.duration_days}
                    id={`duration-${supply.id}`}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById(`duration-${supply.id}`) as HTMLInputElement;
                      handleUpdateDuration(supply.id, parseInt(input.value));
                    }}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50"
                  >
                    Actualizar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Preferencias de Notificación */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">🔔 Preferencias de Notificación</h2>
          <p className="text-sm text-gray-600 mb-6">
            Configura cuántos días antes quieres recibir recordatorios por email
          </p>

          {currentUser && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="font-semibold text-blue-900 mb-2">Tu configuración actual:</p>
              <div className="flex items-center justify-between">
                <p className="text-sm text-blue-800">
                  Recibes notificaciones <strong>{currentUser.notification_days_before} días antes</strong> del vencimiento
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="30"
                    defaultValue={currentUser.notification_days_before}
                    id={`notif-${currentUser.id}`}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById(`notif-${currentUser.id}`) as HTMLInputElement;
                      handleUpdateNotificationDays(currentUser.id, parseInt(input.value));
                    }}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50"
                  >
                    Actualizar
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentUser?.is_admin && (
            <>
              <div className="border-t border-gray-200 my-6"></div>
              <p className="text-xs font-semibold text-purple-700 mb-4">PANEL ADMIN - Todos los usuarios:</p>
              <div className="space-y-3">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {user.name}
                        {user.is_admin && <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">ADMIN</span>}
                      </p>
                      <p className="text-xs text-gray-600">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">{user.notification_days_before} días</span>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        defaultValue={user.notification_days_before}
                        id={`admin-notif-${user.id}`}
                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      />
                      <button
                        onClick={() => {
                          const input = document.getElementById(`admin-notif-${user.id}`) as HTMLInputElement;
                          handleUpdateNotificationDays(user.id, parseInt(input.value));
                        }}
                        disabled={saving}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-1 px-3 rounded-lg transition disabled:opacity-50"
                      >
                        ✓
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Información */}
        <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
          <h3 className="font-bold text-blue-900 mb-3">💡 Tips:</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Las duraciones se ajustan automáticamente según el consumo real registrado</li>
            <li>• Las notificaciones se envían a las 9:00 AM todos los días</li>
            <li>• Configura 0 días para recibir notificación solo el día del vencimiento</li>
            <li>• Configura 2-3 días para tener tiempo suficiente de comprar</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

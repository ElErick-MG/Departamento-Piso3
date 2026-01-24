'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, startOfWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface DishRecord {
  id: number;
  user_id: number;
  user_name: string;
  record_date: string;
  action: 'wash' | 'dry' | 'both';
  notes: string | null;
  created_at: string;
}

interface User {
  id: number;
  name: string;
}

export default function DishesPage() {
  const [records, setRecords] = useState<DishRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    action: 'wash' as 'wash' | 'dry' | 'both',
    notes: '',
  });
  const router = useRouter();

  useEffect(() => {
    fetchData();
    fetchSession();
  }, [weekStart]);

  const fetchSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = await response.json();
        setCurrentUserId(data.user.userId);
        setIsAdmin(data.user.isAdmin);
      }
    } catch (error) {
      console.error('Error fetching session:', error);
    }
  };

  const fetchData = async () => {
    try {
      const weekParam = format(weekStart, 'yyyy-MM-dd');
      const [dishesRes, usersRes] = await Promise.all([
        fetch(`/api/dishes?date=${weekParam}`),
        fetch('/api/users'),
      ]);

      const dishesData = await dishesRes.json();
      const usersData = await usersRes.json();

      console.log('📅 Semana solicitada:', weekParam);
      console.log('📊 Registros recibidos:', dishesData.records);
      console.log('👥 Usuarios:', usersData.users);

      setRecords(dishesData.records || []);
      setUsers(usersData.users || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.userId || !formData.action) {
      alert('Completa todos los campos requeridos');
      return;
    }

    try {
      const response = await fetch('/api/dishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: parseInt(formData.userId),
          date: format(new Date(), 'yyyy-MM-dd'), // Siempre fecha actual
          action: formData.action,
          notes: formData.notes || null,
        }),
      });

      if (response.ok) {
        // Primero refrescar los datos
        await fetchData();
        // Luego cerrar modal y mostrar mensaje
        setShowAddModal(false);
        setFormData({
          userId: '',
          date: format(new Date(), 'yyyy-MM-dd'),
          action: 'wash',
          notes: '',
        });
        alert('✅ Registro creado exitosamente');
      } else {
        const data = await response.json();
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      alert('❌ Error de conexión');
    }
  };

  const handleDeleteRecord = async (recordId: number) => {
    if (!confirm('¿Eliminar este registro?')) return;

    try {
      const response = await fetch(`/api/dishes?id=${recordId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchData();
        alert('✅ Registro eliminado');
      } else {
        const data = await response.json();
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      alert('❌ Error de conexión');
    }
  };

  const getRecordsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return records.filter((r) => {
      // Extraer solo la parte de fecha (YYYY-MM-DD) ignorando hora
      const recordDate = r.record_date.split('T')[0];
      return recordDate === dateStr;
    });
  };

  const getActionEmoji = (action: string) => {
    switch (action) {
      case 'wash': return '🧽';
      case 'dry': return '🧻';
      case 'both': return '🧽🧻';
      default: return '❓';
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'wash': return 'Lavar';
      case 'dry': return 'Secar';
      case 'both': return 'Lavar y Secar';
      default: return action;
    }
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
                <span className="text-4xl">🍽️</span>
                Registro de Platos
              </h1>
              <p className="text-sm text-gray-600 mt-1">Quién lava y seca cada día</p>
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Week Navigation */}
        <div className="flex justify-between items-center mb-6 bg-gradient-to-r from-white to-blue-50 rounded-xl shadow-md border-2 border-blue-100 p-5">
          <button
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            className="bg-gradient-to-r from-gray-100 to-gray-200 hover:from-blue-500 hover:to-blue-600 hover:text-white text-gray-700 font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
          >
            ← Semana Anterior
          </button>
          <div className="text-center">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Semana del</p>
            <p className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mt-1">
              {format(weekStart, "d 'de' MMMM", { locale: es })} - {format(addDays(weekStart, 6), "d 'de' MMMM, yyyy", { locale: es })}
            </p>
          </div>
          <button
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            className="bg-gradient-to-r from-gray-100 to-gray-200 hover:from-blue-500 hover:to-blue-600 hover:text-white text-gray-700 font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Semana Siguiente →
          </button>
        </div>

        {/* Add Button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <span className="text-2xl">+</span>
            <span>Agregar Registro</span>
          </button>
        </div>

        {/* Week Calendar */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weekDays.map((day) => {
            const dayRecords = getRecordsForDay(day);
            const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

            return (
              <div
                key={day.toISOString()}
                className={`bg-white rounded-xl shadow-sm border-2 p-4 ${
                  isToday ? 'border-blue-500' : 'border-gray-200'
                }`}
              >
                <div className="text-center mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    {format(day, 'EEEE', { locale: es })}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {format(day, 'd')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(day, 'MMM', { locale: es })}
                  </p>
                </div>

                <div className="space-y-2">
                  {dayRecords.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">Sin registros</p>
                  ) : (
                    dayRecords.map((record) => (
                      <div
                        key={record.id}
                        className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200 relative group"
                      >
                        {(record.user_id === currentUserId || isAdmin) && (
                          <button
                            onClick={() => handleDeleteRecord(record.id)}
                            className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white text-xs w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 transition"
                            title="Eliminar"
                          >
                            ×
                          </button>
                        )}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">{getActionEmoji(record.action)}</span>
                          <p className="text-sm font-semibold text-gray-900">{record.user_name}</p>
                        </div>
                        <p className="text-xs text-gray-600">{getActionText(record.action)}</p>
                        {record.notes && (
                          <p className="text-xs text-gray-500 mt-1 italic">"{record.notes}"</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-8 bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-lg border-2 border-blue-100 p-6">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-6 flex items-center gap-2">
            <span className="text-3xl">📊</span>
            Resumen de la Semana
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {users.map((user) => {
              const userRecords = records.filter((r) => r.user_id === user.id);
              const washCount = userRecords.filter((r) => r.action === 'wash' || r.action === 'both').length;
              const dryCount = userRecords.filter((r) => r.action === 'dry' || r.action === 'both').length;

              return (
                <div key={user.id} className="bg-gradient-to-br from-white to-blue-50 rounded-xl p-5 shadow-md border border-blue-200 hover:shadow-lg transition-all duration-200">
                  <p className="font-bold text-lg text-gray-900 mb-3 pb-2 border-b-2 border-blue-200">{user.name}</p>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700 flex items-center gap-2">
                      <span className="text-lg">🧽</span>
                      <span>Lavó: <span className="font-bold text-blue-600">{washCount}</span> veces</span>
                    </p>
                    <p className="text-sm text-gray-700 flex items-center gap-2">
                      <span className="text-lg">🧻</span>
                      <span>Secó: <span className="font-bold text-green-600">{dryCount}</span> veces</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Agregar Registro</h2>
            
            <form onSubmit={handleAddRecord} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Persona</label>
                <select
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  required
                >
                  <option value="">Selecciona...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Acción</label>
                <select
                  value={formData.action}
                  onChange={(e) => setFormData({ ...formData, action: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  required
                >
                  <option value="wash">🧽 Lavar</option>
                  <option value="dry">🧻 Secar</option>
                  <option value="both">🧽🧻 Lavar y Secar</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notas (opcional)</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="Ej: Solo platos del desayuno"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addDays, format, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

interface CleaningRecord {
  id: number;
  user_id: number;
  user_name: string;
  record_date: string;
  action: CleaningTask;
  notes: string | null;
  created_at: string;
}

interface GroupMember {
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

type CleaningTask =
  | 'wash'
  | 'dry'
  | 'both'
  | 'aseo_general'
  | 'lavar_ducha'
  | 'limpiar_tacho'
  | 'limpiar_microondas'
  | 'lavar_manteles';

type SessionUser = {
  userId: number;
  username: string;
  isAdmin: boolean;
};

const TASK_OPTIONS: { value: CleaningTask; label: string; emoji: string }[] = [
  { value: 'wash', label: 'Lavar platos', emoji: '🧽' },
  { value: 'dry', label: 'Secar platos', emoji: '🧻' },
  { value: 'both', label: 'Lavar y secar', emoji: '🧽🧻' },
  { value: 'aseo_general', label: 'Aseo general', emoji: '🧼' },
  { value: 'lavar_ducha', label: 'Lavar la ducha', emoji: '🚿' },
  { value: 'limpiar_tacho', label: 'Limpiar tacho / cambiar funda', emoji: '🗑️' },
  { value: 'limpiar_microondas', label: 'Limpieza microondas', emoji: '🔥' },
  { value: 'lavar_manteles', label: 'Lavar manteles', emoji: '🧺' },
];

export default function CleaningPage() {
  const [records, setRecords] = useState<CleaningRecord[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [group, setGroup] = useState<CleaningGroup | null>(null);
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [session, setSession] = useState<SessionUser | null>(null);
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    action: 'aseo_general' as CleaningTask,
    notes: '',
  });
  const router = useRouter();

  const canRecord = useMemo(() => {
    if (!session) {
      return false;
    }
    if (session.isAdmin) {
      return true;
    }
    if (!group) {
      return false;
    }
    return group.user_ids.includes(session.userId);
  }, [group, session]);

  useEffect(() => {
    fetchSession();
  }, []);

  useEffect(() => {
    fetchData();
  }, [weekStart]);

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

  const fetchData = async () => {
    try {
      const weekParam = format(weekStart, 'yyyy-MM-dd');
      const currentWeekParam = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

      if (weekParam === currentWeekParam) {
        await fetch('/api/cleaning-groups/current');
      }

      const response = await fetch(`/api/cleaning-records/week?date=${weekParam}`);
      const data = await response.json();

      setRecords(data.records || []);
      setMembers(data.members || []);
      setGroup(data.group || null);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.action) {
      alert('Completa todos los campos requeridos');
      return;
    }

    try {
      const response = await fetch('/api/cleaning-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formData.date,
          action: formData.action,
          notes: formData.notes || null,
        }),
      });

      if (response.ok) {
        await fetchData();
        setShowAddModal(false);
        setFormData(current => ({
          ...current,
          date: format(new Date(), 'yyyy-MM-dd'),
          action: 'aseo_general',
          notes: '',
        }));
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
      const response = await fetch(`/api/cleaning-records?id=${recordId}`, {
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
    return records.filter((record) => record.record_date.split('T')[0] === dateStr);
  };

  const getTaskLabel = (action: CleaningTask) => {
    return TASK_OPTIONS.find(task => task.value === action)?.label ?? action;
  };

  const getTaskEmoji = (action: CleaningTask) => {
    return TASK_OPTIONS.find(task => task.value === action)?.emoji ?? '🧽';
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
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
                <span className="text-4xl">🧹</span>
                Aseo semanal
              </h1>
              <p className="text-sm text-gray-600 mt-1">Registro diario de tareas del grupo</p>
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

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-4 sm:mb-6 bg-white border border-blue-100 rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-blue-600 font-semibold">Grupo asignado</p>
              {group ? (
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {members.length > 0 ? members.map(member => member.name).join(', ') : 'Grupo en curso'}
                </p>
              ) : (
                <p className="text-sm text-gray-600 mt-1">Sin grupo asignado para esta semana</p>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-blue-600 font-semibold">Semana</p>
              <p className="text-sm sm:text-base font-bold text-gray-900 mt-1">
                {format(weekStart, "d 'de' MMMM", { locale: es })} - {format(addDays(weekStart, 6), "d 'de' MMMM, yyyy", { locale: es })}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4 sm:mb-6 bg-gradient-to-r from-white to-blue-50 rounded-xl shadow-md border-2 border-blue-100 p-3 sm:p-5">
          <button
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            className="w-full sm:w-auto bg-gradient-to-r from-gray-100 to-gray-200 hover:from-blue-500 hover:to-blue-600 hover:text-white text-gray-700 font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md text-sm sm:text-base"
          >
            ← <span className="hidden sm:inline">Semana Anterior</span><span className="sm:hidden">Anterior</span>
          </button>
          <div className="text-center flex-1">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Semana del</p>
            <p className="text-sm sm:text-base lg:text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mt-1">
              <span className="hidden sm:inline">{format(weekStart, "d 'de' MMMM", { locale: es })} - {format(addDays(weekStart, 6), "d 'de' MMMM, yyyy", { locale: es })}</span>
              <span className="sm:hidden">{format(weekStart, "d MMM", { locale: es })} - {format(addDays(weekStart, 6), "d MMM yyyy", { locale: es })}</span>
            </p>
          </div>
          <button
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            className="w-full sm:w-auto bg-gradient-to-r from-gray-100 to-gray-200 hover:from-blue-500 hover:to-blue-600 hover:text-white text-gray-700 font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md text-sm sm:text-base"
          >
            <span className="hidden sm:inline">Semana Siguiente</span><span className="sm:hidden">Siguiente</span> →
          </button>
        </div>

        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-sm text-gray-600">
            {canRecord
              ? 'Puedes registrar tareas de aseo esta semana.'
              : 'Solo el grupo asignado o admin puede registrar.'}
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            disabled={!canRecord}
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-2.5 sm:py-3 px-5 sm:px-8 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-xl sm:text-2xl">+</span>
            <span><span className="hidden sm:inline">Agregar </span>Registro</span>
          </button>
        </div>

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
                  {dayRecords.length > 0 && (
                    <span className="inline-block mt-2 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      {dayRecords.length} registro{dayRecords.length === 1 ? '' : 's'}
                    </span>
                  )}
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
                        {(record.user_id === session?.userId || session?.isAdmin) && (
                          <button
                            onClick={() => handleDeleteRecord(record.id)}
                            className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white text-xs w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 transition"
                            title="Eliminar"
                          >
                            ×
                          </button>
                        )}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">{getTaskEmoji(record.action)}</span>
                          <p className="text-sm font-semibold text-gray-900">{record.user_name}</p>
                        </div>
                        <p className="text-xs text-gray-600">{getTaskLabel(record.action)}</p>
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

        <div className="mt-6 sm:mt-8 bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-lg border-2 border-blue-100 p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4 sm:mb-6 flex items-center gap-2">
            <span className="text-2xl sm:text-3xl">📊</span>
            <span>Resumen del grupo</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {members.map((member) => {
              const memberRecords = records.filter((record) => record.user_id === member.id);

              return (
                <div key={member.id} className="bg-gradient-to-br from-white to-blue-50 rounded-xl p-5 shadow-md border border-blue-200 hover:shadow-lg transition-all duration-200">
                  <p className="font-bold text-lg text-gray-900 mb-3 pb-2 border-b-2 border-blue-200">{member.name}</p>
                  <p className="text-sm text-gray-700">
                    Total registros: <span className="font-bold text-blue-600">{memberRecords.length}</span>
                  </p>
                  <div className="mt-3 space-y-1">
                    {TASK_OPTIONS.map(task => {
                      const count = memberRecords.filter(record => record.action === task.value).length;
                      return (
                        <p key={task.value} className="text-xs text-gray-600 flex items-center gap-2">
                          <span>{task.emoji}</span>
                          <span>{task.label}:</span>
                          <span className="font-semibold text-gray-900">{count}</span>
                        </p>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Agregar Registro</h2>

            <form onSubmit={handleAddRecord} className="space-y-4">
              <div className="text-sm text-gray-600">
                Registras como <span className="font-semibold text-gray-900">{session?.username ?? 'usuario'}</span>.
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tarea</label>
                <select
                  value={formData.action}
                  onChange={(e) => setFormData({ ...formData, action: e.target.value as CleaningTask })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  required
                >
                  {TASK_OPTIONS.map((task) => (
                    <option key={task.value} value={task.value}>
                      {task.emoji} {task.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notas (opcional)</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="Ej: Incluye platos y superficies"
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

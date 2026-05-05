'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface SessionUser {
  userId: number;
  username: string;
  isAdmin: boolean;
}

export default function SettingsPage() {
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = await response.json();
        setSessionUser(data.user || null);
      }
    } catch (error) {
      console.error('Error fetching session:', error);
    } finally {
      setLoading(false);
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
              <p className="text-sm text-gray-600">Preferencias generales del sistema</p>
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
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">👤 Sesión activa</h2>
          <p className="text-sm text-gray-600 mb-4">
            Informacion del usuario que esta conectado en este momento.
          </p>
          {sessionUser ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 font-semibold">
                Usuario: <span className="font-bold">{sessionUser.username}</span>
              </p>
              <p className="text-xs text-blue-800 mt-2">
                Rol: {sessionUser.isAdmin ? 'Admin' : 'Miembro'}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No se pudo cargar la sesión.</p>
          )}
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">🧭 Navegacion rapida</h2>
          <p className="text-sm text-gray-600 mb-6">
            Accesos directos a los modulos principales.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => router.push('/cleaning')}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              Ir a Aseo semanal
            </button>
            <button
              onClick={() => router.push('/reserves')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              Ir a Reservas
            </button>
          </div>
        </section>

        <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
          <h3 className="font-bold text-blue-900 mb-3">🧹 Mantenimiento</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• La semana de aseo se calcula de lunes a domingo.</li>
            <li>• El grupo de aseo se genera automaticamente al entrar en /cleaning.</li>
            <li>• Cualquier recomendación, fallo o duda puede comunicarse con el Admin Erick</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

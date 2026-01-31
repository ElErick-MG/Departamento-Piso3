import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'fallback-secret-key-change-in-production'
);

export interface SessionPayload {
  userId: number;
  username: string;
  isAdmin: boolean;
  expiresAt: Date;
}

// Crear token JWT
export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);
}

// Verificar y decodificar token JWT
export async function decrypt(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionPayload;
  } catch (error) {
    console.error('Failed to verify session:', error);
    return null;
  }
}

// Crear sesión
export async function createSession(userId: number, username: string, isAdmin: boolean) {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
  const session = await encrypt({ userId, username, isAdmin, expiresAt });
  
  const cookieStore = await cookies();
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

// Obtener sesión actual
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  
  if (!sessionCookie?.value) {
    return null;
  }
  
  return decrypt(sessionCookie.value);
}

// Eliminar sesión
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

// Hash de password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verificar password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

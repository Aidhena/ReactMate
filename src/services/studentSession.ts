import { Capacitor, registerPlugin } from '@capacitor/core';
import type { StudentSnapshot } from './kasMateApi';

export interface PersistedStudentSession {
  token: string;
  snapshot: StudentSnapshot;
}

interface SecureSessionPlugin {
  saveSession(options: { value: string }): Promise<void>;
  loadSession(): Promise<{ value: string | null }>;
  clearSession(): Promise<void>;
}

const secureSession = registerPlugin<SecureSessionPlugin>('KasMateSession');
const WEB_SESSION_KEY = 'kasmate_student_session';

function parseSession(value: string | null | undefined): PersistedStudentSession | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<PersistedStudentSession>;
    if (
      typeof parsed.token !== 'string' ||
      !parsed.snapshot?.profile ||
      !parsed.snapshot.summary ||
      !Array.isArray(parsed.snapshot.paymentRequests)
    ) {
      return null;
    }
    return parsed as PersistedStudentSession;
  } catch {
    return null;
  }
}

export async function loadStudentSession(): Promise<PersistedStudentSession | null> {
  if (Capacitor.getPlatform() === 'android') {
    try {
      const result = await secureSession.loadSession();
      return parseSession(result.value);
    } catch {
      await secureSession.clearSession().catch(() => undefined);
      return null;
    }
  }

  try {
    return parseSession(sessionStorage.getItem(WEB_SESSION_KEY));
  } catch {
    return null;
  }
}

export async function saveStudentSession(session: PersistedStudentSession): Promise<void> {
  const value = JSON.stringify(session);
  if (Capacitor.getPlatform() === 'android') {
    await secureSession.saveSession({ value });
    return;
  }
  sessionStorage.setItem(WEB_SESSION_KEY, value);
}

export async function clearStudentSession(): Promise<void> {
  if (Capacitor.getPlatform() === 'android') {
    await secureSession.clearSession();
    return;
  }
  sessionStorage.removeItem(WEB_SESSION_KEY);
}

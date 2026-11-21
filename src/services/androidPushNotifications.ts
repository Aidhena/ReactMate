import { Capacitor, registerPlugin } from '@capacitor/core';
import { registerStudentPushDevice } from './kasMateApi';

interface NativePermissionResult {
  granted: boolean;
  status: string;
}

interface NativeInstallationResult {
  installationId: string;
}

interface KasMatePushPlugin {
  checkNotificationPermission(): Promise<NativePermissionResult>;
  requestNotificationPermission(): Promise<NativePermissionResult>;
  getInstallationId(): Promise<NativeInstallationResult>;
}

const nativePush = registerPlugin<KasMatePushPlugin>('KasMatePush');
const PUSH_REGISTERED_KEY = 'kasmate_android_push_registered';

export function isAndroidPushAvailable(): boolean {
  return Capacitor.getPlatform() === 'android';
}

export async function getAndroidPushPermissionStatus(): Promise<NotificationPermission> {
  if (!isAndroidPushAvailable()) return 'default';
  const result = await nativePush.checkNotificationPermission();
  if (result.granted || result.status === 'granted') return 'granted';
  return result.status === 'denied' ? 'denied' : 'default';
}

export async function enableAndroidPushNotifications(
  studentToken: string
): Promise<{ granted: boolean; subscribed: boolean }> {
  if (!isAndroidPushAvailable()) return { granted: false, subscribed: false };

  const permission = await nativePush.requestNotificationPermission();
  if (!permission.granted) {
    return { granted: false, subscribed: false };
  }

  const { installationId } = await nativePush.getInstallationId();
  if (!installationId) {
    throw new Error('Firebase did not return an installation ID.');
  }
  await registerStudentPushDevice(studentToken, installationId);
  try {
    localStorage.setItem(PUSH_REGISTERED_KEY, 'true');
  } catch {
    // Registration remains active on the server even if local storage is unavailable.
  }
  return { granted: true, subscribed: true };
}

export async function getAndroidInstallationId(): Promise<string | undefined> {
  if (!isAndroidPushAvailable()) return undefined;
  try {
    const { installationId } = await nativePush.getInstallationId();
    return installationId || undefined;
  } catch {
    return undefined;
  }
}

export function clearAndroidPushRegistration(): void {
  try {
    localStorage.removeItem(PUSH_REGISTERED_KEY);
  } catch {
    // ignore storage errors
  }
}

export function isAndroidPushRegistered(): boolean {
  try {
    return localStorage.getItem(PUSH_REGISTERED_KEY) === 'true';
  } catch {
    return false;
  }
}

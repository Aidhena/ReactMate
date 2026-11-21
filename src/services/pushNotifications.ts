import { Capacitor } from '@capacitor/core';
import { Bill, PaymentStatus } from '../types';
import { pickNextFunFact } from '../data/funFacts';
import { rupiah } from '../data/kasData';
import {
  getAndroidPushPermissionStatus,
  isAndroidPushRegistered,
} from './androidPushNotifications';

export interface PushSyncState {
  bills: Bill[];
  hasPendingPayment: boolean;
  english: boolean;
  userName: string;
  funFactIntervalMinutes: number;
}

export interface PushCapabilityStatus {
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
  subscribed: boolean;
  isIOSNeedsInstall: boolean;
  nativePush?: boolean;
}

const SEEN_FACTS_KEY = 'kasmate_seen_fun_facts';
const LAST_FACT_KEY = 'kasmate_last_fun_fact_id';
const DAY_MS = 86_400_000;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function readSeenFactIds(): string[] {
  try {
    const raw = localStorage.getItem(SEEN_FACTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSeenFactState(nextSeenIds: string[], lastId: string): void {
  try {
    localStorage.setItem(SEEN_FACTS_KEY, JSON.stringify(nextSeenIds));
    localStorage.setItem(LAST_FACT_KEY, lastId);
  } catch {
    // ignore storage errors
  }
}

function readLastFactId(): string | undefined {
  try {
    return localStorage.getItem(LAST_FACT_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

export function isIOSDeviceNeedingInstall(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  return isIOS && !isStandalone;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    return reg;
  } catch {
    return null;
  }
}

export async function getPushCapabilityStatus(): Promise<PushCapabilityStatus> {
  const isIOSNeedsInstall = isIOSDeviceNeedingInstall();
  if (Capacitor.getPlatform() === 'android') {
    let permission: NotificationPermission = 'default';
    try {
      permission = await getAndroidPushPermissionStatus();
    } catch {
      permission = 'default';
    }
    return {
      supported: true,
      permission,
      subscribed: isAndroidPushRegistered(),
      isIOSNeedsInstall,
      nativePush: true,
    };
  }

  const hasNotification = typeof window !== 'undefined' && 'Notification' in window;
  if (!hasNotification) {
    return {
      supported: false,
      permission: 'unsupported',
      subscribed: false,
      isIOSNeedsInstall,
    };
  }

  let subscribed = false;
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const reg = await navigator.serviceWorker.getRegistration('/');
      const sub = await reg?.pushManager.getSubscription();
      subscribed = Boolean(sub);
    } catch {
      subscribed = false;
    }
  }

  return {
    supported: true,
    permission: Notification.permission,
    subscribed,
    isIOSNeedsInstall,
  };
}

async function showOSNotificationViaSW(
  title: string,
  body: string,
  tag: string,
  page: 'payments' | 'home'
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    const reg = await registerServiceWorker();
    if (reg) {
      await reg.showNotification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag,
        silent: true,
        data: { page, url: `/?page=${page}` },
      });
      return true;
    }
  } catch {
    // Fallback below on desktop environments where SW showNotification isn't available
  }

  try {
    new Notification(title, {
      body,
      icon: '/pwa-192x192.png',
      tag,
      silent: true,
    });
    return true;
  } catch {
    return false;
  }
}

export async function enableRealPushNotifications(
  state: PushSyncState
): Promise<{ ok: boolean; subscribed: boolean; permission: NotificationPermission | 'unsupported' }> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { ok: false, subscribed: false, permission: 'unsupported' };
  }

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }

  if (permission !== 'granted') {
    return { ok: false, subscribed: false, permission };
  }

  const reg = await registerServiceWorker();
  if (!reg || !('PushManager' in window)) {
    return { ok: true, subscribed: false, permission };
  }

  try {
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const keyRes = await fetch('/api/push/vapid-public-key');
      if (keyRes.ok) {
        const { publicKey } = (await keyRes.json()) as { publicKey?: string };
        if (publicKey) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource,
          });
        }
      }
    }

    if (sub) {
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          english: state.english,
          userName: state.userName,
          bills: state.bills.map((bill) => ({
            ...bill,
            amount: bill.amountDue || bill.amount,
          })),
          hasPendingPayment: state.hasPendingPayment,
          funFactIntervalMinutes: state.funFactIntervalMinutes,
        }),
      });

      // Register periodic background sync when supported (Android Chrome)
      const periodicReg = reg as ServiceWorkerRegistration & {
        periodicSync?: {
          register: (tag: string, options: { minInterval: number }) => Promise<void>;
        };
      };
      if (periodicReg.periodicSync) {
        await periodicReg.periodicSync
          .register('kasmate-periodic-push', {
            minInterval: Math.max(15, state.funFactIntervalMinutes) * 60_000,
          })
          .catch(() => undefined);
      }

      return { ok: true, subscribed: true, permission };
    }
  } catch {
    // Some embedded iframe environments block PushManager; SW OS notifications remain active
  }

  return { ok: true, subscribed: false, permission };
}

export async function disableRealPushNotifications(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.getRegistration('/');
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return;

    await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    }).catch(() => undefined);
    await subscription.unsubscribe();
  } catch {
    // Keep sign-out available when push is unsupported or temporarily unavailable.
  }
}

export async function syncPushSchedule(state: PushSyncState): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration('/');
    const sub = await reg?.pushManager.getSubscription();
    if (!sub) return;
    await fetch('/api/push/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: sub.endpoint,
        english: state.english,
        userName: state.userName,
        bills: state.bills.map((bill) => ({
          ...bill,
          amount: bill.amountDue || bill.amount,
        })),
        hasPendingPayment: state.hasPendingPayment,
        funFactIntervalMinutes: state.funFactIntervalMinutes,
      }),
    });
  } catch {
    // ignore background sync failures
  }
}

export async function triggerScheduledBillPush(state: PushSyncState): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  // Try real Web Push via backend subscription first
  try {
    const reg = await navigator.serviceWorker.getRegistration('/');
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      const res = await fetch('/api/push/send-bill-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      if (res.ok) {
        const json = (await res.json()) as { sent?: boolean };
        if (json.sent) return true;
      }
    }
  } catch {
    // Fallback to direct Service Worker OS notification below
  }

  const unpaid = state.bills.filter(
    (bill) => bill.status !== PaymentStatus.LUNAS && bill.status !== PaymentStatus.PROSES
  );
  if (unpaid.length === 0) return false;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startMs = startOfToday.getTime();
  const overdueBills = unpaid.filter((b) => b.dueDateMillis < startMs);

  if (overdueBills.length > 0) {
    const total = overdueBills.reduce((acc, b) => acc + (b.amountDue || b.amount), 0);
    const maxDays = overdueBills.reduce((max, b) => {
      const d = Math.max(1, Math.floor((startMs - b.dueDateMillis) / DAY_MS));
      return Math.max(max, d);
    }, 1);

    const title =
      maxDays >= 3
        ? state.english
          ? `😠 Overdue ${maxDays} days! Pay dues now`
          : `😠 Nunggak ${maxDays} hari! Segera bayar kas`
        : state.english
        ? `⏰ Payment overdue ${maxDays} day(s)`
        : `⏰ Tagihan kas terlambat ${maxDays} hari`;

    const body = state.english
      ? `${overdueBills[0].title} (${rupiah(total)}) is unpaid. Tap to view bills & pay!`
      : `${overdueBills[0].title} (${rupiah(total)}) belum dibayar. Ketuk untuk bayar sekarang!`;

    return showOSNotificationViaSW(
      title,
      body,
      `kasmate-bill-${overdueBills[0].id}`,
      'payments'
    );
  }

  const next = [...unpaid].sort((a, b) => a.dueDateMillis - b.dueDateMillis)[0];
  return showOSNotificationViaSW(
    state.english ? '📅 Class dues reminder' : '📅 Pengingat tagihan kas',
    state.english
      ? `${next.title} · ${rupiah(next.amountDue || next.amount)} is waiting for payment.`
      : `${next.title} · ${rupiah(next.amountDue || next.amount)} belum dibayar. Ketuk untuk bayar.`,
    `kasmate-due-${next.id}`,
    'payments'
  );
}

export async function triggerPaymentConfirmationPush(
  title: string,
  amount: number,
  english: boolean
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    const reg = await navigator.serviceWorker.getRegistration('/');
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      const res = await fetch('/api/push/send-bill-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          paymentConfirmation: { title, amount },
        }),
      });
      if (res.ok) {
        const json = (await res.json()) as { sent?: boolean };
        if (json.sent) return true;
      }
    }
  } catch {
    // Fallback below
  }

  return showOSNotificationViaSW(
    english ? '🎉 Payment request sent!' : '🎉 Permintaan pembayaran terkirim!',
    english
      ? `${title} (${rupiah(amount)}) submitted for review.`
      : `${title} (${rupiah(amount)}) berhasil dikirim ke bendahara.`,
    `kasmate-paid-${Date.now()}`,
    'payments'
  );
}

export async function triggerNextFunFactPush(english: boolean): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    const reg = await navigator.serviceWorker.getRegistration('/');
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      const res = await fetch('/api/push/send-fun-fact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      if (res.ok) {
        const json = (await res.json()) as { sent?: boolean };
        if (json.sent) return true;
      }
    }
  } catch {
    // Fallback below using non-repeating local queue
  }

  const seenIds = readSeenFactIds();
  const lastId = readLastFactId();
  const { fact, nextSeenIds } = pickNextFunFact(english, seenIds, lastId);
  writeSeenFactState(nextSeenIds, fact.id);

  return showOSNotificationViaSW(
    english ? '💡 KasMate Fun Fact' : '💡 Fakta Unik KasMate',
    fact.text,
    `kasmate-funfact-${fact.id}`,
    'home'
  );
}

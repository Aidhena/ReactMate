import {
  AppLanguage,
  CalendarStickyNote,
  KasSummary,
  PaymentStatus,
} from '../types';
import { FUN_FACTS } from './funFacts';

const DAY_MS = 86_400_000;

export function createInitialSummary(): KasSummary {
  return {
    totalBalance: 0,
    classIncome: 0,
    classExpensesTotal: 0,
    classIuranCollected: 0,
    classIuranTarget: 0,
    myBills: [],
    expenses: [],
  };
}

export function localizeSummary(
  summary: KasSummary,
  english: boolean
): KasSummary {
  if (!english) return summary;

  return {
    ...summary,
    expenses: summary.expenses.map((exp) => ({
      ...exp,
      noteBy: exp.noteBy === 'Bendahara' ? 'Treasurer' : exp.noteBy,
    })),
  };
}

export function rupiah(n: number): string {
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(n);
}

export function tanggal(ms: number, english = false): string {
  return new Intl.DateTimeFormat(english ? 'en-US' : 'id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(ms));
}

export function financeFunFact(english: boolean, variantOffset = 0): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / DAY_MS);
  const item = FUN_FACTS[(dayOfYear + variantOffset) % FUN_FACTS.length];
  return english ? item.enText : item.idText;
}

export function localAssistantAnswer(
  question: string,
  summary: KasSummary,
  english: boolean
): string {
  const q = question.toLowerCase();

  if (['fun fact', 'fakta', 'tips', 'info'].some((k) => q.includes(k))) {
    return financeFunFact(english);
  }
  if (['saldo', 'balance'].some((k) => q.includes(k))) {
    return english
      ? `The current class balance is ${rupiah(summary.totalBalance)}.`
      : `Saldo kas kelas yang tercatat saat ini ${rupiah(summary.totalBalance)}.`;
  }
  if (['tagihan', 'bill', 'bayar', 'pay'].some((k) => q.includes(k))) {
    const bill = summary.myBills.find(
      (b) => b.status !== PaymentStatus.LUNAS && b.status !== PaymentStatus.PROSES
    );
    if (!bill) {
      const paymentInReview = summary.myBills.some(
        (b) => b.status === PaymentStatus.PROSES
      );
      if (paymentInReview) {
        return english
          ? 'Your payment request is waiting for treasurer review. Check the payment history for its status.'
          : 'Permintaan pembayaranmu sedang menunggu pemeriksaan bendahara. Lihat riwayat pembayaran untuk statusnya.';
      }
      return english
        ? 'You have no unpaid bill right now.'
        : 'Tidak ada tagihan belum lunas pada data saat ini.';
    }
    const due = bill.amountDue || bill.amount;
    return english
      ? `${bill.title} has ${rupiah(due)} remaining, due ${tanggal(bill.dueDateMillis, true)}. Open Pay to submit a payment request.`
      : `${bill.title} tersisa ${rupiah(due)}, jatuh tempo ${tanggal(bill.dueDateMillis, false)}. Buka halaman Pembayaran untuk mengirim permintaan pembayaran.`;
  }
  if (['pengeluaran', 'expense', 'nota', 'receipt'].some((k) => q.includes(k))) {
    const recent = summary.expenses[0];
    if (!recent) {
      return english
        ? 'There are no expense records yet.'
        : 'Belum ada catatan pengeluaran.';
    }
    return english
      ? `The latest expense is ${recent.description}, ${rupiah(recent.amount)}, recorded ${tanggal(recent.dateMillis, true)}. Open Class to see its details.`
      : `Pengeluaran terbaru: ${recent.description}, ${rupiah(recent.amount)}, dicatat ${tanggal(recent.dateMillis, false)}. Buka Kas Kelas untuk detailnya.`;
  }
  if (['sanggah', 'dispute', 'salah', 'wrong'].some((k) => q.includes(k))) {
    return english
      ? 'Contact your treasurer directly about the payment issue. The shared class service does not accept dispute tickets yet.'
      : 'Hubungi bendahara langsung untuk membahas pembayaran ini. Layanan kas bersama belum menerima tiket sanggahan.';
  }

  return english
    ? 'I can help with your bill, class balance, expenses, or payment disputes. Ask a specific question to get an answer from your class data.'
    : 'Aku bisa bantu soal tagihan, saldo kelas, pengeluaran, atau sanggahan pembayaran. Tanyakan hal spesifik agar aku bisa menjawab dari data kas kelasmu.';
}

const PREFS_PREFIX = 'kasmate_preferences_';

export const STICKY_COLORS = [
  '#FFE0E0',
  '#FFF0B8',
  '#DDF5E5',
  '#DCEBFF',
  '#EDE1FF',
] as const;

export function readPrefBool(key: string, fallback = false): boolean {
  try {
    const raw = localStorage.getItem(PREFS_PREFIX + key);
    return raw === null ? fallback : raw === 'true';
  } catch {
    return fallback;
  }
}

export function writePrefBool(key: string, value: boolean): void {
  try {
    localStorage.setItem(PREFS_PREFIX + key, String(value));
  } catch {
    // ignore storage errors
  }
}

export function readPrefString(key: string, fallback: string): string {
  try {
    return localStorage.getItem(PREFS_PREFIX + key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writePrefString(key: string, value: string): void {
  try {
    localStorage.setItem(PREFS_PREFIX + key, value);
  } catch {
    // ignore storage errors
  }
}

export function readLanguagePref(): AppLanguage {
  const val = readPrefString('app_language', AppLanguage.ENGLISH);
  return val === AppLanguage.INDONESIAN
    ? AppLanguage.INDONESIAN
    : AppLanguage.ENGLISH;
}

export function readCalendarNotes(): CalendarStickyNote[] {
  try {
    const raw = localStorage.getItem(PREFS_PREFIX + 'calendar_notes');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (n) =>
        typeof n?.id === 'string' &&
        typeof n?.dateKey === 'string' &&
        typeof n?.text === 'string'
    );
  } catch {
    return [];
  }
}

export function writeCalendarNotes(notes: CalendarStickyNote[]): void {
  try {
    localStorage.setItem(
      PREFS_PREFIX + 'calendar_notes',
      JSON.stringify(notes)
    );
  } catch {
    // ignore storage errors
  }
}

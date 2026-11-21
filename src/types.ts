export enum PaymentStatus {
  LUNAS = 'LUNAS',
  BELUM = 'BELUM',
  SEBAGIAN = 'SEBAGIAN',
  PROSES = 'PROSES',
}

export type StudentPaymentMethod = 'QRIS' | 'TF' | 'TUNAI';

export interface Bill {
  id: string;
  title: string;
  /** Original assessed amount for this bill. */
  amount: number;
  amountDue: number;
  amountPaid: number;
  assessedAmount: number;
  dueDateMillis: number;
  status: PaymentStatus;
  isArchived: boolean;
  /** True when this bill contributes to the routine class kas target. */
  isClassKas?: boolean;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  dateMillis: number;
  noteBy: string;
}

export interface KasSummary {
  totalBalance: number;
  classIncome: number;
  classExpensesTotal: number;
  classIuranCollected: number;
  classIuranTarget: number;
  myBills: Bill[];
  expenses: Expense[];
}

export interface StudentPaymentRequest {
  id: string;
  billStudentId: string;
  title: string;
  amount: number;
  method: string;
  status: string;
  proofAttached: boolean;
  proofFileName: string;
  createdAt: number;
  reviewNote: string;
}

export interface CalendarStickyNote {
  id: string;
  dateKey: string;
  text: string;
  colorIndex: number;
  done: boolean;
}

export enum MascotMood {
  NEUTRAL = 'NEUTRAL',
  SAD = 'SAD',
  ANGRY = 'ANGRY',
  HAPPY = 'HAPPY',
  EXCITED = 'EXCITED',
}

export enum AppPage {
  HOME = 'HOME',
  PAYMENTS = 'PAYMENTS',
  LEDGER = 'LEDGER',
  ASSISTANT = 'ASSISTANT',
  SETTINGS = 'SETTINGS',
  PROFILE = 'PROFILE',
}

export enum AppLanguage {
  INDONESIAN = 'INDONESIAN',
  ENGLISH = 'ENGLISH',
}

export enum AuthScreenState {
  WELCOME = 'WELCOME',
  LOGIN = 'LOGIN',
  HOME = 'HOME',
}

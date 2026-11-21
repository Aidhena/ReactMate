import {
  Bill,
  Expense,
  KasSummary,
  PaymentStatus,
  StudentPaymentMethod,
  StudentPaymentRequest,
} from '../types';

const DEFAULT_API_BASE_URL = 'http://10.199.241.182/KasMateAPI/';
const configuredBaseUrl = import.meta.env.VITE_KASMATE_API_BASE_URL?.trim();
export const KASMATE_API_BASE_URL = normalizeBaseUrl(
  configuredBaseUrl || DEFAULT_API_BASE_URL
);

interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  error?: string | null;
}

export interface StudentProfile {
  id: number;
  name: string;
  nis: string;
  classId: number | null;
  className: string | null;
  academicYear: string | null;
  savingsBalance: number;
}

interface LoginData {
  token: string;
  student: StudentProfile;
}

interface RawBill {
  billStudentId?: number | string;
  name?: string;
  amount?: number | string;
  amountDue?: number | string;
  amountPaid?: number | string;
  assessedAmount?: number | string;
  status?: string;
  dueDate?: string | null;
  periodEnd?: string | null;
  createdAt?: string | null;
  isArchived?: boolean;
  isClassKas?: boolean;
}

interface RawExpense {
  id?: number | string;
  description?: string | null;
  amount?: number | string;
  createdBy?: string | null;
  createdAt?: string | null;
}

interface RawSummary {
  classBalance?: number | string;
  classIncome?: number | string;
  classExpensesTotal?: number | string;
  classIuranCollected?: number | string;
  classIuranTarget?: number | string;
  expenses?: RawExpense[];
}

interface RawPaymentRequest {
  id?: number | string;
  billStudentId?: number | string;
  billName?: string;
  amount?: number | string;
  method?: string;
  status?: string;
  proofAttached?: boolean;
  proofFileName?: string | null;
  createdAt?: string | null;
  reviewNote?: string | null;
}

interface RawSubmittedRequest {
  id: number | string;
  billStudentId: number | string;
  amount: number | string;
  method: string;
  status: string;
  proofAttached: boolean;
  proofFileName?: string | null;
}

export interface StudentSnapshot {
  profile: StudentProfile;
  summary: KasSummary;
  paymentRequests: StudentPaymentRequest[];
}

export interface StudentLoginCredentials {
  name: string;
  nis?: string;
  password: string;
}

export interface SubmitPaymentInput {
  billStudentId: string;
  paymentMethod: StudentPaymentMethod;
  proof: File;
}

export class KasMateApiError extends Error {
  constructor(message: string, readonly statusCode?: number) {
    super(message);
    this.name = 'KasMateApiError';
  }
}

function normalizeBaseUrl(value: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('VITE_KASMATE_API_BASE_URL must be a valid API URL.');
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.search || parsed.hash) {
    throw new Error('Use an HTTP or HTTPS URL for the KasMate API.');
  }
  return `${value.replace(/\/+$/, '')}/`;
}

function toNumber(value: unknown): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

function dateMillis(value: unknown): number {
  const parsed = Date.parse(text(value));
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function mapBillStatus(value: unknown): PaymentStatus {
  switch (text(value).toUpperCase()) {
    case PaymentStatus.LUNAS:
      return PaymentStatus.LUNAS;
    case PaymentStatus.PROSES:
      return PaymentStatus.PROSES;
    case PaymentStatus.SEBAGIAN:
      return PaymentStatus.SEBAGIAN;
    default:
      return PaymentStatus.BELUM;
  }
}

function mapPaymentMethod(value: unknown): string {
  switch (text(value).toUpperCase()) {
    case 'TF':
      return 'E-Wallet';
    case 'TUNAI':
      return 'Cash';
    default:
      return 'QRIS';
  }
}

function mapBill(row: RawBill): Bill {
  const amountDue = toNumber(row.amountDue);
  const amountPaid = toNumber(row.amountPaid);
  const assessedAmount = toNumber(row.assessedAmount) || toNumber(row.amount) || amountDue + amountPaid;
  return {
    id: text(row.billStudentId),
    title: text(row.name) || 'Tagihan kelas',
    amount: assessedAmount,
    amountDue,
    amountPaid,
    assessedAmount,
    dueDateMillis: dateMillis(row.dueDate || row.periodEnd || row.createdAt),
    status: mapBillStatus(row.status),
    isArchived: Boolean(row.isArchived),
    isClassKas: Boolean(row.isClassKas),
  };
}

function mapExpense(row: RawExpense): Expense {
  return {
    id: text(row.id),
    description: text(row.description) || 'Pengeluaran kelas',
    amount: toNumber(row.amount),
    dateMillis: dateMillis(row.createdAt),
    noteBy: text(row.createdBy) || 'Bendahara',
  };
}

function mapPaymentRequest(row: RawPaymentRequest): StudentPaymentRequest {
  return {
    id: text(row.id),
    billStudentId: text(row.billStudentId),
    title: text(row.billName) || 'Tagihan kelas',
    amount: toNumber(row.amount),
    method: mapPaymentMethod(row.method),
    status: text(row.status).toUpperCase() || 'PENDING',
    proofAttached: Boolean(row.proofAttached),
    proofFileName: text(row.proofFileName),
    createdAt: dateMillis(row.createdAt),
    reviewNote: text(row.reviewNote),
  };
}

async function request<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST';
    token?: string;
    body?: Record<string, unknown> | FormData;
  } = {}
): Promise<T> {
  const headers = new Headers({ Accept: 'application/json' });
  if (options.token) headers.set('Authorization', `Bearer ${options.token}`);

  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body) {
    headers.set('Content-Type', 'application/json; charset=utf-8');
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(`${KASMATE_API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body,
      cache: 'no-store',
    });
  } catch {
    throw new KasMateApiError(
      'Could not reach the KasMate server. Check that it is online and your device is on the same network.'
    );
  }

  let envelope: ApiEnvelope<T> | null = null;
  try {
    envelope = (await response.json()) as ApiEnvelope<T>;
  } catch {
    // The API contract is JSON; report unexpected HTML or empty responses clearly below.
  }

  if (!envelope || typeof envelope !== 'object') {
    throw new KasMateApiError('The KasMate server returned an invalid response.', response.status);
  }
  if (!response.ok || !envelope.success) {
    throw new KasMateApiError(
      text(envelope.error) || `The server could not complete the request (${response.status}).`,
      response.status
    );
  }
  if (envelope.data === null) {
    throw new KasMateApiError('The KasMate server returned no data.', response.status);
  }
  return envelope.data;
}

export async function loginStudent(credentials: StudentLoginCredentials) {
  return request<LoginData>('android/login.php', {
    method: 'POST',
    body: {
      name: credentials.name.trim(),
      nis: credentials.nis?.trim() || undefined,
      password: credentials.password,
    },
  });
}

export async function loadStudentSnapshot(token: string): Promise<StudentSnapshot> {
  const [profile, rawBills, rawSummary, rawRequests] = await Promise.all([
    request<StudentProfile>('android/me.php', { token }),
    request<RawBill[]>('android/bills.php', { token }),
    request<RawSummary>('android/summary.php', { token }),
    request<RawPaymentRequest[]>('android/payment-requests.php', { token }),
  ]);

  const paymentRequests = rawRequests.map(mapPaymentRequest);
  const pendingBillIds = new Set(
    paymentRequests
      .filter((paymentRequest) => paymentRequest.status === 'PENDING')
      .map((paymentRequest) => paymentRequest.billStudentId)
  );

  return {
    profile,
    summary: {
      totalBalance: toNumber(rawSummary.classBalance),
      classIncome: toNumber(rawSummary.classIncome),
      classExpensesTotal: toNumber(rawSummary.classExpensesTotal),
      classIuranCollected: toNumber(rawSummary.classIuranCollected),
      classIuranTarget: toNumber(rawSummary.classIuranTarget),
      myBills: rawBills.map((row) => {
        const bill = mapBill(row);
        return pendingBillIds.has(bill.id) && bill.status !== PaymentStatus.LUNAS
          ? { ...bill, status: PaymentStatus.PROSES }
          : bill;
      }),
      expenses: (rawSummary.expenses ?? []).map(mapExpense),
    },
    paymentRequests,
  };
}

export async function submitStudentPayment(
  token: string,
  input: SubmitPaymentInput,
  billTitle: string
): Promise<StudentPaymentRequest> {
  if (!input.proof) {
    throw new KasMateApiError('Attach a payment proof file before sending the request.');
  }
  if (input.proof.size < 1 || input.proof.size > 5 * 1024 * 1024) {
    throw new KasMateApiError('Payment proof must be smaller than 5 MB.');
  }
  const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
  const allowedExtensions = new Set(['jpg', 'jpeg', 'png', 'webp', 'pdf']);
  const extension = input.proof.name.split('.').pop()?.toLowerCase() ?? '';
  if (
    (input.proof.type && !allowedTypes.has(input.proof.type)) ||
    (!input.proof.type && !allowedExtensions.has(extension))
  ) {
    throw new KasMateApiError('Attach a JPG, PNG, WebP, or PDF proof.');
  }

  const body = new FormData();
  body.append('billStudentId', input.billStudentId);
  body.append('paymentMethod', input.paymentMethod);
  body.append('proofFileName', input.proof.name);
  body.append('proof', input.proof, input.proof.name);
  const submitted = await request<RawSubmittedRequest>('android/payment-submit.php', {
    method: 'POST',
    token,
    body,
  });

  return {
    id: text(submitted.id),
    billStudentId: text(submitted.billStudentId),
    title: billTitle,
    amount: toNumber(submitted.amount),
    method: mapPaymentMethod(submitted.method),
    status: text(submitted.status).toUpperCase() || 'PENDING',
    proofAttached: Boolean(submitted.proofAttached),
    proofFileName: text(submitted.proofFileName),
    createdAt: Date.now(),
    reviewNote: '',
  };
}

export async function logoutStudent(token: string, installationId?: string): Promise<void> {
  await request<{ message: string }>('android/logout.php', {
    method: 'POST',
    token,
    body: installationId ? { installationId } : {},
  });
}

export async function registerStudentPushDevice(
  token: string,
  installationId: string
): Promise<void> {
  await request<{ registered: boolean }>('android/devices/register.php', {
    method: 'POST',
    token,
    body: { installationId },
  });
}

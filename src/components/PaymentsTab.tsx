import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Headset,
  Hourglass,
  ImagePlus,
  ReceiptText,
  X,
} from 'lucide-react';
import {
  Bill,
  KasSummary,
  MascotMood,
  PaymentStatus,
  StudentPaymentMethod,
  StudentPaymentRequest,
} from '../types';
import { rupiah, tanggal } from '../data/kasData';
import type { SubmitPaymentInput } from '../services/kasMateApi';
import { KasMateActivityRobot } from './KasMateActivityRobot';
import { ModalPortal } from './ModalPortal';

interface PaymentsTabProps {
  summary: KasSummary;
  english: boolean;
  requests: StudentPaymentRequest[];
  payFocusKey?: number;
  onRequest: (request: SubmitPaymentInput) => Promise<StudentPaymentRequest>;
}

export const PaymentsTab: React.FC<PaymentsTabProps> = ({
  summary,
  english,
  requests,
  payFocusKey = 0,
  onRequest,
}) => {
  const pendingBillIds = new Set(
    requests
      .filter((request) => request.status === 'PENDING')
      .map((request) => request.billStudentId)
  );
  const unpaid = summary.myBills.filter(
    (bill) =>
      bill.status !== PaymentStatus.LUNAS &&
      bill.status !== PaymentStatus.PROSES &&
      !pendingBillIds.has(bill.id)
  );
  const classKasBillIds = new Set(
    summary.myBills.filter((bill) => bill.isClassKas).map((bill) => bill.id)
  );
  const unpaidKasBills = summary.myBills.filter(
    (bill) =>
      bill.isClassKas &&
      bill.status !== PaymentStatus.LUNAS &&
      bill.status !== PaymentStatus.PROSES &&
      !pendingBillIds.has(bill.id)
  );
  const nextKasBill =
    unpaidKasBills.length > 0
      ? [...unpaidKasBills].sort((a, b) => a.dueDateMillis - b.dueDateMillis)[0]
      : null;
  const hasPendingKasRequest = requests.some(
    (request) => request.status === 'PENDING' && classKasBillIds.has(request.billStudentId)
  );
  const pendingRequestCount = requests.filter(
    (request) => request.status === 'PENDING'
  ).length;
  const hasPendingRequest = pendingRequestCount > 0;
  const nextBill =
    unpaid.length > 0
      ? [...unpaid].sort((a, b) => a.dueDateMillis - b.dueDateMillis)[0]
      : null;
  const awaitingReview = nextBill === null && hasPendingRequest;

  const [showPayment, setShowPayment] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [chosenBill, setChosenBill] = useState<Bill | null>(nextBill);
  const [selectedReceipt, setSelectedReceipt] = useState<Bill | null>(null);
  const [method, setMethod] = useState('QRIS');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [celebrationTx, setCelebrationTx] = useState<{
    title: string;
    amount: number;
    method: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const unpaidSectionRef = useRef<HTMLDivElement>(null);
  const [highlightBills, setHighlightBills] = useState(false);

  useEffect(() => {
    if (!payFocusKey) return;
    setHighlightBills(true);
    const scrollTimer = window.setTimeout(() => {
      unpaidSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 60);
    const clearTimer = window.setTimeout(() => setHighlightBills(false), 1800);
    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(clearTimer);
    };
  }, [payFocusKey]);

  const contributions = summary.myBills
    .filter((b) => b.status === PaymentStatus.LUNAS)
    .reduce((acc, b) => acc + (b.amountPaid || b.amount), 0);
  const paidBillCount = summary.myBills.filter(
    (bill) => bill.status === PaymentStatus.LUNAS
  ).length;
  const paidBills = summary.myBills.filter(
    (b) => b.status === PaymentStatus.LUNAS
  );
  const isOverdue = Boolean(nextBill && nextBill.dueDateMillis < Date.now());
  const overdueDays =
    nextBill && isOverdue
      ? Math.max(1, Math.floor((Date.now() - nextBill.dueDateMillis) / 86_400_000))
      : 0;
  const daysLeft =
    nextBill && !isOverdue
      ? Math.floor(Math.max(0, nextBill.dueDateMillis - Date.now()) / 86_400_000)
      : null;

  const handleProofFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ]);
    if (file.size < 1 || file.size > 5 * 1024 * 1024) {
      setProofFile(null);
      setPaymentError(
        english
          ? 'Payment proof must be smaller than 5 MB.'
          : 'Ukuran bukti pembayaran harus di bawah 5 MB.'
      );
      e.currentTarget.value = '';
      return;
    }
    const allowedExtensions = new Set(['jpg', 'jpeg', 'png', 'webp', 'pdf']);
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (
      (file.type && !allowedTypes.has(file.type)) ||
      (!file.type && !allowedExtensions.has(extension))
    ) {
      setProofFile(null);
      setPaymentError(
        english
          ? 'Attach a JPG, PNG, WebP, or PDF proof.'
          : 'Lampirkan bukti berformat JPG, PNG, WebP, atau PDF.'
      );
      e.currentTarget.value = '';
      return;
    }
    setPaymentError(null);
    setProofFile(file);
  };

  const handlePaymentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!chosenBill || isSubmitting) return;
    if (!proofFile) {
      setPaymentError(
        english
          ? 'Attach your payment proof before submitting.'
          : 'Lampirkan bukti pembayaran sebelum mengirim.'
      );
      return;
    }

    const paymentMethod: StudentPaymentMethod =
      method === 'Tunai' ? 'TUNAI' : method === 'E-Wallet' ? 'TF' : 'QRIS';
    setIsSubmitting(true);
    setPaymentError(null);
    try {
      await onRequest({
        billStudentId: chosenBill.id,
        paymentMethod,
        proof: proofFile,
      });
      const displayMethod =
        method === 'Tunai'
          ? english
            ? 'Cash'
            : 'Tunai'
          : method === 'E-Wallet'
          ? english
            ? 'E-Wallet'
            : 'Dompet Digital'
          : method;
      setNotice(
        english
          ? 'Payment request sent. Waiting for treasurer review.'
          : 'Permintaan pembayaran terkirim. Menunggu verifikasi bendahara.'
      );
      setCelebrationTx({
        title: chosenBill.title,
        amount: chosenBill.amountDue || chosenBill.amount,
        method: displayMethod,
      });
      setProofFile(null);
      setShowPayment(false);
    } catch (submitError) {
      setPaymentError(
        submitError instanceof Error
          ? submitError.message
          : english
          ? 'Payment request could not be sent. Please try again.'
          : 'Permintaan pembayaran gagal dikirim. Silakan coba lagi.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3.5 pb-6">
      <div className="pt-2 pb-1">
        <h1 className="text-[25px] font-extrabold text-[#171717] dark:text-[#F4F4F5]">
          {english ? 'My payments' : 'Pembayaran saya'}
        </h1>
        <p className="text-xs text-[#858585] dark:text-[#B3B3BA]">
          {english
            ? 'Your bills, proof, and receipts'
            : 'Tagihan, bukti, dan kuitansi kasmu'}
        </p>
      </div>

      {/* Status Summary Card */}
      <div
        className={`rounded-[24px] border p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] ${
          awaitingReview
            ? 'bg-[#F2FBF6] dark:bg-[#14241C] border-[#168A62]/30'
            : isOverdue && overdueDays >= 3
            ? 'bg-[#FFF3F3] dark:bg-[#2A1518] border-[#E31E24]/40'
            : 'bg-white dark:bg-[#191A20] border-[#EEEEF0] dark:border-[#34353C]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
              awaitingReview || nextBill === null
                ? 'bg-[#168A62]/14'
                : isOverdue && overdueDays >= 3
                ? 'bg-[#E31E24] text-white animate-angry-shake'
                : 'bg-[#E31E24]/12'
            }`}
          >
            {awaitingReview || nextBill === null ? (
              <CheckCircle2 className="w-5 h-5 text-[#168A62]" />
            ) : (
              <Clock
                className={`w-5 h-5 ${
                  isOverdue && overdueDays >= 3 ? 'text-white' : 'text-[#E31E24]'
                }`}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-[#171717] dark:text-[#F4F4F5]">
              {awaitingReview
                ? english
                  ? 'Payment request submitted'
                  : 'Permintaan pembayaran terkirim'
                : nextBill === null
                ? english
                  ? 'All caught up'
                  : 'Semua lunas'
                : isOverdue && overdueDays >= 3
                ? english
                  ? `Overdue ${overdueDays} days! Pay soon`
                  : `Menunggak ${overdueDays} hari! Segera bayar`
                : english
                ? 'Payment due'
                : 'Ada tagihan kas'}
            </p>
            <p className="text-xs text-[#858585] dark:text-[#B3B3BA]">
              {awaitingReview
                ? english
                  ? 'Waiting for treasurer review'
                  : 'Menunggu verifikasi bendahara'
                : nextBill?.title ??
                  (english
                    ? 'No outstanding bill'
                    : 'Tidak ada tagihan tertunda')}
            </p>
          </div>
          {!awaitingReview && isOverdue ? (
            <span className="text-[11px] font-extrabold text-[#E31E24] shrink-0">
              {english ? `${overdueDays}d late` : `Telat ${overdueDays}h`}
            </span>
          ) : (
            !awaitingReview &&
            daysLeft !== null && (
              <span className="text-[11px] font-bold text-[#E31E24] shrink-0">
                {english ? `${daysLeft}d left` : `${daysLeft} hari lagi`}
              </span>
            )
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#858585] dark:text-[#B3B3BA]">
              {english ? 'Contributed this term' : 'Kontribusi semester ini'}
            </p>
            <p className="font-extrabold text-[22px] text-[#171717] dark:text-[#F4F4F5] tabular-nums">
              {rupiah(contributions)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#858585] dark:text-[#B3B3BA]">
              {english ? 'Bills paid' : 'Tagihan lunas'}
            </p>
            <p className="font-extrabold text-[22px] text-[#E31E24] tabular-nums">
              {paidBillCount} / {summary.myBills.length}
            </p>
          </div>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          disabled={!nextKasBill}
          onClick={() => {
            if (!nextKasBill) return;
            setChosenBill(nextKasBill);
            setProofFile(null);
            setPaymentError(null);
            setNotice(null);
            setShowPayment(true);
          }}
          className="h-12 rounded-[16px] kas-gradient disabled:opacity-45 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_6px_16px_rgba(227,30,36,0.22)] hover:brightness-105 active:scale-[0.96] ios-spring transition-all cursor-pointer disabled:cursor-not-allowed"
        >
          <CreditCard className="w-[18px] h-[18px]" />
          <span>
            {nextKasBill
              ? english
                ? 'Pay class dues'
                : 'Bayar kas'
              : hasPendingKasRequest
              ? english
                ? 'Kas payment pending'
                : 'Menunggu verifikasi'
              : summary.myBills.some((bill) => bill.isClassKas)
              ? english
                ? 'Kas paid'
                : 'Kas lunas'
              : english
              ? 'No kas due'
              : 'Belum ada kas'}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setShowDispute(true)}
          className="h-12 rounded-[16px] border border-[#EEEEF0] dark:border-[#34353C] bg-white dark:bg-[#191A20] text-[#171717] dark:text-[#F4F4F5] font-semibold text-sm flex items-center justify-center gap-2 hover:border-[#E31E24]/50 active:scale-[0.96] ios-spring transition-all cursor-pointer"
        >
          <Headset className="w-[18px] h-[18px]" />
          <span>{english ? 'Dispute' : 'Sanggah'}</span>
        </button>
      </div>

      {notice && (
        <div className="rounded-[24px] bg-[#168A62]/10 border border-[#168A62]/25 text-[#168A62] text-[13px] font-bold p-3.5">
          {notice}
        </div>
      )}

      {/* Outstanding Bills (shown before proceeding to checkout when selecting bills to pay) */}
      <div
        ref={unpaidSectionRef}
        id="unpaid-bills-section"
        className={`flex flex-col gap-3 rounded-[26px] transition-all duration-300 ${
          highlightBills
            ? 'p-2 -m-2 ring-2 ring-[#E31E24]/60 bg-[#E31E24]/[0.03]'
            : ''
        }`}
      >
        <div className="flex items-center justify-between pt-1">
          <h2 className="text-[17px] font-bold text-[#171717] dark:text-[#F4F4F5]">
            {english ? 'Bills to pay' : 'Tagihan yang perlu dibayar'}
          </h2>
          {unpaid.length > 0 && (
            <span className="text-[11px] font-bold text-[#E31E24]">
              {english
                ? `${unpaid.length} unpaid`
                : `${unpaid.length} belum lunas`}
            </span>
          )}
        </div>
        {unpaid.length === 0 ? (
          <div className="rounded-[24px] bg-white dark:bg-[#191A20] border border-[#EEEEF0] dark:border-[#34353C] p-4 text-[13px] text-[#858585] dark:text-[#B3B3BA]">
            {english
              ? 'No bills due right now'
              : 'Belum ada tagihan yang harus dibayar'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {unpaid.map((bill) => (
              <div
                key={bill.id}
                className="rounded-[24px] bg-white dark:bg-[#191A20] border border-[#EEEEF0] dark:border-[#34353C] p-4 flex flex-col gap-3 shadow-[0_2px_10px_rgba(0,0,0,0.03)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-sm text-[#171717] dark:text-[#F4F4F5]">
                      {bill.title}
                    </p>
                    <p className="text-xs text-[#858585] dark:text-[#B3B3BA]">
                      {english ? 'Due' : 'Jatuh tempo'}{' '}
                      {tanggal(bill.dueDateMillis, english)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-[#E31E24] tabular-nums">
                      {rupiah(bill.amountDue || bill.amount)}
                    </p>
                    <p className="text-[10px] font-bold text-[#E31E24]">
                      {bill.status === PaymentStatus.PROSES
                        ? english
                          ? 'IN REVIEW'
                          : 'DIPERIKSA'
                        : bill.status === PaymentStatus.SEBAGIAN
                        ? english
                          ? 'PARTIAL'
                          : 'SEBAGIAN'
                        : english
                        ? 'UNPAID'
                        : 'BELUM LUNAS'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Digital Receipts */}
      {paidBills.length > 0 && (
        <>
          <h2 className="text-[17px] font-bold text-[#171717] dark:text-[#F4F4F5] pt-1">
            {english ? 'Paid bills' : 'Tagihan lunas'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {paidBills.map((bill) => (
              <button
                key={bill.id}
                type="button"
                onClick={() => setSelectedReceipt(bill)}
                className="w-full text-left rounded-[24px] bg-white dark:bg-[#191A20] border border-[#EEEEF0] dark:border-[#34353C] p-4 flex items-center gap-3 hover:border-[#168A62]/50 transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-[#168A62]/12 flex items-center justify-center shrink-0">
                  <ReceiptText className="w-5 h-5 text-[#168A62]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[#171717] dark:text-[#F4F4F5]">
                    {bill.title}
                  </p>
                  <p className="text-[10px] text-[#858585] dark:text-[#B3B3BA]">
                    {english ? 'Ref' : 'Kode'}: KM-{bill.id.toUpperCase()}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-sm text-[#171717] dark:text-[#F4F4F5] tabular-nums">
                    {rupiah(bill.amountPaid || bill.amount)}
                  </p>
                  <p className="text-[10px] font-bold text-[#168A62]">
                    {english ? 'PAID' : 'LUNAS'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Personal Ledger / Submitted Requests */}
      <h2 className="text-[17px] font-bold text-[#171717] dark:text-[#F4F4F5] pt-1">
        {english ? 'Personal ledger' : 'Riwayat pembayaran pribadi'}
      </h2>
      {requests.length === 0 ? (
        <div className="rounded-[24px] bg-white dark:bg-[#191A20] border border-[#EEEEF0] dark:border-[#34353C] p-4 text-[13px] text-[#858585] dark:text-[#B3B3BA]">
          {english
            ? 'Submitted payments will appear here'
            : 'Pembayaran yang kamu ajukan akan muncul di sini'}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {requests.map((req) => (
            <div
              key={req.id}
              className="rounded-[24px] bg-white dark:bg-[#191A20] border border-[#EEEEF0] dark:border-[#34353C] p-4 flex flex-col gap-1.5"
            >
              <div className="flex items-center gap-2.5">
                {req.status === 'APPROVED' ? (
                  <CheckCircle2 className="w-5 h-5 text-[#168A62] shrink-0" />
                ) : req.status === 'REJECTED' ? (
                  <X className="w-5 h-5 text-[#E31E24] shrink-0" />
                ) : (
                  <Hourglass className="w-5 h-5 text-[#E19A1A] shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[#171717] dark:text-[#F4F4F5]">
                    {req.title}
                  </p>
                  <p className="text-xs text-[#858585] dark:text-[#B3B3BA]">
                    {(req.method === 'Tunai' || req.method === 'Cash'
                      ? english
                        ? 'Cash'
                        : 'Tunai'
                      : req.method === 'E-Wallet' || req.method === 'Dompet Digital'
                      ? english
                        ? 'E-Wallet'
                        : 'Dompet Digital'
                      : req.method)}{' '}
                    · {tanggal(req.createdAt, english)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-sm text-[#171717] dark:text-[#F4F4F5] tabular-nums">
                    {rupiah(req.amount)}
                  </p>
                  <p
                    className={`text-[10px] font-bold ${
                      req.status === 'APPROVED'
                        ? 'text-[#168A62]'
                        : req.status === 'REJECTED'
                        ? 'text-[#E31E24]'
                        : 'text-[#E19A1A]'
                    }`}
                  >
                    {req.status === 'APPROVED'
                      ? english
                        ? 'APPROVED'
                        : 'DISETUJUI'
                      : req.status === 'REJECTED'
                      ? english
                        ? 'REJECTED'
                        : 'DITOLAK'
                      : english
                      ? 'PENDING'
                      : 'MENUNGGU'}
                  </p>
                </div>
              </div>
              {req.proofAttached && (
                <p className="text-[11px] text-[#858585] dark:text-[#B3B3BA]">
                  {english
                    ? 'Proof attached · manual verification'
                    : 'Bukti terlampir · menunggu verifikasi manual'}
                </p>
              )}
              {req.reviewNote && (
                <p className="text-[11px] text-[#55555C] dark:text-[#C8C8D0]">
                  {english ? 'Treasurer note' : 'Catatan bendahara'}: {req.reviewNote}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && chosenBill && (
        <ModalPortal>
          <form
            onSubmit={handlePaymentSubmit}
            aria-labelledby="payment-dialog-title"
            className="w-full max-w-md rounded-[26px] bg-white dark:bg-[#191A20] border border-[#EEEEF0] dark:border-[#34353C] p-6 shadow-2xl flex flex-col gap-3.5 animate-bubble-pop"
          >
            <div className="flex items-center justify-between">
              <h3 id="payment-dialog-title" className="text-lg font-bold text-[#171717] dark:text-[#F4F4F5]">
                {english ? `Pay ${chosenBill.title}` : `Bayar ${chosenBill.title}`}
              </h3>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setShowPayment(false);
                  setProofFile(null);
                  setPaymentError(null);
                }}
                aria-label={english ? 'Close payment request' : 'Tutup permintaan pembayaran'}
                className="min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[22px] font-extrabold text-[#E31E24] tabular-nums">
              {rupiah(chosenBill.amountDue || chosenBill.amount)}
            </p>
            <fieldset className="flex flex-col gap-2">
              <legend className="text-[13px] font-medium text-[#171717] dark:text-[#F4F4F5]">
              {english ? 'Choose a method' : 'Pilih metode pembayaran'}
              </legend>

            <div role="radiogroup" aria-label={english ? 'Payment method' : 'Metode pembayaran'} className="flex items-center gap-2">
              {['QRIS', 'E-Wallet', 'Tunai'].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setMethod(option)}
                  role="radio"
                  aria-checked={method === option}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                    method === option
                      ? 'bg-[#E31E24]/12 border-[#E31E24] text-[#E31E24]'
                      : 'border-[#EEEEF0] dark:border-[#34353C] text-[#171717] dark:text-[#F4F4F5]'
                  }`}
                >
                  {option === 'Tunai'
                    ? english
                      ? 'Cash'
                      : 'Tunai'
                    : option === 'E-Wallet'
                    ? english
                      ? 'E-Wallet'
                      : 'Dompet Digital'
                    : option}
                </button>
              ))}
            </div>
            </fieldset>

            <p className="text-xs text-[#858585] dark:text-[#B3B3BA]">
              {method === 'Tunai'
                ? english
                  ? 'Send a cash payment record with a photo or receipt for treasurer review.'
                  : 'Kirim catatan pembayaran tunai beserta foto atau kuitansi untuk diperiksa bendahara.'
                : english
                ? 'Your request will be reviewed by the treasurer. This app does not transfer money automatically.'
                : 'Permintaanmu akan diperiksa bendahara. Aplikasi ini tidak memindahkan uang secara otomatis.'}
            </p>

            <input
              ref={fileInputRef}
              id="payment-proof-file"
              name="proof"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleProofFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-controls="payment-proof-file"
              className="w-full h-11 rounded-xl border border-[#EEEEF0] dark:border-[#34353C] flex items-center justify-center gap-2 text-sm font-medium text-[#171717] dark:text-[#F4F4F5] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            >
              <ImagePlus className="w-4 h-4" />
              <span>{proofFile?.name || (english ? 'Attach payment proof' : 'Lampirkan bukti pembayaran')}</span>
            </button>

            <p className="text-[11px] text-[#858585] dark:text-[#B3B3BA]">
              {english
                ? 'Required · JPG, PNG, WebP, or PDF · up to 5 MB'
                : 'Wajib · JPG, PNG, WebP, atau PDF · maksimal 5 MB'}
            </p>

            {proofFile && (
              <p aria-live="polite" className="text-[11px] font-medium text-[#168A62]">
                {english ? 'Proof selected for review' : 'Bukti siap dikirim untuk diperiksa'}
              </p>
            )}

            {paymentError && (
              <p role="alert" aria-live="polite" className="text-xs font-semibold text-[#E31E24]">
                {paymentError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setShowPayment(false);
                  setProofFile(null);
                  setPaymentError(null);
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium text-[#858585] hover:text-[#171717] dark:hover:text-white cursor-pointer"
              >
                {english ? 'Cancel' : 'Batal'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl kas-gradient text-white text-sm font-bold disabled:opacity-60 disabled:cursor-wait hover:brightness-105 active:scale-[0.96] ios-spring transition-all cursor-pointer"
              >
                {isSubmitting
                  ? english
                    ? 'Sending…'
                    : 'Mengirim…'
                  : english
                  ? 'Send payment request'
                  : 'Kirim permintaan'}
              </button>
            </div>
          </form>
        </ModalPortal>
      )}

      {/* Payment request submission confirmation */}
      {celebrationTx && (
        <ModalPortal>
          <div className="w-full max-w-sm rounded-[30px] bg-white dark:bg-[#191A20] border border-[#EEEEF0] dark:border-[#34353C] p-6 shadow-2xl flex flex-col items-center text-center gap-3 animate-success-pop">
            <div className="w-36 h-36 flex items-center justify-center overflow-visible">
              <KasMateActivityRobot
                mood={MascotMood.EXCITED}
                activity="coin_toss"
                sizeClassName="w-[140px] h-[140px]"
              />
            </div>
            <span className="text-[11px] font-extrabold tracking-widest text-[#168A62]">
              {english ? 'REQUEST SUBMITTED' : 'PERMINTAAN TERKIRIM'}
            </span>
            <h3 className="text-[22px] font-extrabold text-[#171717] dark:text-[#F4F4F5] leading-tight">
              {english ? 'Payment request sent!' : 'Permintaan pembayaran terkirim!'}
            </h3>
            <p className="text-xs text-[#858585] dark:text-[#B3B3BA]">
              {celebrationTx.title} ·{' '}
              <span className="font-bold text-[#171717] dark:text-[#F4F4F5] tabular-nums">
                {rupiah(celebrationTx.amount)}
              </span>{' '}
              ({celebrationTx.method})
            </p>
            <button
              type="button"
              onClick={() => setCelebrationTx(null)}
              className="mt-1 w-full h-12 rounded-[16px] kas-gradient text-white font-bold text-sm shadow-[0_8px_20px_rgba(227,30,36,0.28)] hover:brightness-105 active:scale-[0.96] ios-spring transition-all cursor-pointer"
            >
              {english ? 'Awesome, Done' : 'Mantap, Selesai'}
            </button>
          </div>
        </ModalPortal>
      )}

      {/* Dispute Modal */}
      {showDispute && (
        <ModalPortal>
          <div className="w-full max-w-md rounded-[26px] bg-white dark:bg-[#191A20] border border-[#EEEEF0] dark:border-[#34353C] p-6 shadow-2xl flex flex-col gap-3.5 animate-bubble-pop">
            <h3 className="text-lg font-bold text-[#171717] dark:text-[#F4F4F5]">
              {english ? 'Report a payment issue' : 'Ajukan sanggahan'}
            </h3>
            <p className="text-[13px] text-[#858585] dark:text-[#B3B3BA]">
              {english
                ? 'The shared class service does not accept dispute tickets yet. Please contact your treasurer directly.'
                : 'Layanan kas bersama belum menerima tiket sanggahan. Silakan hubungi bendahara secara langsung.'}
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDispute(false)}
                className="px-5 py-2.5 rounded-xl bg-[#E31E24] text-white text-sm font-bold hover:bg-[#B5121B] cursor-pointer"
              >
                {english ? 'Close' : 'Tutup'}
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Digital Receipt Modal */}
      {selectedReceipt && (
        <ModalPortal>
          <div className="w-full max-w-sm rounded-[26px] bg-white dark:bg-[#191A20] border border-[#EEEEF0] dark:border-[#34353C] p-6 shadow-2xl flex flex-col items-center text-center gap-2.5 animate-bubble-pop">
            <ReceiptText className="w-11 h-11 text-[#E31E24]" />
            <h3 className="text-lg font-bold text-[#171717] dark:text-[#F4F4F5]">
              {english ? 'Paid bill record' : 'Catatan tagihan lunas'}
            </h3>
            <p className="font-bold text-sm text-[#171717] dark:text-[#F4F4F5]">
              {selectedReceipt.title}
            </p>
            <p className="text-xl font-extrabold text-[#E31E24] tabular-nums">
              {rupiah(selectedReceipt.amount)}
            </p>
            <p className="text-xs font-mono text-[#858585] dark:text-[#B3B3BA]">
              {english ? 'Bill ID' : 'ID tagihan'}: {selectedReceipt.id}
            </p>
            <p className="text-xs text-[#858585] dark:text-[#B3B3BA] leading-relaxed mt-1">
              {english
                ? 'This bill is marked as paid in your shared class ledger.'
                : 'Tagihan ini tercatat lunas pada buku kas kelas bersama.'}
            </p>
            <button
              type="button"
              onClick={() => setSelectedReceipt(null)}
              className="mt-2 px-6 py-2 rounded-xl text-sm font-bold text-[#E31E24] hover:bg-[#E31E24]/10 cursor-pointer"
            >
              {english ? 'OK' : 'Oke'}
            </button>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

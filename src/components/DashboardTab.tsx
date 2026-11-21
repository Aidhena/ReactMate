import React, { useEffect, useState } from 'react';
import {
  BellRing,
  CheckCircle2,
  ChevronRight,
  Megaphone,
  Receipt,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { KasSummary, PaymentStatus } from '../types';
import { rupiah, tanggal } from '../data/kasData';

interface DashboardTabProps {
  summary: KasSummary;
  english: boolean;
  userName: string;
  paymentSubmitted: boolean;
  hasPendingPayment: boolean;
  showPushOptIn?: boolean;
  onEnablePush?: () => void;
  onOpenSettings: () => void;
  onOpenPayments: () => void;
  onOpenLedger: () => void;
  onOpenAssistant: () => void;
}

function getGreeting(userName: string, english: boolean): string {
  const hour = new Date().getHours();
  const salutation =
    hour >= 1 && hour < 11
      ? english
        ? 'Good morning'
        : 'Selamat pagi'
      : hour >= 11 && hour < 15
      ? english
        ? 'Good afternoon'
        : 'Selamat siang'
      : hour >= 15 && hour < 19
      ? english
        ? 'Good evening'
        : 'Selamat sore'
      : english
      ? 'Good evening'
      : 'Selamat malam';

  const trimmed = userName.trim() || (english ? 'Student' : 'Siswa');
  const displayName = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return `${salutation}, ${displayName}!`;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  summary,
  english,
  userName,
  paymentSubmitted,
  hasPendingPayment,
  showPushOptIn = false,
  onEnablePush,
  onOpenSettings,
  onOpenPayments,
  onOpenLedger,
  onOpenAssistant,
}) => {
  const [weekly, setWeekly] = useState(false);
  const [greetingText, setGreetingText] = useState(() =>
    getGreeting(userName, english)
  );

  useEffect(() => {
    setGreetingText(getGreeting(userName, english));
    const timer = window.setInterval(() => {
      setGreetingText(getGreeting(userName, english));
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [userName, english]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayMs = todayStart.getTime();

  const unpaid = summary.myBills.find(
    (bill) =>
      bill.status !== PaymentStatus.LUNAS && bill.status !== PaymentStatus.PROSES
  );
  const contributionTarget = summary.classIuranTarget;
  const contributionCollected = summary.classIuranCollected;
  const contributionPercent =
    contributionTarget > 0
      ? Math.max(0, Math.min(100, Math.round((contributionCollected / contributionTarget) * 100)))
      : 0;
  const daysLate =
    unpaid && unpaid.dueDateMillis < todayMs
      ? Math.max(1, Math.floor((todayMs - unpaid.dueDateMillis) / 86_400_000))
      : 0;

  const isCelebrating = paymentSubmitted || hasPendingPayment;

  const chartPeriods = Array.from({ length: weekly ? 7 : 6 }, (_, index) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    if (weekly) {
      start.setDate(start.getDate() - (6 - index));
    } else {
      start.setDate(1);
      start.setMonth(start.getMonth() - (5 - index));
    }
    const end = new Date(start);
    if (weekly) end.setDate(end.getDate() + 1);
    else end.setMonth(end.getMonth() + 1);
    return { start, end };
  });
  const chartAmounts = chartPeriods.map(({ start, end }) =>
    summary.expenses
      .filter((expense) => expense.dateMillis >= start.getTime() && expense.dateMillis < end.getTime())
      .reduce((total, expense) => total + expense.amount, 0)
  );
  const chartMax = Math.max(...chartAmounts, 1);
  const chartValues = chartAmounts.map((amount) => 0.08 + (amount / chartMax) * 0.82);
  const chartLabels = chartPeriods.map(({ start }) => {
    const dateFormat: Intl.DateTimeFormatOptions = weekly
      ? { weekday: 'short' }
      : { month: 'short' };
    return start.toLocaleDateString(english ? 'en-US' : 'id-ID', dateFormat);
  });

  const svgW = 320;
  const svgH = 118;
  const step = svgW / (chartValues.length - 1);
  const points = chartValues.map((v, i) => ({
    x: i * step,
    y: svgH * (1 - v),
  }));

  let linePath = '';
  let areaPath = `M 0 ${svgH} `;
  points.forEach((p, i) => {
    if (i === 0) {
      linePath += `M ${p.x} ${p.y} `;
      areaPath += `L ${p.x} ${p.y} `;
    } else {
      const cx = (i - 0.5) * step;
      const cy = svgH * (1 - chartValues[i - 1]);
      linePath += `Q ${cx} ${cy} ${p.x} ${p.y} `;
      areaPath += `Q ${cx} ${cy} ${p.x} ${p.y} `;
    }
  });
  areaPath += `L ${svgW} ${svgH} Z`;

  return (
    <div className="w-full flex flex-col gap-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <span className="text-[#E31E24] font-bold tracking-[2px] text-xs">
            KASMATE
          </span>
          <h1 className="text-[25px] font-extrabold text-[#171717] dark:text-[#F4F4F5] leading-tight">
            {greetingText}
          </h1>
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label={english ? 'Settings' : 'Pengaturan'}
          className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-[#171717] dark:text-[#F4F4F5] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Responsive Desktop Grid / Mobile Stack */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Primary Column */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {showPushOptIn && onEnablePush && (
            <button
              type="button"
              onClick={onEnablePush}
              className="w-full text-left rounded-[20px] bg-[#FFF4F4] dark:bg-[#2A1518] border border-[#E31E24]/30 px-4 py-3 flex items-center justify-between gap-3 hover:border-[#E31E24] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <BellRing className="w-4 h-4 text-[#E31E24] shrink-0" />
                <span className="text-xs font-bold text-[#171717] dark:text-[#F4F4F5] truncate">
                  {english
                    ? 'Enable phone push notifications for bills & fun facts'
                    : 'Aktifkan notifikasi HP untuk tagihan & fakta unik'}
                </span>
              </div>
              <span className="px-3 py-1 rounded-full kas-gradient text-white text-[11px] font-bold shrink-0">
                {english ? 'Enable' : 'Aktifkan'}
              </span>
            </button>
          )}

          {/* Compact Student Status Card (clean without inline fun facts or mascot box) */}
          <button
            type="button"
            onClick={onOpenPayments}
            className="w-full text-left rounded-[24px] bg-white dark:bg-[#191A20] border border-[#EEEEF0] dark:border-[#34353C] p-4 flex items-center gap-3 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:border-[#E31E24]/40 transition-colors cursor-pointer"
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                unpaid ? 'bg-[#E31E24]/10 text-[#E31E24]' : 'bg-[#168A62]/14 text-[#168A62]'
              }`}
            >
              {unpaid ? (
                <BellRing className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-[#171717] dark:text-[#F4F4F5]">
                {isCelebrating
                  ? english
                    ? 'Payment submitted · Pending review'
                    : 'Pembayaran terkirim · Menunggu verifikasi'
                  : unpaid
                  ? english
                    ? daysLate > 0
                      ? `Overdue ${daysLate} days`
                      : 'Payment due this month'
                    : daysLate > 0
                    ? `Terlambat ${daysLate} hari`
                    : 'Kas bulan ini belum lunas'
                  : english
                  ? 'Class dues paid this month'
                  : 'Kas bulan ini lunas'}
              </p>
              <p className="text-[11px] text-[#858585] dark:text-[#B3B3BA] truncate">
                {unpaid
                  ? `${unpaid.title} · ${rupiah(unpaid.amount)}`
                  : summary.myBills.some((bill) => bill.status === PaymentStatus.PROSES)
                  ? english
                    ? 'Payment request under review'
                    : 'Permintaan pembayaran sedang diperiksa'
                  : english
                  ? "You're all caught up"
                  : 'Kamu tidak memiliki tunggakan'}
              </p>
            </div>
            <ChevronRight
              className={`w-5 h-5 shrink-0 ${
                isCelebrating || !unpaid ? 'text-[#168A62]' : 'text-[#E31E24]'
              }`}
            />
          </button>

          {/* Total Class Balance Card */}
          <div className="w-full rounded-[24px] kas-gradient p-6 text-white shadow-md flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-white/85 text-xs font-bold tracking-wider">
                {english ? 'TOTAL CLASS BALANCE' : 'TOTAL SALDO KELAS'}
              </span>
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <p className="text-[32px] font-extrabold leading-tight tabular-nums">
              {rupiah(summary.totalBalance)}
            </p>
            <div className="flex items-center gap-1.5 text-[13px] text-white/95">
              <TrendingUp className="w-[18px] h-[18px]" />
              <span>
                  {english ? 'Current recorded balance' : 'Saldo tercatat saat ini'}
              </span>
            </div>
          </div>

          {/* Mini Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[24px] bg-white dark:bg-[#191A20] border border-[#EEEEF0] dark:border-[#34353C] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-[13px] text-[#858585] dark:text-[#B3B3BA]">
                <span className="text-[#168A62] font-bold text-lg leading-none">
                  ↗
                </span>
                <span>{english ? 'Total income' : 'Total pemasukan'}</span>
              </div>
              <p className="font-extrabold text-lg text-[#171717] dark:text-[#F4F4F5] tabular-nums">
                {rupiah(summary.classIncome)}
              </p>
            </div>
            <div className="rounded-[24px] bg-white dark:bg-[#191A20] border border-[#EEEEF0] dark:border-[#34353C] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-[13px] text-[#858585] dark:text-[#B3B3BA]">
                <span className="text-[#E31E24] font-bold text-lg leading-none">
                  ↘
                </span>
                <span>{english ? 'Total expenses' : 'Total pengeluaran'}</span>
              </div>
              <p className="font-extrabold text-lg text-[#171717] dark:text-[#F4F4F5] tabular-nums">
                {rupiah(summary.classExpensesTotal)}
              </p>
            </div>
          </div>

          {/* Cash Flow Chart Card */}
          <div className="rounded-[24px] bg-white dark:bg-[#191A20] border border-[#EEEEF0] dark:border-[#34353C] p-[18px] shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-[#171717] dark:text-[#F4F4F5]">
                  {english ? 'Expense activity' : 'Aktivitas pengeluaran'}
                </h2>
                <p className="text-xs text-[#858585] dark:text-[#B3B3BA]">
                  {english ? 'Class expenses recorded' : 'Pengeluaran kas kelas tercatat'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setWeekly((w) => !w)}
                className={`px-3.5 py-2 rounded-full text-[11px] font-bold tracking-wide transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  weekly
                    ? 'bg-[#E31E24] text-white'
                    : 'bg-[#E31E24]/10 text-[#E31E24]'
                }`}
              >
                {weekly
                  ? english
                    ? 'WEEKLY'
                    : 'MINGGU'
                  : english
                  ? 'MONTHLY'
                  : 'BULAN'}
              </button>
            </div>

            <div className="mt-4 w-full">
              <svg
                viewBox={`0 -8 ${svgW} ${svgH + 16}`}
                className="w-full h-[128px] overflow-visible"
                aria-label={english ? 'Cash flow chart' : 'Grafik arus kas'}
              >
                <defs>
                  <linearGradient
                    id="kasAreaGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#E31E24" stopOpacity="0.24" />
                    <stop
                      offset="100%"
                      stopColor="#FF6B70"
                      stopOpacity="0.02"
                    />
                  </linearGradient>
                </defs>
                {[0, 1, 2, 3].map((i) => (
                  <line
                    key={i}
                    x1={0}
                    y1={(svgH * i) / 3}
                    x2={svgW}
                    y2={(svgH * i) / 3}
                    stroke="currentColor"
                    className="text-gray-400/20"
                    strokeWidth={1}
                  />
                ))}
                <path d={areaPath} fill="url(#kasAreaGrad)" />
                <path
                  d={linePath}
                  fill="none"
                  stroke="#E31E24"
                  strokeWidth={3}
                  strokeLinecap="round"
                />
                {points.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r={4} fill="#E31E24" />
                ))}
              </svg>
              <div className="flex items-center justify-between text-[10px] text-[#858585] dark:text-[#B3B3BA] mt-1">
                {chartLabels.map((lbl) => (
                  <span key={lbl}>{lbl}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Column */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Class Update Card */}
          <button
            type="button"
            onClick={onOpenAssistant}
            className="w-full text-left rounded-[24px] bg-white dark:bg-[#191A20] border border-[#EEEEF0] dark:border-[#34353C] p-4 flex items-center gap-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:border-[#E31E24]/40 transition-colors cursor-pointer"
          >
            <Megaphone className="w-5 h-5 text-[#E31E24] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-[#171717] dark:text-[#F4F4F5]">
                {english ? 'Cash update' : 'Kabar kas'}
              </p>
              <p className="text-[11px] text-[#858585] dark:text-[#B3B3BA]">
                {english
                  ? 'Class balance and payment activity come from your class account.'
                  : 'Saldo dan aktivitas pembayaran mengikuti catatan kas kelas.'}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-[#E31E24] shrink-0" />
          </button>

          {/* Class Goal Preview */}
          <div className="rounded-[24px] bg-white dark:bg-[#191A20] border border-[#EEEEF0] dark:border-[#34353C] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-[#171717] dark:text-[#F4F4F5]">
                  {english ? 'Class contributions' : 'Iuran kelas'}
                </p>
                <p className="text-[11px] text-[#858585] dark:text-[#B3B3BA]">
                  {`${rupiah(contributionCollected)} / ${rupiah(contributionTarget)} ${english ? 'collected' : 'terkumpul'}`}
                </p>
              </div>
              <span className="text-[#E31E24] font-extrabold text-sm tabular-nums">
                {contributionPercent}%
              </span>
            </div>
            <div
              className="w-full h-[7px] rounded-full bg-[#E31E24]/12 overflow-hidden"
              role="progressbar"
              aria-label={english ? 'Class contributions collected' : 'Iuran kelas terkumpul'}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={contributionPercent}
            >
              <div className="h-full bg-[#E31E24] rounded-full" style={{ width: `${contributionPercent}%` }} />
            </div>
          </div>

          {/* Ask Assistant Outlined Button */}
          <button
            type="button"
            onClick={onOpenAssistant}
            className="w-full h-11 rounded-[24px] border border-[#EEEEF0] dark:border-[#34353C] bg-white/60 dark:bg-[#191A20]/60 hover:bg-white dark:hover:bg-[#191A20] text-[#E31E24] font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {english ? 'Ask KasMate Assistant' : 'Tanya Asisten KasMate'}
            </span>
          </button>

          {/* My Bills Section */}
          <div className="flex items-center justify-between pt-1">
            <h2 className="text-lg font-extrabold text-[#171717] dark:text-[#F4F4F5]">
              {english ? 'My bills' : 'Tagihan saya'}
            </h2>
            <button
              type="button"
              onClick={onOpenPayments}
              className="text-xs font-bold text-[#E31E24] hover:underline cursor-pointer"
            >
              {english ? 'See all' : 'Lihat semua'}
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {summary.myBills.map((bill) => {
              const paid = bill.status === PaymentStatus.LUNAS;
              return (
                <div
                  key={bill.id}
                  onClick={onOpenPayments}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') onOpenPayments();
                  }}
                  className="rounded-[24px] bg-white dark:bg-[#191A20] border border-[#EEEEF0] dark:border-[#34353C] p-4 flex items-center justify-between gap-3 shadow-[0_1px_6px_rgba(0,0,0,0.03)] hover:border-[#E31E24]/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-[42px] h-[42px] rounded-full bg-[#E31E24]/12 flex items-center justify-center shrink-0">
                      <Receipt className="w-5 h-5 text-[#E31E24]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-[15px] text-[#171717] dark:text-[#F4F4F5] truncate">
                        {bill.title}
                      </p>
                      <p className="text-xs text-[#858585] dark:text-[#B3B3BA]">
                        {english ? 'Due' : 'Tenggat'}{' '}
                        {tanggal(bill.dueDateMillis, english)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm text-[#B5121B] dark:text-[#FF8A80] tabular-nums">
                {rupiah(bill.amountDue || bill.amount)}
                    </p>
                    <p
                      className={`font-extrabold text-[10px] ${
                        paid ? 'text-[#168A62]' : 'text-[#E31E24]'
                      }`}
                    >
                      {paid
                        ? english
                          ? 'PAID'
                          : 'LUNAS'
                        : bill.status === PaymentStatus.PROSES
                        ? english
                          ? 'IN REVIEW'
                          : 'DIPERIKSA'
                        : bill.status === PaymentStatus.SEBAGIAN
                        ? english
                          ? 'PARTIAL'
                          : 'SEBAGIAN'
                        : english
                        ? 'UNPAID'
                        : 'BELUM'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Expenses Section */}
          <div className="flex items-center justify-between pt-1">
            <h2 className="text-lg font-extrabold text-[#171717] dark:text-[#F4F4F5]">
              {english ? 'Recent expenses' : 'Pengeluaran terbaru'}
            </h2>
            <button
              type="button"
              onClick={onOpenLedger}
              className="text-xs font-bold text-[#E31E24] hover:underline cursor-pointer"
            >
              {english ? 'History' : 'Riwayat'}
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {summary.expenses.map((exp) => (
              <div
                key={exp.id}
                onClick={onOpenLedger}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onOpenLedger();
                }}
                className="rounded-[24px] bg-white dark:bg-[#191A20] border border-[#EEEEF0] dark:border-[#34353C] p-4 flex items-center justify-between gap-3 shadow-[0_1px_6px_rgba(0,0,0,0.03)] hover:border-[#E31E24]/40 transition-colors cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[15px] text-[#171717] dark:text-[#F4F4F5] truncate">
                    {exp.description}
                  </p>
                  <p className="text-xs text-[#858585] dark:text-[#B3B3BA]">
                    {tanggal(exp.dateMillis, english)} · {exp.noteBy}
                  </p>
                </div>
                <span className="font-bold text-[13px] text-[#B5121B] dark:text-[#FF8A80] tabular-nums shrink-0">
                  − {rupiah(exp.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

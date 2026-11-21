import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  Clock,
  Flag,
  ListFilter,
  ReceiptText,
  Tag,
} from 'lucide-react';
import { Expense, KasSummary } from '../types';
import { rupiah, tanggal } from '../data/kasData';
import { ModalPortal } from './ModalPortal';

interface LedgerTabProps {
  summary: KasSummary;
  english: boolean;
}

export const LedgerTab: React.FC<LedgerTabProps> = ({ summary, english }) => {
  const [selectedExpenseId, setSelectedExpenseId] = useState<string>('ALL');
  const [openCombo, setOpenCombo] = useState<'expense' | 'category' | 'age' | null>(null);
  const [category, setCategory] = useState<'all' | 'supplies' | 'academic'>(
    'all'
  );
  const [ageFilter, setAgeFilter] = useState<'all' | '7d' | '30d'>('all');
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const filtersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) {
        setOpenCombo(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const timer = window.setTimeout(() => {
      setIsLoading(false);
    }, 320);
    return () => window.clearTimeout(timer);
  }, [selectedExpenseId, category, ageFilter]);

  const categories: Array<{
    key: 'all' | 'supplies' | 'academic';
    label: string;
  }> = [
    { key: 'all', label: english ? 'All categories' : 'Semua kategori' },
    { key: 'supplies', label: english ? 'Supplies' : 'Perlengkapan' },
    { key: 'academic', label: english ? 'Academic' : 'Akademik' },
  ];
  const ages: Array<{ key: 'all' | '7d' | '30d'; label: string }> = [
    { key: 'all', label: english ? 'All time' : 'Semua waktu' },
    { key: '7d', label: english ? 'Last 7 days' : '7 hari terakhir' },
    { key: '30d', label: english ? 'Last 30 days' : '30 hari terakhir' },
  ];

  const selectedComboExpense = summary.expenses.find(
    (e) => e.id === selectedExpenseId
  );
  const activeCategoryLabel =
    categories.find((c) => c.key === category)?.label ?? categories[0].label;
  const activeAgeLabel =
    ages.find((a) => a.key === ageFilter)?.label ?? ages[0].label;
  const contributionPercent =
    summary.classIuranTarget > 0
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round((summary.classIuranCollected / summary.classIuranTarget) * 100)
          )
        )
      : 0;

  const filtered = summary.expenses.filter((expense) => {
    const lowerDesc = expense.description.toLowerCase();
    const cat: 'academic' | 'supplies' =
      lowerDesc.includes('foto') ||
      lowerDesc.includes('photocop') ||
      lowerDesc.includes('exam')
        ? 'academic'
        : 'supplies';
    const ageDays = Math.floor(
      Math.max(0, Date.now() - expense.dateMillis) / 86_400_000
    );
    const matchesCombo =
      selectedExpenseId === 'ALL' || expense.id === selectedExpenseId;
    const matchesCategory = category === 'all' || cat === category;
    const matchesAge =
      ageFilter === '7d'
        ? ageDays <= 7
        : ageFilter === '30d'
        ? ageDays <= 30
        : true;
    return matchesCombo && matchesCategory && matchesAge;
  });

  return (
    <div className="w-full flex flex-col gap-3.5 pb-6">
      <div className="pt-2 pb-1">
        <h1 className="text-[25px] font-extrabold text-[#171717] dark:text-[#F4F4F5]">
          {english ? 'Class transparency' : 'Transparansi kas'}
        </h1>
        <p className="text-xs text-[#858585] dark:text-[#B3B3BA]">
          {english
            ? 'See how class funds are used'
            : 'Lihat aliran dana kelas secara terbuka'}
        </p>
      </div>

      {/* Live Class Balance Banner */}
      {isLoading ? (
        <div className="w-full h-[116px] rounded-[24px] skeleton-shimmer border border-[#EEEEF0]/70 dark:border-[#34353C]/70" />
      ) : (
        <div className="w-full rounded-[24px] kas-gradient p-5 text-white shadow-md animate-page-enter">
          <p className="text-white/85 text-[11px] font-bold tracking-wider">
            {english ? 'LIVE CLASS BALANCE' : 'SALDO KAS KELAS'}
          </p>
          <p className="text-[29px] font-extrabold mt-0.5 tabular-nums">
            {rupiah(summary.totalBalance)}
          </p>
          <p className="text-white/80 text-xs mt-0.5">
            {english
              ? 'Updated with the latest class ledger'
              : 'Diperbarui dari catatan kas kelas'}
          </p>
        </div>
      )}

      <h2 className="text-[17px] font-bold text-[#171717] dark:text-[#F4F4F5] pt-1">
        {english ? 'Find a class expense' : 'Cari pengeluaran kelas'}
      </h2>

      {/* All Combo Box Pickers */}
      <div ref={filtersRef} className="flex flex-col gap-2.5">
        {/* Main Expense Combo Box */}
        <div className={`relative ${openCombo === 'expense' ? 'z-30' : 'z-20'}`}>
          <button
            type="button"
            onClick={() =>
              setOpenCombo((prev) => (prev === 'expense' ? null : 'expense'))
            }
            aria-haspopup="listbox"
            aria-expanded={openCombo === 'expense'}
            className={`w-full h-12 px-4 rounded-[16px] border bg-white/95 dark:bg-[#191A20]/95 backdrop-blur-sm flex items-center justify-between gap-2 text-sm font-medium transition-all duration-200 cursor-pointer ${
              openCombo === 'expense'
                ? 'border-[#E31E24] ring-4 ring-[#E31E24]/10 text-[#171717] dark:text-[#F4F4F5]'
                : 'border-[#EEEEF0] dark:border-[#34353C] text-[#171717] dark:text-[#F4F4F5] hover:border-[#E31E24]/45'
            }`}
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <ListFilter className="w-4 h-4 text-[#E31E24] shrink-0" />
              <span className="truncate">
                {selectedComboExpense
                  ? selectedComboExpense.description
                  : english
                  ? 'All class expenses'
                  : 'Semua pengeluaran kelas'}
              </span>
            </span>
            <ChevronDown
              className={`w-4 h-4 text-[#858585] dark:text-[#B3B3BA] transition-transform duration-300 ios-spring shrink-0 ${
                openCombo === 'expense' ? 'rotate-180 text-[#E31E24]' : ''
              }`}
            />
          </button>

          {openCombo === 'expense' && (
            <div
              role="listbox"
              className="absolute left-0 right-0 mt-2 rounded-[20px] bg-white dark:bg-[#191A20] border border-[#EEEEF0] dark:border-[#34353C] shadow-[0_14px_34px_rgba(0,0,0,0.12)] dark:shadow-[0_16px_38px_rgba(0,0,0,0.45)] overflow-hidden p-1.5 flex flex-col gap-1 animate-bubble-pop"
            >
              <button
                type="button"
                role="option"
                aria-selected={selectedExpenseId === 'ALL'}
                onClick={() => {
                  setSelectedExpenseId('ALL');
                  setOpenCombo(null);
                }}
                className={`w-full px-3.5 py-2.5 rounded-[14px] text-left text-sm flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                  selectedExpenseId === 'ALL'
                    ? 'bg-[#E31E24]/10 text-[#E31E24] font-bold'
                    : 'text-[#171717] dark:text-[#F4F4F5] hover:bg-black/5 dark:hover:bg-white/5 font-medium'
                }`}
              >
                <span>
                  {english ? 'All class expenses' : 'Semua pengeluaran kelas'}
                </span>
                {selectedExpenseId === 'ALL' && (
                  <Check className="w-4 h-4 text-[#E31E24] shrink-0" />
                )}
              </button>

              {summary.expenses.map((exp) => {
                const active = selectedExpenseId === exp.id;
                return (
                  <button
                    key={exp.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      setSelectedExpenseId(exp.id);
                      setOpenCombo(null);
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-[14px] text-left text-sm flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#E31E24]/10 text-[#E31E24] font-bold'
                        : 'text-[#171717] dark:text-[#F4F4F5] hover:bg-black/5 dark:hover:bg-white/5 font-medium'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate">{exp.description}</p>
                      <p className="text-[11px] text-[#858585] dark:text-[#B3B3BA] font-normal tabular-nums">
                        {rupiah(exp.amount)} · {tanggal(exp.dateMillis, english)}
                      </p>
                    </div>
                    {active && (
                      <Check className="w-4 h-4 text-[#E31E24] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Category & Time-Range Combo Boxes */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Category Combo Box */}
          <div className={`relative ${openCombo === 'category' ? 'z-30' : 'z-10'}`}>
            <button
              type="button"
              onClick={() =>
                setOpenCombo((prev) => (prev === 'category' ? null : 'category'))
              }
              aria-haspopup="listbox"
              aria-expanded={openCombo === 'category'}
              className={`w-full h-11 px-3.5 rounded-[15px] border bg-white/95 dark:bg-[#191A20]/95 backdrop-blur-sm flex items-center justify-between gap-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                openCombo === 'category'
                  ? 'border-[#E31E24] ring-4 ring-[#E31E24]/10 text-[#E31E24]'
                  : 'border-[#EEEEF0] dark:border-[#34353C] text-[#171717] dark:text-[#F4F4F5] hover:border-[#E31E24]/45'
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <Tag className="w-3.5 h-3.5 text-[#E31E24] shrink-0" />
                <span className="truncate">{activeCategoryLabel}</span>
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#858585] dark:text-[#B3B3BA] transition-transform duration-300 ios-spring shrink-0 ${
                  openCombo === 'category' ? 'rotate-180 text-[#E31E24]' : ''
                }`}
              />
            </button>

            {openCombo === 'category' && (
              <div
                role="listbox"
                className="absolute left-0 right-0 mt-1.5 rounded-[18px] bg-white dark:bg-[#191A20] border border-[#EEEEF0] dark:border-[#34353C] shadow-[0_14px_34px_rgba(0,0,0,0.12)] dark:shadow-[0_16px_38px_rgba(0,0,0,0.45)] overflow-hidden p-1.5 flex flex-col gap-1 animate-bubble-pop"
              >
                {categories.map((opt) => {
                  const active = category === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        setCategory(opt.key);
                        setOpenCombo(null);
                      }}
                      className={`w-full px-3 py-2 rounded-[12px] text-left text-xs flex items-center justify-between gap-1.5 transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#E31E24]/10 text-[#E31E24] font-bold'
                          : 'text-[#171717] dark:text-[#F4F4F5] hover:bg-black/5 dark:hover:bg-white/5 font-medium'
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {active && (
                        <Check className="w-3.5 h-3.5 text-[#E31E24] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Age / Time-Range Combo Box */}
          <div className={`relative ${openCombo === 'age' ? 'z-30' : 'z-10'}`}>
            <button
              type="button"
              onClick={() =>
                setOpenCombo((prev) => (prev === 'age' ? null : 'age'))
              }
              aria-haspopup="listbox"
              aria-expanded={openCombo === 'age'}
              className={`w-full h-11 px-3.5 rounded-[15px] border bg-white/95 dark:bg-[#191A20]/95 backdrop-blur-sm flex items-center justify-between gap-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                openCombo === 'age'
                  ? 'border-[#E31E24] ring-4 ring-[#E31E24]/10 text-[#E31E24]'
                  : 'border-[#EEEEF0] dark:border-[#34353C] text-[#171717] dark:text-[#F4F4F5] hover:border-[#E31E24]/45'
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <Clock className="w-3.5 h-3.5 text-[#E31E24] shrink-0" />
                <span className="truncate">{activeAgeLabel}</span>
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#858585] dark:text-[#B3B3BA] transition-transform duration-300 ios-spring shrink-0 ${
                  openCombo === 'age' ? 'rotate-180 text-[#E31E24]' : ''
                }`}
              />
            </button>

            {openCombo === 'age' && (
              <div
                role="listbox"
                className="absolute left-0 right-0 mt-1.5 rounded-[18px] bg-white dark:bg-[#191A20] border border-[#EEEEF0] dark:border-[#34353C] shadow-[0_14px_34px_rgba(0,0,0,0.12)] dark:shadow-[0_16px_38px_rgba(0,0,0,0.45)] overflow-hidden p-1.5 flex flex-col gap-1 animate-bubble-pop"
              >
                {ages.map((opt) => {
                  const active = ageFilter === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        setAgeFilter(opt.key);
                        setOpenCombo(null);
                      }}
                      className={`w-full px-3 py-2 rounded-[12px] text-left text-xs flex items-center justify-between gap-1.5 transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#E31E24]/10 text-[#E31E24] font-bold'
                          : 'text-[#171717] dark:text-[#F4F4F5] hover:bg-black/5 dark:hover:bg-white/5 font-medium'
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {active && (
                        <Check className="w-3.5 h-3.5 text-[#E31E24] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <h2 className="text-[17px] font-bold text-[#171717] dark:text-[#F4F4F5] pt-1">
        {english ? 'Income and expenses' : 'Rincian transaksi kelas'}
      </h2>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[0, 1].map((item) => (
            <div
              key={item}
              className="rounded-[24px] bg-white/90 dark:bg-[#191A20]/90 border border-[#EEEEF0] dark:border-[#34353C] p-4 flex flex-col gap-2.5"
            >
              <div className="flex items-center gap-3">
                <div className="w-[42px] h-[42px] rounded-full skeleton-shimmer shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-4 w-3/4 rounded-lg skeleton-shimmer" />
                  <div className="h-3 w-1/2 rounded-lg skeleton-shimmer" />
                </div>
                <div className="h-4 w-16 rounded-lg skeleton-shimmer shrink-0" />
              </div>
              <div className="pl-[54px]">
                <div className="h-2.5 w-2/3 rounded-md skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[24px] bg-white/95 dark:bg-[#191A20]/95 border border-[#EEEEF0] dark:border-[#34353C] p-4 text-[13px] text-[#858585] dark:text-[#B3B3BA]">
          {english
            ? 'No transactions match those filters'
            : 'Tidak ada transaksi yang cocok'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-page-enter">
          {filtered.map((expense) => (
            <button
              key={expense.id}
              type="button"
              onClick={() => setSelectedExpense(expense)}
              className="w-full text-left rounded-[24px] bg-white/95 dark:bg-[#191A20]/95 border border-[#EEEEF0] dark:border-[#34353C] p-4 flex flex-col gap-1.5 hover:border-[#E31E24]/45 active:scale-[0.98] ios-spring transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="w-[42px] h-[42px] rounded-full bg-[#E31E24]/10 flex items-center justify-center shrink-0">
                  <ReceiptText className="w-5 h-5 text-[#E31E24]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[#171717] dark:text-[#F4F4F5] truncate">
                    {expense.description}
                  </p>
                  <p className="text-[11px] text-[#858585] dark:text-[#B3B3BA]">
                    {tanggal(expense.dateMillis, english)} · {expense.noteBy}
                  </p>
                </div>
                <span className="font-bold text-xs text-[#B5121B] dark:text-[#FF8A80] tabular-nums shrink-0">
                  − {rupiah(expense.amount)}
                </span>
              </div>
              <span className="pl-[54px] text-[10px] font-medium text-[#E31E24]">
                {english
                  ? 'Tap to view expense details and receipt status'
                  : 'Ketuk untuk melihat detail dan status nota'}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Class contribution progress */}
      <div className="rounded-[24px] bg-white dark:bg-[#191A20] border border-[#EEEEF0] dark:border-[#34353C] p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Flag className="w-5 h-5 text-[#E31E24]" />
          <p className="font-bold text-sm text-[#171717] dark:text-[#F4F4F5]">
            {english ? 'Class contributions' : 'Iuran kelas'}
          </p>
        </div>
        <p className="text-xs text-[#858585] dark:text-[#B3B3BA] tabular-nums">
          {english
            ? `${rupiah(summary.classIuranCollected)} of ${rupiah(summary.classIuranTarget)} · ${contributionPercent}%`
            : `${rupiah(summary.classIuranCollected)} dari ${rupiah(summary.classIuranTarget)} · ${contributionPercent}%`}
        </p>
        <div
          className="w-full h-2 rounded-full bg-[#E31E24]/12 overflow-hidden"
          role="progressbar"
          aria-label={english ? 'Class contributions collected' : 'Iuran kelas terkumpul'}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={contributionPercent}
        >
          <div className="h-full bg-[#E31E24] rounded-full" style={{ width: `${contributionPercent}%` }} />
        </div>
      </div>

      {/* Expense Details Modal */}
      {selectedExpense && (
        <ModalPortal>
          <div className="w-full max-w-sm rounded-[26px] bg-white dark:bg-[#191A20] border border-[#EEEEF0] dark:border-[#34353C] p-6 shadow-2xl flex flex-col gap-2.5 animate-bubble-pop">
            <div className="flex items-center gap-2 text-[#E31E24]">
              <ReceiptText className="w-6 h-6" />
              <h3 className="text-lg font-bold text-[#171717] dark:text-[#F4F4F5]">
                {english ? 'Expense details' : 'Detail pengeluaran'}
              </h3>
            </div>
            <p className="font-bold text-base text-[#171717] dark:text-[#F4F4F5] pt-1">
              {selectedExpense.description}
            </p>
            <p className="text-sm text-[#171717] dark:text-[#F4F4F5] tabular-nums">
              {english ? 'Amount' : 'Nominal'}:{' '}
              <span className="font-bold">{rupiah(selectedExpense.amount)}</span>
            </p>
            <p className="text-sm text-[#171717] dark:text-[#F4F4F5]">
              {english ? 'Date' : 'Tanggal'}:{' '}
              {tanggal(selectedExpense.dateMillis, english)}
            </p>
            <p className="text-sm text-[#171717] dark:text-[#F4F4F5]">
              {english ? 'Recorded by' : 'Dicatat oleh'}:{' '}
              {selectedExpense.noteBy}
            </p>
            <p className="text-xs text-[#858585] dark:text-[#B3B3BA] pt-1">
              {english
                ? 'No digital receipt is attached to this entry yet.'
                : 'Nota digital belum terlampir pada transaksi ini.'}
            </p>
            <button
              type="button"
              onClick={() => setSelectedExpense(null)}
              className="self-end mt-2 px-5 py-2 rounded-xl text-sm font-bold text-[#E31E24] hover:bg-[#E31E24]/10 cursor-pointer"
            >
              OK
            </button>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

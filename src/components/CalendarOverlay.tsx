import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Plus,
  StickyNote,
  Trash2,
  X,
} from 'lucide-react';
import { CalendarStickyNote } from '../types';
import { STICKY_COLORS } from '../data/kasData';

interface CalendarOverlayProps {
  english: boolean;
  notes: CalendarStickyNote[];
  onClose: () => void;
  onAdd: (note: CalendarStickyNote) => void;
  onToggle: (note: CalendarStickyNote) => void;
  onDelete: (note: CalendarStickyNote) => void;
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const CalendarOverlay: React.FC<CalendarOverlayProps> = ({
  english,
  notes,
  onClose,
  onAdd,
  onToggle,
  onDelete,
}) => {
  const [monthDate, setMonthDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [noteText, setNoteText] = useState('');
  const [colorIndex, setColorIndex] = useState(0);

  const locale = english ? 'en-US' : 'id-ID';
  const todayKey = formatDateKey(new Date());

  const monthLabel = useMemo(() => {
    const formatted = new Intl.DateTimeFormat(locale, {
      month: 'long',
      year: 'numeric',
    }).format(monthDate);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, [monthDate, locale]);

  const calendarCells = useMemo(() => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    // Monday = 0 ... Sunday = 6
    const offset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<number | null> = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [monthDate]);

  const weekdays = english
    ? ['M', 'T', 'W', 'T', 'F', 'S', 'S']
    : ['S', 'S', 'R', 'K', 'J', 'S', 'M'];

  const selectedKey = selectedDate ? formatDateKey(selectedDate) : null;
  const dayNotes = selectedKey
    ? notes.filter((n) => n.dateKey === selectedKey)
    : [];

  const formattedSelectedTitle = useMemo(() => {
    if (!selectedDate) return '';
    const str = new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(selectedDate);
    return str.charAt(0).toUpperCase() + str.slice(1);
  }, [selectedDate, locale]);

  const handleAddNote = () => {
    if (!selectedKey || !noteText.trim()) return;
    onAdd({
      id: `note-${Date.now()}`,
      dateKey: selectedKey,
      text: noteText.trim(),
      colorIndex,
      done: false,
    });
    setNoteText('');
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/55 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={english ? 'My calendar' : 'Kalenderku'}
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] rounded-[30px] bg-white dark:bg-[#191A20] border border-[#EEEEF0] dark:border-[#34353C] shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* Month Pane */}
        <div
          className={`flex-1 p-5 sm:p-6 overflow-y-auto ${
            selectedDate ? 'md:border-r md:border-[#EEEEF0] md:dark:border-[#34353C]' : ''
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-[42px] h-[42px] rounded-[14px] bg-[#E31E24]/10 flex items-center justify-center shrink-0">
                <CalendarIcon className="w-5 h-5 text-[#E31E24]" />
              </div>
              <div>
                <h2 className="font-extrabold text-xl text-[#171717] dark:text-[#F4F4F5]">
                  {english ? 'My calendar' : 'Kalenderku'}
                </h2>
                <p className="text-[11px] text-[#858585] dark:text-[#B3B3BA]">
                  {english
                    ? 'Plans, reminders, and little wins'
                    : 'Catatan, pengingat, dan target kecil'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={english ? 'Close calendar' : 'Tutup kalender'}
              className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-[#171717] dark:text-[#F4F4F5] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <h3 className="font-bold text-lg text-[#171717] dark:text-[#F4F4F5]">
              {monthLabel}
            </h3>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setMonthDate(
                    (prev) =>
                      new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                  )
                }
                aria-label={english ? 'Previous month' : 'Bulan sebelumnya'}
                className="min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-[#171717] dark:text-[#F4F4F5] cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setMonthDate(
                    (prev) =>
                      new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                  )
                }
                aria-label={english ? 'Next month' : 'Bulan berikutnya'}
                className="min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-[#171717] dark:text-[#F4F4F5] cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mt-3 text-center">
            {weekdays.map((dayLabel, idx) => (
              <div
                key={idx}
                className="text-[11px] font-bold text-[#858585] dark:text-[#B3B3BA] py-1"
              >
                {dayLabel}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 mt-1">
            {calendarCells.map((dayNum, idx) => {
              if (dayNum === null) {
                return <div key={`empty-${idx}`} className="aspect-square" />;
              }
              const cellDate = new Date(
                monthDate.getFullYear(),
                monthDate.getMonth(),
                dayNum
              );
              const key = formatDateKey(cellDate);
              const notesForDay = notes.filter((n) => n.dateKey === key);
              const isSelected = selectedKey === key;
              const isToday = todayKey === key;
              const bgTint = isSelected
                ? '#E31E24'
                : notesForDay.length > 0
                ? STICKY_COLORS[notesForDay[0].colorIndex % STICKY_COLORS.length]
                : undefined;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setSelectedDate(cellDate);
                    setNoteText('');
                    setColorIndex(0);
                  }}
                  style={{ backgroundColor: bgTint }}
                  className={`aspect-square rounded-[15px] flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'text-white font-bold shadow-sm'
                      : notesForDay.length > 0
                      ? 'text-[#171717] font-bold'
                      : 'text-[#171717] dark:text-[#F4F4F5] hover:bg-black/5 dark:hover:bg-white/5'
                  } ${
                    isToday && !isSelected
                      ? 'border border-[#E31E24]/60 font-bold'
                      : ''
                  }`}
                >
                  <span className="text-[13px] tabular-nums">{dayNum}</span>
                  {notesForDay.length > 0 ? (
                    <span className="flex items-center gap-0.5">
                      {notesForDay.slice(0, 3).map((n) => (
                        <span
                          key={n.id}
                          className="w-1 h-1 rounded-full"
                          style={{
                            backgroundColor: isSelected
                              ? '#FFFFFF'
                              : '#E31E24',
                          }}
                        />
                      ))}
                    </span>
                  ) : (
                    <span className="h-1" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-[18px] bg-[#E31E24]/7 px-3.5 py-3 flex items-center gap-2.5">
            <StickyNote className="w-[18px] h-[18px] text-[#E31E24] shrink-0" />
            <span className="text-xs text-[#858585] dark:text-[#B3B3BA]">
              {english
                ? 'Tap a date to open its notes'
                : 'Ketuk tanggal untuk melihat detail dan catatan'}
            </span>
          </div>
        </div>

        {/* Day Details Sidebar (Desktop inline, Mobile overlay drawer) */}
        {selectedDate && (
          <div className="absolute inset-y-0 right-0 w-[92%] md:static md:w-[360px] bg-white dark:bg-[#191A20] border-l border-[#EEEEF0] dark:border-[#34353C] p-5 overflow-y-auto flex flex-col gap-3 shadow-2xl md:shadow-none z-10">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                aria-label={
                  english ? 'Back to calendar' : 'Kembali ke kalender'
                }
                className="min-w-[40px] min-h-[40px] -ml-2 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-[#171717] dark:text-[#F4F4F5] cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <span className="font-bold text-[17px] text-[#171717] dark:text-[#F4F4F5]">
                {english ? 'Day details' : 'Detail hari'}
              </span>
            </div>

            <div>
              <h3 className="font-extrabold text-[21px] leading-[27px] text-[#171717] dark:text-[#F4F4F5]">
                {formattedSelectedTitle}
              </h3>
              <p className="text-[11px] text-[#858585] dark:text-[#B3B3BA] mt-0.5">
                {english
                  ? `${dayNotes.length} notes · mark tasks when done`
                  : `${dayNotes.length} catatan · centang tugas yang selesai`}
              </p>
            </div>

            {dayNotes.length === 0 ? (
              <div className="rounded-[18px] bg-[#F7F8FA] dark:bg-[#24252C] p-3.5 flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-[#E31E24] shrink-0" />
                <span className="text-xs text-[#858585] dark:text-[#B3B3BA]">
                  {english
                    ? 'Nothing planned yet. Add a sticky note below.'
                    : 'Belum ada agenda. Tambahkan catatan tempel di bawah.'}
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {dayNotes.map((note) => (
                  <div
                    key={note.id}
                    style={{
                      backgroundColor:
                        STICKY_COLORS[note.colorIndex % STICKY_COLORS.length],
                    }}
                    className="rounded-2xl pl-3 pr-1.5 py-2 flex items-center gap-2"
                  >
                    <p
                      className={`flex-1 text-[13px] font-medium break-words ${
                        note.done
                          ? 'line-through text-[#5E5962]'
                          : 'text-[#252128]'
                      }`}
                    >
                      {note.text}
                    </p>
                    <button
                      type="button"
                      onClick={() => onToggle(note)}
                      aria-label={english ? 'Toggle done' : 'Tandai selesai'}
                      className="min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center hover:bg-black/10 cursor-pointer"
                    >
                      <Check
                        className={`w-4 h-4 ${
                          note.done ? 'text-[#168A62]' : 'text-[#5E5962]'
                        }`}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(note)}
                      aria-label={english ? 'Delete note' : 'Hapus catatan'}
                      className="min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center hover:bg-black/10 text-[#E31E24] cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2.5">
              <h4 className="font-bold text-[15px] text-[#171717] dark:text-[#F4F4F5]">
                {english ? 'Add a sticky note' : 'Tambah catatan tempel'}
              </h4>
              <textarea
                rows={3}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder={
                  english
                    ? 'Reminder, bill, or class plan…'
                    : 'Pengingat, kas, atau agenda kelas…'
                }
                className="w-full rounded-[17px] border border-[#EEEEF0] dark:border-[#34353C] bg-[#F7F8FA] dark:bg-[#24252C] p-3 text-xs text-[#171717] dark:text-[#F4F4F5] placeholder:text-[#858585] focus:outline-none focus:ring-2 focus:ring-[#E31E24] resize-none"
              />
              <span className="text-[11px] text-[#858585] dark:text-[#B3B3BA]">
                {english ? 'Choose a color' : 'Pilih warna'}
              </span>
              <div className="flex items-center gap-2.5">
                {STICKY_COLORS.map((hex, index) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setColorIndex(index)}
                    style={{ backgroundColor: hex }}
                    aria-label={
                      english
                        ? `Sticky color ${index + 1}`
                        : `Warna catatan ${index + 1}`
                    }
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                      colorIndex === index
                        ? 'border-2 border-[#E31E24] scale-105'
                        : ''
                    }`}
                  >
                    {colorIndex === index && (
                      <Check className="w-4 h-4 text-[#282828]" />
                    )}
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={!noteText.trim()}
                onClick={handleAddNote}
                className="w-full h-11 rounded-2xl bg-[#E31E24] disabled:opacity-45 text-white font-bold text-sm flex items-center justify-center gap-1.5 hover:bg-[#B5121B] transition-colors cursor-pointer disabled:cursor-not-allowed mt-1"
              >
                <Plus className="w-4 h-4" />
                {english ? 'Save note' : 'Simpan catatan'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

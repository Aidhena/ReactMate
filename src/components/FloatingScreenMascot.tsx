import React, { useEffect, useRef, useState } from 'react';
import { MascotMood } from '../types';
import {
  KasMateActivityRobot,
  RobotActivity,
} from './KasMateActivityRobot';

interface FloatingScreenMascotProps {
  mood: MascotMood;
  daysLate: number;
  english: boolean;
  onOpenPayments: () => void;
}

const ACTIVITIES_BY_MOOD: Record<MascotMood, RobotActivity[]> = {
  [MascotMood.ANGRY]: ['scolding', 'clock_warning'],
  [MascotMood.SAD]: ['worried_note', 'clock_warning'],
  [MascotMood.EXCITED]: ['coin_toss', 'cheering'],
  [MascotMood.HAPPY]: ['saving_coin', 'checklist', 'waving'],
  [MascotMood.NEUTRAL]: ['writing_notes', 'calculating', 'coin_bounce', 'waving'],
};

function useSlowTypewriter(phrases: string[]): string {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const phrasesKey = phrases.join('|');
  const phrasesRef = useRef(phrases);
  phrasesRef.current = phrases;

  useEffect(() => {
    setPhraseIndex(0);
    setCharCount(0);
    setDeleting(false);
  }, [phrasesKey]);

  useEffect(() => {
    const list = phrasesRef.current;
    const activePhrase = list[phraseIndex % list.length] ?? '';
    const delay = deleting ? 50 : 90;

    if (!deleting && charCount >= activePhrase.length) {
      const t = window.setTimeout(() => setDeleting(true), 2100);
      return () => window.clearTimeout(t);
    }

    if (deleting && charCount <= 0) {
      const t = window.setTimeout(() => {
        setDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % list.length);
      }, 360);
      return () => window.clearTimeout(t);
    }

    const t = window.setTimeout(() => {
      setCharCount((prev) => prev + (deleting ? -1 : 1));
    }, delay);

    return () => window.clearTimeout(t);
  }, [charCount, deleting, phraseIndex, phrasesKey]);

  const current = phrases[phraseIndex % phrases.length] ?? '';
  return current.slice(0, charCount);
}

const WIDGET_SIZE = 74;

function clampPos(x: number, y: number): { x: number; y: number } {
  if (typeof window === 'undefined') return { x, y };
  const minX = 12;
  const maxX = Math.max(minX, window.innerWidth - WIDGET_SIZE - 12);
  const minY = 18;
  const maxY = Math.max(minY, window.innerHeight - WIDGET_SIZE - 108);
  return {
    x: Math.min(maxX, Math.max(minX, x)),
    y: Math.min(maxY, Math.max(minY, y)),
  };
}

export const FloatingScreenMascot: React.FC<FloatingScreenMascotProps> = ({
  mood,
  daysLate,
  english,
  onOpenPayments,
}) => {
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    if (typeof window === 'undefined') return { x: 260, y: 120 };
    try {
      const saved = localStorage.getItem('kasmate_mascot_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
          return clampPos(parsed.x, parsed.y);
        }
      }
    } catch {
      // ignore storage errors
    }
    return clampPos(window.innerWidth - WIDGET_SIZE - 16, 86);
  });

  const [dragging, setDragging] = useState(false);
  const [viewportW, setViewportW] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 400
  );
  const [activityIdx, setActivityIdx] = useState(0);

  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  const pool = ACTIVITIES_BY_MOOD[mood] ?? ACTIVITIES_BY_MOOD[MascotMood.NEUTRAL];

  useEffect(() => {
    setActivityIdx(0);
  }, [mood]);

  useEffect(() => {
    if (pool.length <= 1) return;
    const timer = window.setInterval(() => {
      setActivityIdx((prev) => (prev + 1) % pool.length);
    }, 4800);
    return () => window.clearInterval(timer);
  }, [pool]);

  useEffect(() => {
    const onResize = () => {
      setViewportW(window.innerWidth);
      setPos((prev) => clampPos(prev.x, prev.y));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const phrases = (() => {
    if (mood === MascotMood.EXCITED) {
      return english
        ? ['Tap to pay!', 'Payment request sent!']
        : ['Ketuk untuk bayar!', 'Permintaan pembayaran terkirim!'];
    }
    if (mood === MascotMood.ANGRY) {
      return english
        ? ['Tap to pay!', `${daysLate}d overdue!`, 'Pay class dues now!']
        : ['Ketuk untuk bayar!', `Nunggak ${daysLate} hari!`, 'Bayar kas sekarang!'];
    }
    if (mood === MascotMood.SAD) {
      return english
        ? ['Tap to pay!', 'Bill is past due!']
        : ['Ketuk untuk bayar!', 'Tagihan lewat tempo!'];
    }
    if (mood === MascotMood.HAPPY) {
      return english
        ? ['Tap to check bills!', 'All dues paid!']
        : ['Ketuk cek tagihan!', 'Kas sudah lunas!'];
    }
    return english
      ? ['Tap to pay!', 'Pay class dues now!']
      : ['Ketuk untuk bayar!', 'Bayar kas sekarang!'];
  })();

  const typedText = useSlowTypewriter(phrases);
  const currentActivity = pool[activityIdx % pool.length];
  const isOnRightSide = pos.x + WIDGET_SIZE / 2 > viewportW / 2;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: pos.x,
      originY: pos.y,
      moved: false,
    };
    setDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = dragRef.current;
    if (!state || state.pointerId !== e.pointerId) return;
    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
      state.moved = true;
    }
    if (state.moved) {
      setPos(clampPos(state.originX + dx, state.originY + dy));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = dragRef.current;
    if (!state || state.pointerId !== e.pointerId) return;
    const wasMoved = state.moved;
    dragRef.current = null;
    setDragging(false);

    if (!wasMoved) {
      onOpenPayments();
      return;
    }

    // Snap gently to nearest corner/edge if close to screen borders, while allowing placement anywhere
    setPos((prev) => {
      const minX = 12;
      const maxX = Math.max(minX, window.innerWidth - WIDGET_SIZE - 12);
      const minY = 18;
      const maxY = Math.max(minY, window.innerHeight - WIDGET_SIZE - 108);

      let nextX = prev.x;
      let nextY = prev.y;
      if (nextX - minX < 28) nextX = minX;
      else if (maxX - nextX < 28) nextX = maxX;
      if (nextY - minY < 28) nextY = minY;
      else if (maxY - nextY < 28) nextY = maxY;

      const finalPos = { x: nextX, y: nextY };
      try {
        localStorage.setItem('kasmate_mascot_pos', JSON.stringify(finalPos));
      } catch {
        // ignore storage errors
      }
      return finalPos;
    });
  };

  const isAngry = mood === MascotMood.ANGRY;
  const isExcited = mood === MascotMood.EXCITED;

  return (
    <div
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        touchAction: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`fixed z-40 select-none ${
        dragging
          ? 'scale-105 cursor-grabbing'
          : 'transition-[left,top,transform] duration-300 ios-spring cursor-grab'
      }`}
    >
      <div className="relative w-[74px] h-[74px] flex items-center justify-center">
        {/* Login-style Slow Typewriter Speech Bubble (auto-flips left/right so it never clips) */}
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onOpenPayments}
          aria-label={
            english ? 'Open payments' : 'Buka halaman pembayaran'
          }
          className={`absolute top-1/2 -translate-y-1/2 z-10 min-h-[34px] max-w-[175px] px-3 py-1.5 rounded-[16px] shadow-[0_10px_24px_rgba(0,0,0,0.14)] dark:shadow-[0_10px_24px_rgba(0,0,0,0.5)] border flex items-center cursor-pointer active:scale-95 transition-transform ${
            isOnRightSide
              ? 'right-full mr-2 rounded-br-[5px]'
              : 'left-full ml-2 rounded-bl-[5px]'
          } ${
            isAngry
              ? 'bg-[#FFF5F5] dark:bg-[#2A1518] border-[#E31E24]/45'
              : isExcited
              ? 'bg-[#F2FBF6] dark:bg-[#14241C] border-[#168A62]/35'
              : 'bg-white/95 dark:bg-[#24252C]/95 backdrop-blur-md border-[#EEEEF0] dark:border-[#34353C]'
          }`}
        >
          <span
            className={`text-[11px] font-extrabold tracking-tight whitespace-nowrap ${
              isAngry
                ? 'text-[#B5121B] dark:text-[#FF8A80]'
                : isExcited
                ? 'text-[#168A62]'
                : 'text-[#171717] dark:text-[#F4F4F5]'
            }`}
          >
            {typedText}
          </span>
          <span
            aria-hidden="true"
            className={`inline-block w-[2px] h-[12px] ml-0.5 rounded-full animate-pulse shrink-0 ${
              isExcited ? 'bg-[#168A62]' : 'bg-[#E31E24]'
            }`}
          />
        </button>

        {/* Transparent Floating Robot (no circle backdrop behind mascot) */}
        <div
          className="w-[74px] h-[74px] flex items-center justify-center drop-shadow-[0_10px_18px_rgba(0,0,0,0.18)]"
          title={
            english
              ? 'Tap to pay · Drag mascot anywhere'
              : 'Ketuk untuk bayar · Geser ke mana saja'
          }
        >
          <KasMateActivityRobot
            mood={mood}
            activity={currentActivity}
            sizeClassName="w-[74px] h-[74px]"
          />
        </div>
      </div>
    </div>
  );
};

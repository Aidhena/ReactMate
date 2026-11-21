import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { MascotMood } from '../types';
import {
  KasMateActivityRobot,
  RobotActivity,
} from './KasMateActivityRobot';

interface MascotBannerProps {
  mood: MascotMood;
  message: string;
  assistantLabel?: string;
  english?: boolean;
}

const ACTIVITIES_BY_MOOD: Record<MascotMood, RobotActivity[]> = {
  [MascotMood.ANGRY]: ['scolding', 'clock_warning'],
  [MascotMood.SAD]: ['worried_note', 'clock_warning'],
  [MascotMood.EXCITED]: ['coin_toss', 'cheering'],
  [MascotMood.HAPPY]: ['saving_coin', 'checklist', 'waving'],
  [MascotMood.NEUTRAL]: ['writing_notes', 'calculating', 'coin_bounce', 'waving'],
};

function activityCaption(
  activity: RobotActivity,
  english: boolean
): string {
  switch (activity) {
    case 'scolding':
      return english ? 'Overdue alert' : 'Peringatan nunggak';
    case 'clock_warning':
      return english ? 'Checking overdue days' : 'Cek hari keterlambatan';
    case 'worried_note':
      return english ? 'Reviewing due bill' : 'Cek tagihan terlewat';
    case 'coin_toss':
      return english ? 'Tossing lucky coins' : 'Lempar koin sukses';
    case 'cheering':
      return english ? 'Celebrating payment' : 'Merayakan transaksi';
    case 'saving_coin':
      return english ? 'Saving class coins' : 'Menabung koin kas';
    case 'checklist':
      return english ? 'Checking paid list' : 'Cek daftar lunas';
    case 'waving':
      return english ? 'Cheering you on' : 'Menyemangati kelas';
    case 'writing_notes':
      return english ? 'Updating cash notes' : 'Mencatat buku kas';
    case 'calculating':
      return english ? 'Calculating balance' : 'Menghitung saldo';
    case 'coin_bounce':
      return english ? 'Playing with coin' : 'Main koin kas';
  }
}

export const KasMateMascotBanner: React.FC<MascotBannerProps> = ({
  mood,
  message,
  assistantLabel = 'KasMate AI',
  english = true,
}) => {
  const pool = ACTIVITIES_BY_MOOD[mood] ?? ACTIVITIES_BY_MOOD[MascotMood.NEUTRAL];
  const [activityIdx, setActivityIdx] = useState(0);

  useEffect(() => {
    setActivityIdx(0);
  }, [mood]);

  useEffect(() => {
    if (pool.length <= 1) return;
    const timer = window.setInterval(() => {
      setActivityIdx((prev) => (prev + 1) % pool.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [pool]);

  const currentActivity = pool[activityIdx % pool.length];
  const isAngry = mood === MascotMood.ANGRY;
  const isExcited = mood === MascotMood.EXCITED;

  return (
    <div
      onClick={() => setActivityIdx((prev) => (prev + 1) % pool.length)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setActivityIdx((prev) => (prev + 1) % pool.length);
        }
      }}
      title={english ? 'Tap mascot to switch activity' : 'Ketuk maskot untuk ganti aktivitas'}
      className={`w-full rounded-[26px] px-3.5 py-3 flex items-center gap-3.5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition-all duration-300 cursor-pointer select-none ${
        isAngry
          ? 'bg-[#FFF5F5] dark:bg-[#271518] border border-[#E31E24]/35'
          : isExcited
          ? 'bg-[#F3FBF7] dark:bg-[#13231C] border border-[#168A62]/30'
          : 'bg-white dark:bg-[#191A20] border border-[#EEEEF0]/80 dark:border-[#34353C]/80'
      }`}
    >
      <div
        className={`w-[80px] h-[80px] shrink-0 rounded-full flex items-center justify-center overflow-visible ${
          isAngry
            ? 'bg-[#E31E24]/14 dark:bg-[#E31E24]/24'
            : isExcited
            ? 'bg-[#168A62]/14 dark:bg-[#168A62]/22'
            : 'bg-[#E31E24]/8 dark:bg-[#E31E24]/15'
        }`}
      >
        <KasMateActivityRobot
          mood={mood}
          activity={currentActivity}
          sizeClassName="w-[74px] h-[74px]"
        />
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`text-[11px] font-extrabold tracking-wide ${
              isExcited ? 'text-[#168A62]' : 'text-[#E31E24]'
            }`}
          >
            {assistantLabel}
          </span>
          <Sparkles
            className={`w-3.5 h-3.5 ${
              isExcited ? 'text-[#168A62]' : 'text-[#E31E24]'
            }`}
          />
          <span className="text-[11px] text-[#858585] dark:text-[#B3B3BA] font-medium">
            · {activityCaption(currentActivity, english)}
          </span>
        </div>
        <p className="text-[13px] leading-[18px] font-medium text-[#171717] dark:text-[#F4F4F5]">
          {message}
        </p>
      </div>
    </div>
  );
};

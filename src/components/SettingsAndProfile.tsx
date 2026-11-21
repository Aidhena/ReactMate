import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  ChevronRight,
  Download,
  Globe,
  LogOut,
  MessageSquare,
  Moon,
  Share,
  Sparkles,
  Sun,
  User,
} from 'lucide-react';
import { AppLanguage } from '../types';
import { rupiah } from '../data/kasData';
import { ModalPortal } from './ModalPortal';
import { usePWAInstall } from '../hooks/usePWAInstall';
import type { PushCapabilityStatus } from '../services/pushNotifications';

interface SettingsPageProps {
  darkMode: boolean;
  onDarkModeChange: (dark: boolean) => void;
  language: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
  english: boolean;
  onOpenProfile: () => void;
  onLogout: () => void;
  pushStatus: PushCapabilityStatus;
  funFactIntervalMinutes: number;
  onFunFactIntervalChange: (minutes: number) => void;
  onEnablePush: () => void;
  onTestFunFactPush: () => void;
  onTestBillPush: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  darkMode,
  onDarkModeChange,
  language,
  onLanguageChange,
  english,
  onOpenProfile,
  onLogout,
  pushStatus,
  funFactIntervalMinutes,
  onFunFactIntervalChange,
  onEnablePush,
  onTestFunFactPush,
  onTestBillPush,
}) => {
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showIOSInstallGuide, setShowIOSInstallGuide] = useState(false);
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  return (
    <div className="w-full max-w-2xl flex flex-col gap-4 pb-6 pt-2">
      <div>
        <h1 className="text-[28px] font-extrabold text-[#171717] dark:text-[#F4F4F5]">
          {english ? 'Settings' : 'Pengaturan'}
        </h1>
        <p className="text-sm text-[#858585] dark:text-[#B3B3BA]">
          {english
            ? 'Personalize your KasMate experience'
            : 'Atur pengalaman KasMate sesuai gayamu'}
        </p>
      </div>

      {/* Appearance */}
      <div className="rounded-[24px] bg-white dark:bg-[#191A20] border border-[#EEEEF0] dark:border-[#34353C] p-4 shadow-[0_1px_6px_rgba(0,0,0,0.03)] flex flex-col gap-3.5">
        <span className="text-[#E31E24] text-[11px] font-extrabold tracking-[1.3px]">
          {english ? 'APPEARANCE' : 'TAMPILAN'}
        </span>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {darkMode ? (
              <Moon className="w-5 h-5 text-[#E31E24]" />
            ) : (
              <Sun className="w-5 h-5 text-[#E31E24]" />
            )}
            <div>
              <p className="font-bold text-sm text-[#171717] dark:text-[#F4F4F5]">
                {english ? 'Dark mode' : 'Mode gelap'}
              </p>
              <p className="text-xs text-[#858585] dark:text-[#B3B3BA]">
                {darkMode
                  ? english
                    ? 'On'
                    : 'Aktif'
                  : english
                  ? 'Off'
                  : 'Nonaktif'}
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={darkMode}
            aria-label={english ? 'Toggle dark mode' : 'Ubah mode gelap'}
            onClick={() => onDarkModeChange(!darkMode)}
            className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${
              darkMode ? 'bg-[#E31E24]' : 'bg-gray-300 dark:bg-gray-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                darkMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Language */}
      <div className="relative rounded-[24px] bg-white dark:bg-[#191A20] border border-[#EEEEF0] dark:border-[#34353C] p-4 shadow-[0_1px_6px_rgba(0,0,0,0.03)] flex flex-col gap-3.5">
        <span className="text-[#E31E24] text-[11px] font-extrabold tracking-[1.3px]">
          {english ? 'LANGUAGE' : 'BAHASA'}
        </span>
        <button
          type="button"
          onClick={() => setLangMenuOpen((v) => !v)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-[#E31E24]" />
            <div>
              <p className="font-bold text-sm text-[#171717] dark:text-[#F4F4F5]">
                {english ? 'App language' : 'Bahasa aplikasi'}
              </p>
              <p className="text-xs text-[#858585] dark:text-[#B3B3BA]">
                {language === AppLanguage.ENGLISH
                  ? 'English'
                  : 'Bahasa Indonesia'}
              </p>
            </div>
          </div>
          <ChevronDown className="w-5 h-5 text-[#858585]" />
        </button>

        {langMenuOpen && (
          <div className="rounded-2xl border border-[#EEEEF0] dark:border-[#34353C] bg-[#F7F8FA] dark:bg-[#24252C] overflow-hidden flex flex-col">
            <button
              type="button"
              onClick={() => {
                onLanguageChange(AppLanguage.INDONESIAN);
                setLangMenuOpen(false);
              }}
              className={`px-4 py-3 text-left text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer ${
                language === AppLanguage.INDONESIAN
                  ? 'text-[#E31E24] font-bold'
                  : 'text-[#171717] dark:text-[#F4F4F5]'
              }`}
            >
              Bahasa Indonesia
            </button>
            <button
              type="button"
              onClick={() => {
                onLanguageChange(AppLanguage.ENGLISH);
                setLangMenuOpen(false);
              }}
              className={`px-4 py-3 text-left text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer ${
                language === AppLanguage.ENGLISH
                  ? 'text-[#E31E24] font-bold'
                  : 'text-[#171717] dark:text-[#F4F4F5]'
              }`}
            >
              English
            </button>
          </div>
        )}
      </div>

      {/* Real Device Push Notifications & PWA Install */}
      <div className="rounded-[24px] bg-white dark:bg-[#191A20] border border-[#EEEEF0] dark:border-[#34353C] p-4 shadow-[0_1px_6px_rgba(0,0,0,0.03)] flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[#E31E24] text-[11px] font-extrabold tracking-[1.3px]">
            {english ? 'PHONE PUSH NOTIFICATIONS' : 'NOTIFIKASI HP'}
          </span>
          <span
            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
              pushStatus.permission === 'granted'
                ? 'bg-[#168A62]/12 text-[#168A62]'
                : pushStatus.permission === 'denied'
                ? 'bg-[#E31E24]/12 text-[#E31E24]'
                : 'bg-gray-200/80 dark:bg-gray-700/60 text-[#55555C] dark:text-[#C8C8D0]'
            }`}
          >
            {pushStatus.permission === 'granted'
              ? pushStatus.subscribed
                ? english
                  ? 'Push Active'
                  : 'Notifikasi Aktif'
                : english
                ? 'OS Enabled'
                : 'Izin Aktif'
              : pushStatus.permission === 'denied'
              ? english
                ? 'Blocked'
                : 'Diblokir'
              : english
              ? 'Not Enabled'
              : 'Belum Aktif'}
          </span>
        </div>

        {pushStatus.isIOSNeedsInstall && (
          <div className="rounded-2xl bg-[#E31E24]/[0.06] border border-[#E31E24]/25 p-3 text-xs text-[#171717] dark:text-[#F4F4F5] flex items-center justify-between gap-2">
            <span>
              {english
                ? 'On iPhone/iPad, install KasMate to Home Screen to receive background push notifications.'
                : 'Di iPhone/iPad, tambahkan KasMate ke Layar Utama agar notifikasi tetap masuk meski aplikasi ditutup.'}
            </span>
            <button
              type="button"
              onClick={() => setShowIOSInstallGuide(true)}
              className="px-3 py-1.5 rounded-xl kas-gradient text-white text-[11px] font-bold shrink-0 cursor-pointer"
            >
              {english ? 'How to' : 'Cara'}
            </button>
          </div>
        )}

        {pushStatus.permission !== 'granted' ||
        (pushStatus.nativePush && !pushStatus.subscribed) ? (
          <button
            type="button"
            onClick={onEnablePush}
            className="w-full h-11 rounded-[16px] kas-gradient text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_6px_16px_rgba(227,30,36,0.22)] hover:brightness-105 active:scale-[0.97] ios-spring transition-all cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span>
              {english
                ? 'Enable Phone Push Notifications'
                : 'Aktifkan Notifikasi HP'}
            </span>
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Periodic Fun Fact Frequency */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-[#171717] dark:text-[#F4F4F5]">
                {english
                  ? 'Fun Fact Push Schedule'
                  : 'Jadwal Berkala Fakta Unik'}
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { mins: 5, label: english ? '5 min' : '5 mnt' },
                  { mins: 15, label: english ? '15 min' : '15 mnt' },
                  { mins: 60, label: english ? '1 hr' : '1 jam' },
                  { mins: 1440, label: english ? 'Daily' : 'Harian' },
                ].map((opt) => (
                  <button
                    key={opt.mins}
                    type="button"
                    onClick={() => onFunFactIntervalChange(opt.mins)}
                    className={`h-8 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
                      funFactIntervalMinutes === opt.mins
                        ? 'bg-[#E31E24] border-[#E31E24] text-white'
                        : 'bg-[#F7F8FA] dark:bg-[#24252C] border-[#EEEEF0] dark:border-[#34353C] text-[#171717] dark:text-[#F4F4F5]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onTestBillPush}
                className="h-10 rounded-xl border border-[#EEEEF0] dark:border-[#34353C] bg-[#F7F8FA] dark:bg-[#24252C] hover:border-[#E31E24]/50 text-xs font-bold text-[#171717] dark:text-[#F4F4F5] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5 text-[#E31E24]" />
                <span>
                  {english ? 'Send bill reminder push' : 'Kirim pengingat tagihan'}
                </span>
              </button>
              <button
                type="button"
                onClick={onTestFunFactPush}
                className="h-10 rounded-xl border border-[#EEEEF0] dark:border-[#34353C] bg-[#F7F8FA] dark:bg-[#24252C] hover:border-[#E31E24]/50 text-xs font-bold text-[#171717] dark:text-[#F4F4F5] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#E31E24]" />
                <span>
                  {english ? 'Send Fun Fact push' : 'Kirim notifikasi fakta unik'}
                </span>
              </button>
            </div>
          </div>
        )}

        {!isInstalled && (isInstallable || isIOS) && (
          <button
            type="button"
            onClick={() => {
              if (isInstallable) {
                void install();
              } else {
                setShowIOSInstallGuide(true);
              }
            }}
            className="w-full pt-2 border-t border-[#EEEEF0] dark:border-[#34353C] flex items-center justify-between text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-[#E31E24]" />
              <div>
                <p className="font-bold text-sm text-[#171717] dark:text-[#F4F4F5]">
                  {english ? 'Install KasMate on Phone' : 'Pasang KasMate di HP'}
                </p>
                <p className="text-xs text-[#858585] dark:text-[#B3B3BA]">
                  {english
                    ? 'Required on iOS for background notifications'
                    : 'Agar notifikasi tetap masuk saat aplikasi ditutup'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#858585]" />
          </button>
        )}
      </div>

      {showIOSInstallGuide && (
        <ModalPortal>
          <div className="w-full max-w-sm rounded-[26px] bg-white dark:bg-[#191A20] border border-[#EEEEF0] dark:border-[#34353C] p-6 shadow-2xl flex flex-col gap-3 animate-bubble-pop">
            <div className="flex items-center gap-2 text-[#E31E24]">
              <Share className="w-5 h-5" />
              <h3 className="text-base font-extrabold text-[#171717] dark:text-[#F4F4F5]">
                {english ? 'Install on iPhone / iPad' : 'Pasang di iPhone / iPad'}
              </h3>
            </div>
            <p className="text-xs text-[#55555C] dark:text-[#C8C8D0] leading-relaxed">
              {english ? (
                <>
                  1. Tap the <strong>Share</strong> button in Safari.
                  <br />
                  2. Scroll down and choose <strong>Add to Home Screen</strong>.
                  <br />
                  3. Open KasMate from your Home Screen and enable notifications.
                </>
              ) : (
                <>
                  1. Ketuk tombol <strong>Bagikan</strong> di peramban Safari.
                  <br />
                  2. Gulir ke bawah dan pilih{' '}
                  <strong>Tambahkan ke Layar Utama</strong>.
                  <br />
                  3. Buka KasMate dari Layar Utama lalu aktifkan notifikasi.
                </>
              )}
            </p>
            <button
              type="button"
              onClick={() => setShowIOSInstallGuide(false)}
              className="mt-1 w-full h-10 rounded-xl kas-gradient text-white text-xs font-bold cursor-pointer"
            >
              {english ? 'Got it' : 'Mengerti'}
            </button>
          </div>
        </ModalPortal>
      )}

      {/* Account */}
      <div className="rounded-[24px] bg-white dark:bg-[#191A20] border border-[#EEEEF0] dark:border-[#34353C] p-4 shadow-[0_1px_6px_rgba(0,0,0,0.03)] flex flex-col gap-3.5">
        <span className="text-[#E31E24] text-[11px] font-extrabold tracking-[1.3px]">
          {english ? 'ACCOUNT' : 'AKUN'}
        </span>
        <button
          type="button"
          onClick={onOpenProfile}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-[#E31E24]" />
            <div>
              <p className="font-bold text-sm text-[#171717] dark:text-[#F4F4F5]">
                {english ? 'Profile' : 'Profil'}
              </p>
              <p className="text-xs text-[#858585] dark:text-[#B3B3BA]">
                {english
                  ? 'Manage your personal information'
                  : 'Kelola informasi pribadimu'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#858585]" />
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="w-full min-h-11 flex items-center gap-3 rounded-xl border border-[#E31E24]/20 px-3 text-left text-[#E31E24] hover:bg-[#E31E24]/[0.06] cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-bold text-sm">
            {english ? 'Sign out' : 'Keluar'}
          </span>
        </button>
      </div>

      {/* Help & Support */}
      <div className="rounded-[24px] bg-white dark:bg-[#191A20] border border-[#EEEEF0] dark:border-[#34353C] p-4 shadow-[0_1px_6px_rgba(0,0,0,0.03)] flex flex-col gap-3.5">
        <span className="text-[#E31E24] text-[11px] font-extrabold tracking-[1.3px]">
          {english ? 'HELP & SUPPORT' : 'BANTUAN & DUKUNGAN'}
        </span>
        <button
          type="button"
          onClick={() => setSupportOpen(true)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-[#E31E24]" />
            <div>
              <p className="font-bold text-sm text-[#171717] dark:text-[#F4F4F5]">
                {english
                  ? 'Suggestions and support'
                  : 'Kotak saran & dukungan'}
              </p>
              <p className="text-xs text-[#858585] dark:text-[#B3B3BA]">
                {english
                  ? 'Tell us what can be improved'
                  : 'Kirim masukan atau laporkan kendala'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#858585]" />
        </button>
      </div>

      {supportOpen && (
        <ModalPortal>
          <div className="w-full max-w-md rounded-[26px] bg-white dark:bg-[#191A20] border border-[#EEEEF0] dark:border-[#34353C] p-6 shadow-2xl flex flex-col gap-4 animate-bubble-pop">
            <h3 className="text-lg font-bold text-[#171717] dark:text-[#F4F4F5]">
              {english ? 'Suggestions & support' : 'Saran & dukungan'}
            </h3>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={
                english
                  ? 'Write your suggestion or issue'
                  : 'Tulis saran atau kendala yang kamu alami'
              }
              className="w-full rounded-2xl border border-[#EEEEF0] dark:border-[#34353C] bg-[#F7F8FA] dark:bg-[#24252C] p-3 text-sm text-[#171717] dark:text-[#F4F4F5] focus:outline-none focus:ring-2 focus:ring-[#E31E24]"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSupportOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-[#858585] cursor-pointer"
              >
                {english ? 'Cancel' : 'Batal'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSupportOpen(false);
                  setFeedback('');
                }}
                className="px-4 py-2 rounded-xl text-sm font-bold text-[#E31E24] hover:bg-[#E31E24]/10 cursor-pointer"
              >
                {english ? 'Done' : 'Selesai'}
              </button>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

interface ProfilePageProps {
  english: boolean;
  userName: string;
  imageUri: string | null;
  className: string;
  academicYear: string;
  nis: string;
  savingsBalance: number;
  onChangeImage: (dataUrl: string) => void;
  onBack: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  english,
  userName,
  imageUri,
  className,
  academicYear,
  nis,
  savingsBalance,
  onChangeImage,
  onBack,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const displayName = userName.trim() || (english ? 'Student' : 'Siswa');
  const displayClass = className.trim()
    ? `${className.trim()}${academicYear.trim() ? ` · ${academicYear.trim()}` : ''}`
    : english
    ? 'No class assigned'
    : 'Belum ada kelas';

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChangeImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full max-w-2xl flex flex-col items-center gap-4 pb-6 pt-2">
      <div className="w-full flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          aria-label={english ? 'Back to settings' : 'Kembali ke pengaturan'}
          className="min-w-[44px] min-h-[44px] -ml-2 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-[#171717] dark:text-[#F4F4F5] cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[28px] font-extrabold text-[#171717] dark:text-[#F4F4F5]">
          {english ? 'My profile' : 'Profil saya'}
        </h1>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="mt-4 w-28 h-28 rounded-full bg-[#E31E24] text-white flex items-center justify-center overflow-hidden shadow-md hover:opacity-95 transition-opacity cursor-pointer"
      >
        {imageUri ? (
          <img
            src={imageUri}
            alt={english ? 'Profile photo' : 'Foto profil'}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-[40px] font-extrabold">
            {displayName.slice(0, 1).toUpperCase()}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="text-xs font-medium text-[#E31E24] hover:underline cursor-pointer"
      >
        {english ? 'Tap photo to change' : 'Ketuk foto untuk mengganti'}
      </button>

      <div className="text-center">
        <p className="text-[21px] font-bold text-[#171717] dark:text-[#F4F4F5]">
          {displayName}
        </p>
        <p className="text-sm text-[#858585] dark:text-[#B3B3BA]">
          {english
            ? `Student · ${displayClass}`
            : `Siswa · ${displayClass}`}
        </p>
      </div>

      <div className="w-full rounded-[24px] bg-white dark:bg-[#191A20] border border-[#EEEEF0] dark:border-[#34353C] p-4 shadow-[0_1px_6px_rgba(0,0,0,0.03)] flex flex-col gap-3.5 mt-2">
        <span className="text-[#E31E24] text-[11px] font-extrabold tracking-[1.3px]">
          {english ? 'PERSONAL INFORMATION' : 'INFORMASI PRIBADI'}
        </span>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#858585] dark:text-[#B3B3BA]">
            {english ? 'Full name' : 'Nama lengkap'}
          </span>
          <span className="font-semibold text-[#171717] dark:text-[#F4F4F5]">
            {displayName}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#858585] dark:text-[#B3B3BA]">NIS</span>
          <span className="font-semibold text-[#171717] dark:text-[#F4F4F5]">
            {nis || (english ? 'Not set' : 'Belum diatur')}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#858585] dark:text-[#B3B3BA]">
            {english ? 'Role' : 'Peran'}
          </span>
          <span className="font-semibold text-[#171717] dark:text-[#F4F4F5]">
            {english ? 'Student' : 'Siswa'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#858585] dark:text-[#B3B3BA]">
            {english ? 'Class' : 'Kelas'}
          </span>
          <span className="font-semibold text-[#171717] dark:text-[#F4F4F5]">
            {displayClass}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#858585] dark:text-[#B3B3BA]">
            {english ? 'Savings balance' : 'Saldo titipan'}
          </span>
          <span className="font-semibold text-[#171717] dark:text-[#F4F4F5]">
            {rupiah(savingsBalance)}
          </span>
        </div>
      </div>
    </div>
  );
};

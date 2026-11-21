import React, { useEffect, useRef, useState } from 'react';
import { Calendar as CalendarIcon, Send } from 'lucide-react';
import { KasSummary } from '../types';
import { localAssistantAnswer } from '../data/kasData';

interface AssistantTabProps {
  summary: KasSummary;
  userName: string;
  english: boolean;
  onOpenCalendar: () => void;
}

interface ChatMessage {
  id: string;
  fromUser: boolean;
  text: string;
}

export const AssistantTab: React.FC<AssistantTabProps> = ({
  summary,
  userName,
  english,
  onOpenCalendar,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      fromUser: false,
      text: english
        ? `Hi ${userName}! I can help check bills, class balance, and expense records using your class data.`
        : `Halo ${userName}! Aku bisa bantu cek tagihan, saldo kelas, dan catatan pengeluaran dari data kas kelasmu.`,
    },
  ]);
  const [input, setInput] = useState('');
  const listEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === 'welcome'
          ? {
              ...m,
              text: english
                ? `Hi ${userName}! I can help check bills, class balance, and expense records using your class data.`
                : `Halo ${userName}! Aku bisa bantu cek tagihan, saldo kelas, dan catatan pengeluaran dari data kas kelasmu.`,
            }
          : m
      )
    );
  }, [english, userName]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const ask = (question: string) => {
    const q = question.trim();
    if (!q) return;
    const reply = localAssistantAnswer(q, summary, english);
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, fromUser: true, text: q },
      { id: `a-${Date.now() + 1}`, fromUser: false, text: reply },
    ]);
    setInput('');
  };

  const quickPrompts = english
    ? ['My bill?', 'Class balance?', 'Recent expense?', 'Fun fact']
    : ['Tagihanku?', 'Saldo kelas?', 'Pengeluaran terbaru?', 'Fakta unik'];

  return (
    <div className="w-full h-[calc(100dvh-116px-env(safe-area-inset-bottom,0px))] min-h-[440px] flex flex-col gap-2.5 pb-0.5">
      <div className="pt-2 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[25px] font-extrabold text-[#171717] dark:text-[#F4F4F5]">
            {english ? 'KasMate assistant' : 'Asisten KasMate'}
          </h1>
          <p className="text-xs text-[#858585] dark:text-[#B3B3BA]">
            {english
              ? 'A private guide to class finances'
              : 'Teman untuk memahami uang kas kelas'}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenCalendar}
          aria-label={english ? 'Open calendar' : 'Buka kalender'}
          className="w-11 h-11 rounded-[15px] kas-gradient text-white shadow-[0_6px_16px_rgba(227,30,36,0.26)] hover:brightness-105 active:scale-90 ios-spring transition-all flex items-center justify-center shrink-0 cursor-pointer"
        >
          <CalendarIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 shrink-0">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => ask(prompt)}
            className="px-3.5 py-2 rounded-xl border border-[#EEEEF0] dark:border-[#34353C] bg-white dark:bg-[#191A20] text-[11px] font-semibold text-[#171717] dark:text-[#F4F4F5] hover:border-[#E31E24] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full ${
              msg.fromUser ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[320px] sm:max-w-[440px] rounded-[18px] p-3.5 text-[13px] leading-relaxed ${
                msg.fromUser
                  ? 'bg-[#E31E24] text-white'
                  : 'bg-white dark:bg-[#191A20] border border-[#EEEEF0] dark:border-[#34353C] text-[#171717] dark:text-[#F4F4F5]'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={listEndRef} />
      </div>

      {/* Chat Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex items-center gap-2 pt-1 shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            english ? 'Ask about class funds' : 'Tanya tentang uang kas'
          }
          aria-label={
            english ? 'Ask about class funds' : 'Tanya tentang uang kas'
          }
          className="flex-1 h-13 px-4 rounded-[18px] border border-[#EEEEF0] dark:border-[#34353C] bg-white dark:bg-[#191A20] text-sm text-[#171717] dark:text-[#F4F4F5] placeholder:text-[#858585] focus:outline-none focus:ring-2 focus:ring-[#E31E24]"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          aria-label={english ? 'Send message' : 'Kirim pesan'}
          className="w-[52px] h-[52px] rounded-full bg-[#E31E24] disabled:opacity-45 text-white flex items-center justify-center hover:bg-[#B5121B] transition-colors shrink-0 cursor-pointer disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

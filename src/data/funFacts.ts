export interface FunFactEntry {
  id: string;
  idText: string;
  enText: string;
}

export const FUN_FACTS: FunFactEntry[] = [
  {
    id: 'ff-01',
    enText:
      'Small, consistent Rp 5,000 weekly dues from 35 students build over Rp 600,000 in just one month!',
    idText:
      'Iuran rutin Rp 5.000 per minggu dari 35 siswa bisa terkumpul lebih dari Rp 600.000 hanya dalam sebulan!',
  },
  {
    id: 'ff-02',
    enText:
      'Keeping digital receipts for every class marker or photocopy stops end-of-term confusion completely.',
    idText:
      'Menyimpan kuitansi digital untuk setiap spidol atau fotokopi bikin laporan kas akhir semester bebas bingung.',
  },
  {
    id: 'ff-03',
    enText:
      'Students who set a weekly payday reminder are 3x less likely to fall behind on class dues.',
    idText:
      'Siswa yang mengaktifkan pengingat mingguan 3x lebih jarang menunggak uang kas kelas.',
  },
  {
    id: 'ff-04',
    enText:
      'A transparent class ledger boosts on-time contributions because everyone sees where funds go.',
    idText:
      'Catatan kas kelas yang transparan bikin teman sekelas lebih semangat bayar tepat waktu karena tahu alokasi dananya.',
  },
  {
    id: 'ff-05',
    enText:
      'Skipping just one iced drink a month easily covers an entire week of class cash dues!',
    idText:
      'Menghemat satu minuman kekinian saja sudah cukup untuk membayar uang kas satu minggu penuh!',
  },
  {
    id: 'ff-06',
    enText:
      'The 50/30/20 rule helps students split pocket money cleanly between needs, wants, and savings.',
    idText:
      'Aturan 50/30/20 bisa dipakai pelajar untuk membagi uang saku ke kebutuhan sekolah, hiburan, dan tabungan.',
  },
  {
    id: 'ff-07',
    enText:
      'Paying small bills early removes mental clutter — overdue dues feel heavier than they actually are.',
    idText:
      'Membayar tagihan kecil lebih awal bikin pikiran lebih tenang — tunggakan kecil terasa berat hanya kalau ditunda.',
  },
  {
    id: 'ff-08',
    enText:
      'Digital cash records save treasurers up to 4 hours a month compared to hunting down paper notebooks.',
    idText:
      'Pencatatan kas digital menghemat waktu bendahara hingga 4 jam per bulan dibanding mencari buku catatan kertas.',
  },
  {
    id: 'ff-09',
    enText:
      'Classes with an emergency reserve fund can organize class events twice as fast without sudden extra fees.',
    idText:
      'Kelas yang punya dana cadangan kas bisa menyiapkan acara pekan olahraga kelas 2x lebih cepat tanpa iuran dadakan.',
  },
  {
    id: 'ff-10',
    enText:
      'Checking class cash flow once a week builds lifelong personal budgeting instincts early on.',
    idText:
      'Mengecek arus kas kelas seminggu sekali melatih kebiasaan mengatur keuangan pribadi sejak sekolah.',
  },
  {
    id: 'ff-11',
    enText:
      'Setting aside coins or spare change every Friday adds a surprising bonus to your semester savings.',
    idText:
      'Menyisihkan uang kembalian setiap hari Jumat ternyata bisa jadi tambahan tabungan yang lumayan di akhir semester.',
  },
  {
    id: 'ff-12',
    enText:
      'Shared class goals like study tours or farewell banners are 70% easier when funded bit by bit.',
    idText:
      'Target kelas seperti karya wisata atau spanduk acara 70% lebih ringan kalau dicicil rutin lewat uang kas.',
  },
  {
    id: 'ff-13',
    enText:
      'Rounding up daily expenses and saving the difference is one of the simplest zero-stress money habits.',
    idText:
      'Membulatkan sisa uang jajan harian ke tabungan adalah cara paling mudah menabung tanpa terasa berat.',
  },
  {
    id: 'ff-14',
    enText:
      'A clear payment proof attachment resolves treasury questions in seconds instead of days.',
    idText:
      'Melampirkan bukti transfer langsung saat bayar membuat konfirmasi bendahara selesai dalam hitungan detik.',
  },
  {
    id: 'ff-15',
    enText:
      'Comparing weekly vs monthly spending trends reveals small leaks like forgotten printouts or snacks.',
    idText:
      'Melihat grafik mingguan vs bulanan membantu mendeteksi pengeluaran kecil yang sering tidak terasa.',
  },
  {
    id: 'ff-16',
    enText:
      'Rewarding yourself with non-cash perks after a full month of on-time dues keeps motivation high.',
    idText:
      'Memberi apresiasi kecil ke diri sendiri setelah sebulan penuh bayar tepat waktu menjaga kebiasaan baik tetap konsisten.',
  },
  {
    id: 'ff-17',
    enText:
      'Saving even Rp 2,000 daily adds up to over Rp 730,000 in a single school year!',
    idText:
      'Tahukah kamu? Menabung Rp 2.000 per hari saja hasilnya lebih dari Rp 730.000 dalam satu tahun ajaran!',
  },
  {
    id: 'ff-18',
    enText:
      'Good money habits aren’t about earning big — they start with tracking every small rupiah cleanly.',
    idText:
      'Mengatur uang dengan baik bukan soal jumlah besarnya, tapi kebiasaan mencatat setiap rupiah secara rapi.',
  },
];

export function pickNextFunFact(
  english: boolean,
  seenIds: string[] = [],
  lastShownId?: string
): { fact: { id: string; text: string }; nextSeenIds: string[] } {
  const seenSet = new Set(seenIds);
  let candidates = FUN_FACTS.filter((item) => !seenSet.has(item.id));
  let resetSeen = false;

  if (candidates.length === 0) {
    resetSeen = true;
    candidates = FUN_FACTS.filter((item) => item.id !== lastShownId);
    if (candidates.length === 0) candidates = [...FUN_FACTS];
  }

  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  const nextSeenIds = resetSeen ? [chosen.id] : [...seenIds, chosen.id];

  return {
    fact: {
      id: chosen.id,
      text: english ? chosen.enText : chosen.idText,
    },
    nextSeenIds,
  };
}

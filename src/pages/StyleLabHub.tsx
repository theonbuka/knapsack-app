import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';

const STYLES = [
  {
    slug: 'editorial',
    title: 'Editorial Ledger',
    subtitle: 'Sakin, guven veren, metin odakli',
    summary: 'Kagit dokusu hissi veren serif tipografi ve net icerik hiyerarsisi.',
    accent: 'from-amber-300 to-orange-400',
  },
  {
    slug: 'brutal',
    title: 'Neo Brutalist Grid',
    subtitle: 'Cesur, hizli, vurucu',
    summary: 'Yuksek kontrast, kalin cerceveler ve net aksiyon odakli modern bir dil.',
    accent: 'from-cyan-300 to-lime-300',
  },
  {
    slug: 'aurora',
    title: 'Aurora Finance',
    subtitle: 'Premium, atmosferik, modern',
    summary: 'Katmanli renk gecisleri, yumusak cam etkisi ve urun hikayesi odagi.',
    accent: 'from-emerald-300 to-sky-300',
  },
];

export default function StyleLabHub() {
  usePageMeta('Style Lab', 'Payonar icin farkli arayuz stillerini karsilastirin.');
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <main className="mx-auto w-full max-w-6xl px-6 py-14 sm:px-10">
        <p className="text-[11px] font-black uppercase tracking-[0.35em] text-slate-500">Payonar Style Lab</p>
        <h1 className="mt-4 text-4xl font-black tracking-[-0.03em] sm:text-6xl">3 farkli arayuz dili</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
          Asagidaki uc sayfa ayni urun icin farkli marka hissi sunar. Hosuna giden tarzi sec, mevcut Landing
          yapisini ona gore guncelleyeyim.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {STYLES.map(style => (
            <article key={style.slug} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
              <div className={`h-2 w-full rounded-full bg-gradient-to-r ${style.accent}`} />
              <p className="mt-5 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">{style.subtitle}</p>
              <h2 className="mt-3 text-2xl font-black tracking-[-0.02em]">{style.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{style.summary}</p>

              <Link
                to={`/style-lab/${style.slug}`}
                className="mt-6 inline-flex items-center rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black uppercase tracking-[0.2em] text-white transition hover:bg-slate-700"
              >
                Ac
              </Link>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}

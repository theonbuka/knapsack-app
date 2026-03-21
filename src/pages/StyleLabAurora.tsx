import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';

const stats = [
  { name: 'Toplam Varlik', value: '1.24M TL', note: '+8.2% aylik' },
  { name: 'Likidite', value: '342K TL', note: 'Hazir nakit + mevduat' },
  { name: 'Gider Basinci', value: '28%', note: 'Guvenli aralikta' },
];

export default function StyleLabAurora() {
  usePageMeta('Style Lab Aurora', 'Aurora Finance arayuz dili ornek sayfasi.');
  return (
    <div
      className="relative min-h-screen overflow-hidden bg-[#e9f5f2] text-slate-900"
      style={{ fontFamily: '"Avenir Next", "Segoe UI", "Trebuchet MS", sans-serif' }}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 left-[-6%] h-80 w-80 rounded-full bg-emerald-300/60 blur-3xl" />
        <div className="absolute right-[-8%] top-28 h-96 w-96 rounded-full bg-sky-300/60 blur-3xl" />
        <div className="absolute bottom-[-12%] left-1/3 h-72 w-72 rounded-full bg-cyan-200/70 blur-3xl" />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-6 py-12 sm:px-10">
        <header className="rounded-3xl border border-white/50 bg-white/70 p-7 shadow-[0_24px_80px_rgba(11,37,45,0.14)] backdrop-blur-xl sm:p-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-emerald-700">Aurora Finance</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] sm:text-6xl">Modern bir premium panel dili</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-700 sm:text-base">
            Yumusak gecisler ve cam kart yapisi sayesinde urun hem ileri seviye hem de sakin bir deneyim sunar.
            Premium algisi guclu, kullanimi rahattir.
          </p>
        </header>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          {stats.map(stat => (
            <article key={stat.name} className="rounded-2xl border border-white/60 bg-white/75 p-5 shadow-[0_16px_46px_rgba(12,40,56,0.1)] backdrop-blur-lg">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">{stat.name}</p>
              <p className="mt-2 text-3xl font-semibold tracking-[-0.02em]">{stat.value}</p>
              <p className="mt-1 text-sm text-slate-600">{stat.note}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-3xl border border-white/60 bg-white/75 p-6 shadow-[0_20px_60px_rgba(12,40,56,0.12)] backdrop-blur-lg">
            <h2 className="text-2xl font-semibold tracking-[-0.02em]">Neden secilir?</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Bu stil, kurumsal guven ile modern urun hissini birlikte verir. Uzun kullanimda goz yormaz, onboarding
              ekranlarinda da premium bir ilk izlenim saglar.
            </p>
          </article>
          <article className="rounded-3xl border border-white/60 bg-white/75 p-6 shadow-[0_20px_60px_rgba(12,40,56,0.12)] backdrop-blur-lg">
            <h2 className="text-2xl font-semibold tracking-[-0.02em]">Ton etiketi</h2>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-emerald-800">Premium</span>
              <span className="rounded-full bg-sky-100 px-3 py-1.5 text-sky-800">Sakin</span>
              <span className="rounded-full bg-cyan-100 px-3 py-1.5 text-cyan-800">Modern</span>
            </div>
          </article>
        </section>

        <div className="mt-10">
          <Link to="/style-lab" className="inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black uppercase tracking-[0.2em] text-white transition hover:bg-slate-700">
            Style Lab'a don
          </Link>
        </div>
      </main>
    </div>
  );
}

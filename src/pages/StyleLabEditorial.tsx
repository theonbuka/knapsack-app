import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';

const cards = [
  { label: 'Bu Ay Gelir', value: '+42.800 TL' },
  { label: 'Bu Ay Gider', value: '-18.650 TL' },
  { label: 'Net Akis', value: '+24.150 TL' },
];

export default function StyleLabEditorial() {
  usePageMeta('Style Lab Editorial', 'Editorial Ledger arayuz dili ornek sayfasi.');
  return (
    <div className="min-h-screen bg-[#f6f0e6] text-[#2f271f]" style={{ fontFamily: '"Iowan Old Style", "Palatino Linotype", Palatino, serif' }}>
      <main className="mx-auto w-full max-w-5xl px-6 py-12 sm:px-10">
        <header className="border-b border-[#d6c6ad] pb-8">
          <p className="text-[11px] uppercase tracking-[0.35em] text-[#8a755a]">Editorial Ledger</p>
          <h1 className="mt-4 text-5xl font-bold leading-[1.05] tracking-[-0.02em] sm:text-7xl">Paranin hikayesi tek bakista.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#5f4f3f]">
            Kullanicinin dikkatini metne ve sayisal ozete tasiyan sade bir stil. Finans urunu yerine guvenilir bir
            danisman yayini hissi verir.
          </p>
        </header>

        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          {cards.map(card => (
            <article key={card.label} className="rounded-2xl border border-[#d6c6ad] bg-[#fdf8ef] p-5">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#8a755a]">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-[-0.02em]">{card.value}</p>
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-3xl border border-[#d6c6ad] bg-[#fdf8ef] p-6 sm:p-8">
          <h2 className="text-3xl font-semibold tracking-[-0.02em]">Kimler icin uygun?</h2>
          <p className="mt-3 text-base leading-8 text-[#5f4f3f]">
            Daha olgun, premium ve yazinsal bir marka dili isteyen urunler icin. KOBI ve profesyonel segmentte guven
            algisini guclendirir.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="rounded-full border border-[#c6b296] px-4 py-1.5 text-xs uppercase tracking-[0.22em] text-[#7b654a]">Yuksek guven</span>
            <span className="rounded-full border border-[#c6b296] px-4 py-1.5 text-xs uppercase tracking-[0.22em] text-[#7b654a]">Sakin ton</span>
            <span className="rounded-full border border-[#c6b296] px-4 py-1.5 text-xs uppercase tracking-[0.22em] text-[#7b654a]">Icerik odagi</span>
          </div>
        </section>

        <div className="mt-10">
          <Link to="/style-lab" className="text-sm font-semibold uppercase tracking-[0.22em] text-[#6a553f] hover:text-[#3f3225]">
            Style Lab'a don
          </Link>
        </div>
      </main>
    </div>
  );
}

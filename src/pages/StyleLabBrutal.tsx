import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';

const blocks = [
  { title: 'CASH NOW', value: '154.200', color: 'bg-yellow-300' },
  { title: 'OUTFLOW', value: '62.410', color: 'bg-pink-300' },
  { title: 'SAVING', value: '91.790', color: 'bg-cyan-300' },
];

export default function StyleLabBrutal() {
  usePageMeta('Style Lab Brutal', 'Neo Brutalist Grid arayuz dili ornek sayfasi.');
  return (
    <div className="min-h-screen bg-[#f4f4f0] text-black" style={{ fontFamily: '"Arial Black", "Franklin Gothic Heavy", sans-serif' }}>
      <main className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-10">
        <header className="border-[4px] border-black bg-white p-6 shadow-[10px_10px_0_#000] sm:p-8">
          <p className="text-[11px] uppercase tracking-[0.28em]">NEO BRUTALIST GRID</p>
          <h1 className="mt-4 text-4xl uppercase leading-[0.95] sm:text-7xl">Control
            <br />
            Every
            <br />
            Lira
          </h1>
          <p className="mt-4 max-w-xl text-sm font-semibold uppercase tracking-[0.08em] sm:text-base">
            Sert kontrast, kalin stroke ve eylem odakli performans dili.
          </p>
        </header>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          {blocks.map(block => (
            <article key={block.title} className={`${block.color} border-[4px] border-black p-5 shadow-[8px_8px_0_#000]`}>
              <p className="text-xs uppercase tracking-[0.22em]">{block.title}</p>
              <p className="mt-3 text-5xl leading-none">{block.value}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em]">TL</p>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="border-[4px] border-black bg-white p-6 shadow-[8px_8px_0_#000]">
            <h2 className="text-2xl uppercase">Bu tarz ne verir?</h2>
            <ul className="mt-4 space-y-2 text-sm uppercase tracking-[0.08em]">
              <li>Yuksek enerji</li>
              <li>Net eylem odagi</li>
              <li>Genclik ve startup hissi</li>
            </ul>
          </div>
          <div className="border-[4px] border-black bg-lime-200 p-6 shadow-[8px_8px_0_#000]">
            <h2 className="text-2xl uppercase">Risk notu</h2>
            <p className="mt-4 text-sm uppercase tracking-[0.08em]">
              Uzun sureli kullanimda herkes icin rahat olmayabilir. Marka dili cesursa cok iyi calisir.
            </p>
          </div>
        </section>

        <div className="mt-10">
          <Link to="/style-lab" className="inline-flex border-[3px] border-black bg-white px-4 py-2 text-xs uppercase tracking-[0.22em] shadow-[5px_5px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0_#000]">
            Style Lab'a don
          </Link>
        </div>
      </main>
    </div>
  );
}

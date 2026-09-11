import { Footer, Header } from "@/components/Header";

const team = [
  { name: "Мадина Раҳимова", role: "Асосгузор" },
  { name: "Адила Герилло", role: "Ҳунарманд" },
  { name: "Зарина Холова", role: "Дӯзанда" },
  { name: "Ҷамшед Неъматов", role: "Чӯбкор" },
];

export default function AboutPage() {
  return (
    <div className="page-bg">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="card-shell p-8">
          <h1 className="text-3xl font-semibold">Миссия ва дастаи мо</h1>
          <p className="mt-4 max-w-2xl text-gray-700">
            Мо кӯшиш мекунем, ки ҳунармандони тоҷикро бо харидорон ва сайёҳон мустақиман пайваст кунем.
            Hunarmand хариди мустақим, фармоиши инфиродӣ, харитаи устохонаҳо ва ёрирасони фарҳангиро муттаҳид мекунад.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {team.map((p) => (
              <div key={p.name} className="rounded-xl bg-cream p-4 text-center">
                <div className="mx-auto h-16 w-16 rounded-full bg-navy" />
                <div className="mt-2 font-medium">{p.name}</div>
                <div className="text-sm text-gray-500">{p.role}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

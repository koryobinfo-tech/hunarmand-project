import Link from "next/link";
import { Header } from "@/components/Header";

export default function SuccessPage() {
  return (
    <div className="page-bg">
      <Header />
      <main className="mx-auto max-w-lg px-4 py-20">
        <div className="card-shell p-10 text-center">
          <h1 className="text-2xl font-semibold">Фармоиш тасдиқ шуд</h1>
          <p className="mt-3 text-gray-600">Пардохти шумо қабул гардид. Таърихи харидро дар профил пайгирӣ кунед.</p>
          <Link href="/profile/orders" className="btn-teal mt-6 inline-block px-6 py-3">
            Харидҳои ман
          </Link>
        </div>
      </main>
    </div>
  );
}

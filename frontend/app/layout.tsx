import type { Metadata } from "next";
import { AiWidget } from "@/components/AiWidget";
import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hunarmand — маркетплейси ҳунарҳои мардумӣ",
  description: "Хариди мустақим, фармоиши махсус, харитаи устохонаҳо ва ёрирасони фарҳангӣ.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tg" className="h-full antialiased">
      <body className="min-h-full">
        <AuthProvider>
          {children}
          <AiWidget />
        </AuthProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getMessages, setRequestLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SelectionToolbar } from "@/components/SelectionToolbar";
import { TermsNoticeDialog } from "@/components/TermsNoticeDialog";
import { Toaster } from "sonner";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OmniStream — Universal Social Media Downloader (Instagram & LinkedIn)",
  description:
    "Fast, private, and free tool to download public Instagram and LinkedIn photos, videos, carousels, and document slides. Convert to PDF or bundle into a single ZIP archive.",
  keywords: [
    "omnistream",
    "instagram downloader",
    "linkedin downloader",
    "linkedin carousel to pdf",
    "instagram reel download",
    "social media downloader",
  ],
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a0a] text-neutral-100 min-h-screen flex flex-col selection:bg-[#d4af37]/30 selection:text-[#fef08a]`}
      >
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Header />
          <main className="flex-1">{children}</main>
          <SelectionToolbar />
          <TermsNoticeDialog />
          <Footer />
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#121214",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#f4f4f5",
              },
            }}
          />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

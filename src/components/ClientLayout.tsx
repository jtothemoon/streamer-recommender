'use client';

import PageWrapper from "@/components/PageWrapper";
import BetaBanner from "@/components/BetaBanner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BetaBanner />
      <Header />
      <PageWrapper>
        <main className="flex-1">{children}</main>
      </PageWrapper>
      <Footer />
    </>
  );
}

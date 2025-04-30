'use client';

import PageWrapper from "@/components/PageWrapper";
import BetaBanner from "@/components/BetaBanner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50">
        <BetaBanner />
        <Header />
      </div>
      <PageWrapper>
        <main className="flex-1">{children}</main>
      </PageWrapper>
      <Footer />
    </>
  );
}
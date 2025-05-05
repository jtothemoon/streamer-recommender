'use client';

import PageWrapper from "@/components/layout/PageWrapper";
import BetaBanner from "@/components/layout/BetaBanner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

import FloatingButtons from "@/components/ui/FloatingButtons";

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
      <FloatingButtons />
      <Footer />
    </>
  );
}
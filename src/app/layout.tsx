import PageWrapper from "@/components/PageWrapper"; // 추가
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Spick - 게임 스트리머 추천 서비스",
  description:
    "Spick은 키워드 기반으로 나에게 딱 맞는 게임 스트리머를 추천해주는 서비스입니다. 무료로 사용해보세요!",
  openGraph: {
    title: "Spick - 게임 스트리머 추천 서비스",
    description:
      "Spick은 키워드 기반으로 나에게 딱 맞는 게임 스트리머를 추천해주는 서비스입니다.",
    url: "https://spick.app",
    siteName: "Spick",
    images: [
      {
        url: "https://spick.app/og-image.png", // 오픈그래프 대표 이미지 (추후 준비)
        width: 1200,
        height: 630,
        alt: "Spick 대표 이미지",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Spick - 게임 스트리머 추천 서비스",
    description: "키워드 기반으로 나에게 딱 맞는 게임 스트리머를 추천!",
    images: ["https://spick.app/og-image.png"],
  },
  metadataBase: new URL("https://spick.app"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable.css"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="flex flex-col min-h-screen font-sans text-[#111111] dark:text-gray-200 bg-white dark:bg-[#111111]">
        <Header />
        <PageWrapper>
          <main className="flex-1">{children}</main>
        </PageWrapper>
        <Footer />
      </body>
    </html>
  );
}

// src/app/about/page.tsx
import Link from "next/link";

export default function AboutPage() {
  return (
    <section className="max-w-2xl mx-auto p-8 text-center">
      <h1 className="text-3xl font-bold mb-4">About Spick</h1>
      <p className="text-gray-600 mb-2">
        Spick은 다양한 게임 스트리머를 추천해주는 웹 서비스입니다.
      </p>
      <p className="text-gray-600 mb-8">
        투명하고 신뢰할 수 있는 정보를 바탕으로, 새로운 스트리머를 쉽게 발견할 수 있도록 돕습니다.
      </p>
      <Link
        href="/"
        className="inline-block px-6 py-3 bg-[#00C7AE] text-white rounded-full hover:bg-[#5EEAD4] transition-colors"
      >
        홈으로 돌아가기
      </Link>
    </section>
  );
}

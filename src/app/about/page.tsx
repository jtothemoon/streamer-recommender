// src/app/about/page.tsx
import Link from "next/link";

export default function AboutPage() {
  return (
    <section className="max-w-2xl mx-auto p-8 text-center">
      <h1 className="text-4xl font-bold mb-8 text-[#00C7AE]">🎮 Spick 소개</h1>

      {/* 서비스 소개 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">서비스 소개</h2>
        <p className="text-gray-600 mb-2">
          Spick은 다양한 게임 스트리머를 쉽고 빠르게 추천받을 수 있는 웹 서비스입니다.
        </p>
        <p className="text-gray-600">
          키워드, 게임 장르, 플랫폼을 기준으로 당신에게 딱 맞는 스트리머를 찾아드립니다.
        </p>
      </section>

      {/* 개발자 소개 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">개발자 소개</h2>
        <p className="text-gray-600 mb-2">
          안녕하세요! 저는 1인 개발자 <span className="font-bold">Jtothemoon</span>입니다.
        </p>
        <p className="text-gray-600">
          게임과 스트리머 문화를 사랑하며, 더 좋은 추천 경험을 만들기 위해 Spick을 개발하고 있습니다.
        </p>
      </section>

      {/* 문의하기 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">문의하기</h2>
        <p className="text-gray-600">
          ✉️ 이메일: <span className="underline text-[#00C7AE]">jtothemoon1987@gmail.com</span>
        </p>
      </section>

      {/* 홈으로 돌아가기 */}
      <div className="mt-8">
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-gray-300 text-gray-800 rounded-full hover:bg-gray-400 transition-colors font-bold"
        >
          🏠 홈으로 돌아가기
        </Link>
      </div>
    </section>
  );
}

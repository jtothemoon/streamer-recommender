import Link from "next/link";
import { 
  HomeIcon, 
  EnvelopeIcon, 
  ArrowRightIcon, 
  ClockIcon,
  CursorArrowRaysIcon,
  PlayIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Spick - 게임 스트리머 추천 서비스 소개 | 당신에게 맞는 스트리머 찾기",
  description: "Spick은 게임 취향에 맞는 유튜브, 트위치 등의 스트리머를 쉽고 빠르게 추천해주는 플랫폼입니다. 다양한 게임 장르와 키워드로 나에게 맞는 스트리머를 발견해보세요.",
};

export default function AboutPage() {
  const features = [
    {
      icon: <CursorArrowRaysIcon className="w-8 h-8 text-[#00C7AE] mb-2" />,
      title: "게임 키워드 기반 추천",
      description: "롤, 배그, 피파 등 다양한 게임 키워드를 기반으로 스트리머를 추천해드립니다."
    },
    {
      icon: <PlayIcon className="w-8 h-8 text-[#00C7AE] mb-2" />,
      title: "유튜브 스트리머 지원",
      description: "현재 YouTube 스트리머를 지원하며, 곧 트위치와 SOOP 스트리머도 만나보실 수 있습니다."
    },
    {
      icon: <ClockIcon className="w-8 h-8 text-[#00C7AE] mb-2" />,
      title: "실시간 업데이트",
      description: "최신 업로드 정보와 활동을 바탕으로 가장 활발한 스트리머를 추천해드립니다."
    }
  ];

  const platforms = [
    { icon: <PlayIcon className="w-8 h-8 text-[#FF0000]" />, name: "YouTube", color: "text-[#FF0000]", status: "제공 중" },
    { icon: <WrenchScrewdriverIcon className="w-8 h-8 text-[#6441a5]" />, name: "Twitch", color: "text-[#9146FF]", status: "준비 중" },
    { icon: <EnvelopeIcon className="w-8 h-8 text-[#0545b1]" />, name: "SOOP", color: "text-[#1269FF]", status: "API 요청 중" }
  ];

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* 헤더 섹션 */}
      <div className="text-center mb-16">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
          <span className="text-[#00C7AE]">Spick</span> 소개
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          당신의 취향에 맞는 게임 스트리머를 쉽고 빠르게 발견하세요
        </p>
      </div>

      {/* 서비스 소개 카드 */}
      <section className="mb-16 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <HomeIcon className="w-6 h-6 mr-2 text-[#00C7AE]" /> 서비스 소개
        </h2>
        
        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
            Spick은 게임 방송을 시청하는 시청자들에게 새로운 스트리머를 발견하는 즐거움을 드리고자 시작된 프로젝트입니다.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            시청자분들이 좋아하는 게임과 키워드를 바탕으로 맞춤형 스트리머를 추천해드립니다. 지루한 검색 없이도 당신의 취향에 딱 맞는 스트리머를 Spick에서 만나보세요.
          </p>
        </div>

        {/* 특징 */}
        <div className="grid md:grid-cols-3 gap-8 mt-8">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              {feature.icon}
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 지원 플랫폼 */}
      <section className="mb-16 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">지원 플랫폼</h2>
        <div className="flex flex-wrap justify-center gap-8">
          {platforms.map((platform, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className={`${platform.color} mb-2`}>{platform.icon}</div>
              <span className="font-medium">{platform.name}</span>
              <span className="text-sm mt-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                {platform.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 로드맵 */}
      <section className="mb-16 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">앞으로의 계획</h2>
        <ul className="space-y-4">
          {[
            "즐겨찾기 기능 추가",
            "스트리머 평점 시스템 도입",
            "다중 키워드 매칭 추천 알고리즘 고도화",
            "플랫폼/성별/구독자 수 기반 필터링 기능",
            "더 많은 게임 장르 지원"
          ].map((item, index) => (
            <li key={index} className="flex items-center text-gray-700 dark:text-gray-300">
              <ArrowRightIcon className="w-5 h-5 text-[#00C7AE] flex-shrink-0 mr-2" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 개발자 소개 */}
      <section className="mb-16 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">개발자 소개</h2>
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="w-24 h-24 bg-gradient-to-r from-[#00C7AE] to-[#5f8de3] rounded-full flex items-center justify-center text-white text-2xl font-bold">
            J
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Jtothemoon</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              안녕하세요! 저는 게임과 스트리머 문화를 사랑하는 개발자입니다. 게임 좋아하는 분들에게 더 나은 스트리머 추천 경험을 제공하고자 Spick을 개발하게 되었습니다.
            </p>
            <div className="flex items-center">
              <EnvelopeIcon className="w-5 h-5 text-[#00C7AE] mr-2" />
              <a href="mailto:jtothemoon1987@gmail.com" className="text-[#00C7AE] hover:underline">
                jtothemoon1987@gmail.com
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 홈으로 돌아가기 */}
      <div className="text-center">
        <Link
          href="/"
          className="inline-block px-8 py-3 bg-[#00C7AE] text-white rounded-full hover:bg-[#00b09b] transition-colors font-bold shadow-md"
        >
          🏠 홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
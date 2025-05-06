import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
      <h1 className="text-4xl font-bold mb-4 text-[var(--foreground-strong)]">
        404
      </h1>
      <h2 className="text-2xl font-semibold mb-6 text-[var(--foreground)]">
        페이지를 찾을 수 없습니다
      </h2>
      <p className="text-[var(--foreground-soft)] mb-8 max-w-md">
        요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
      </p>
      <Link 
        href="/" 
        className="px-6 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-md transition-colors"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
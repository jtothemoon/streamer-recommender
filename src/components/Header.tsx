import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full p-4 border-b flex justify-between items-center">
      <Link href="/" className="text-2xl font-bold hover:text-[#00C7AE] transition-colors">
        Spick
      </Link>
      <nav className="flex gap-4 text-sm">
        <Link href="/about" className="hover:text-[#00C7AE] transition-colors">
          About
        </Link>
      </nav>
    </header>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bars3Icon } from "@heroicons/react/24/solid";

interface MobileMenuProps {
  links: Array<{
    href: string;
    label: string;
    hasBadge?: boolean;
  }>;
}

export default function MobileMenu({ links }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="md:hidden relative" ref={menuRef}>
      <button 
        className="text-[var(--foreground)]"
        onClick={toggleMenu}
        aria-label="메뉴 열기"
      >
        <Bars3Icon className="w-6 h-6" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[var(--background-soft)] rounded-md shadow-lg py-1 z-50 border border-[var(--border-color)]">
          {links.map((link, index) => (
            <Link
              key={index}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 hover:bg-[var(--background-soft-hover)] transition-colors"
            >
              {link.label}
              {link.hasBadge && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                  N
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
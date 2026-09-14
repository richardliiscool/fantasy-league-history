"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  matcher: (pathname: string) => boolean;
};

const navItems: NavItem[] = [
  {
    href: "/managers",
    label: "Managers",
    matcher: (pathname) => pathname === "/managers" || pathname.startsWith("/managers/"),
  },
  {
    href: "/records",
    label: "Records",
    matcher: (pathname) => pathname === "/records",
  },
  {
    href: "/seasons",
    label: "Seasons",
    matcher: (pathname) =>
      pathname === "/seasons" || pathname.startsWith("/seasons/"),
  },
  {
    href: "/data-sources",
    label: "Data",
    matcher: (pathname) => pathname === "/data-sources",
  },
  {
    href: "/head-to-head",
    label: "Head-to-Head",
    matcher: (pathname) => pathname === "/head-to-head",
  },
  {
    href: "/head-to-head/matrix",
    label: "Matrix",
    matcher: (pathname) => pathname === "/head-to-head/matrix",
  },
];

export function AppNavigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-[#d9dee4] bg-white text-[#17191f]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <Link
          href="/"
          className="text-sm font-semibold uppercase tracking-normal text-[#2f6f50] underline-offset-4 hover:underline"
        >
          League Vault
        </Link>
        <div className="flex gap-1 overflow-x-auto pb-1 lg:pb-0">
          {navItems.map((item) => {
            const isActive = item.matcher(pathname);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`shrink-0 rounded-md border px-3 py-2 text-sm font-semibold underline-offset-4 transition hover:border-[#2f6f50] hover:text-[#2f6f50] hover:underline ${
                  isActive
                    ? "border-[#2f6f50] bg-[#eef5f1] text-[#2f6f50]"
                    : "border-transparent text-[#58606a]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

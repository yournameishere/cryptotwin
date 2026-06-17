"use client";

import clsx from "clsx";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

const navItems = [
  { href: "/discover", label: "Discover" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/timeline", label: "Timeline" },
  { href: "/strategy", label: "Strategy" },
  { href: "/methodology", label: "Method" }
];

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="nav-wrap">
        <nav className="nav-pill" aria-label="Primary navigation">
          <Link className="wordmark" href="/" onClick={() => setOpen(false)}>
            CryptoTwin
          </Link>
          <div className="nav-links">
            {navItems.map((item) => (
              <Link
                key={item.href}
                className={clsx("nav-link", pathname === item.href && "is-active")}
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <Link className="nav-action" href="/discover">
            Analyze
          </Link>
          <button
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="nav-menu"
            type="button"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X aria-hidden size={18} /> : <Menu aria-hidden size={18} />}
          </button>
        </nav>
        <div className={clsx("mobile-sheet", open && "is-open")}>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
        </div>
      </header>
      {children}
      <footer className="foot-line">
        <span>CryptoTwin AI</span>
        <Link href="/methodology">Method</Link>
        <Link href="/discover">Analyze</Link>
        <Link href="/risk">Risk</Link>
        <Link href="/privacy">Privacy</Link>
        <span>Research signal only. Not financial advice.</span>
      </footer>
    </>
  );
}

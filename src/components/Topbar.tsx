"use client";

import { useRouter } from "next/navigation";

export function Topbar({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-hairline bg-paper/95 backdrop-blur px-6 md:px-10 py-4">
      <div>
        <p className="text-[11px] tracking-[0.18em] uppercase text-ink-soft">
          SwasthyaGrid Intake
        </p>
        <h1 className="font-serif-display text-xl text-ink">{title}</h1>
        {subtitle && <p className="text-xs text-ink-soft mt-0.5">{subtitle}</p>}
      </div>
      <button
        onClick={logout}
        className="text-xs uppercase tracking-wider text-ink-soft hover:text-accent-clay border border-hairline px-3 py-1.5"
      >
        Sign out
      </button>
    </header>
  );
}

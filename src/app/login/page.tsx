"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed.");
        return;
      }
      router.push(data.role === "admin" ? "/admin" : "/dashboard");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-paper flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <p className="text-[11px] tracking-[0.2em] uppercase text-ink-soft mb-2">
            SwasthyaGrid Intake
          </p>
          <h1 className="font-serif-display italic text-3xl text-ink">
            The data behind the district&apos;s eyes
          </h1>
          <p className="text-sm text-ink-soft mt-3 max-w-xs mx-auto">
            Facility staff and district administrators sign in here to keep
            SwasthyaGrid&apos;s district console current.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="border border-hairline bg-paper-dim/40 p-8 space-y-5"
        >
          <div>
            <label className="block text-[11px] tracking-[0.12em] uppercase text-ink-soft mb-2">
              Facility / Admin ID
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="phc-rural-14"
              className="w-full border border-hairline bg-paper px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-accent-clay"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] tracking-[0.12em] uppercase text-ink-soft mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-hairline bg-paper px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-accent-clay"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-risk-critical border-l-2 border-risk-critical pl-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-clay text-paper text-sm font-medium py-2.5 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-xs text-ink-soft text-center mt-6">
          Part of the{" "}
          <a
            href="https://swasthyagrid.vercel.app"
            className="text-accent-clay hover:underline"
          >
            SwasthyaGrid AI
          </a>{" "}
          district operations platform.
        </p>
      </div>
    </main>
  );
}

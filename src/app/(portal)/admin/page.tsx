"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/Topbar";

interface Row {
  id: string;
  name: string;
  type: string;
  criticalMedicines: number;
  bedOccupancyPct: number | null;
  lastUpdated: string | null;
}

function isStale(lastUpdated: string | null) {
  if (!lastUpdated) return true;
  return Date.now() - new Date(lastUpdated).getTime() > 24 * 60 * 60 * 1000;
}

export default function AdminPage() {
  const [roster, setRoster] = useState<Row[] | null>(null);

  useEffect(() => {
    fetch("/api/admin/overview")
      .then((r) => r.json())
      .then((d) => setRoster(d.roster));
  }, []);

  return (
    <main className="min-h-screen bg-paper">
      <Topbar title="District Roster" subtitle="Read-only cross-facility view" />

      <div className="max-w-4xl mx-auto px-6 md:px-10 py-10">
        <p className="text-sm text-ink-soft mb-6 max-w-xl">
          A facility not reporting in the last 24 hours is itself a risk signal —
          highlighted below. For the full operations console (map, forecasts,
          recommendations), see{" "}
          <a
            href="https://swasthyagrid.vercel.app"
            className="text-accent-clay hover:underline"
          >
            SwasthyaGrid AI →
          </a>
        </p>

        {!roster ? (
          <p className="text-sm text-ink-soft">Loading…</p>
        ) : (
          <div className="border border-hairline">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline bg-paper-dim/60">
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-ink-soft">
                    Facility
                  </th>
                  <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-ink-soft">
                    Critical Meds
                  </th>
                  <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-ink-soft">
                    Bed Occ.
                  </th>
                  <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-ink-soft">
                    Last Report
                  </th>
                </tr>
              </thead>
              <tbody>
                {roster.map((r) => {
                  const stale = isStale(r.lastUpdated);
                  return (
                    <tr key={r.id} className="border-b border-hairline last:border-0">
                      <td className="px-4 py-3">
                        <span className="text-ink font-medium">{r.name}</span>
                        <span className="text-ink-soft text-xs ml-2">{r.type}</span>
                      </td>
                      <td
                        className="px-4 py-3 text-right tabular"
                        style={{
                          color: r.criticalMedicines > 0 ? "var(--color-risk-critical)" : "var(--color-ink-soft)",
                        }}
                      >
                        {r.criticalMedicines}
                      </td>
                      <td className="px-4 py-3 text-right tabular text-ink-soft">
                        {r.bedOccupancyPct != null ? `${r.bedOccupancyPct}%` : "—"}
                      </td>
                      <td
                        className="px-4 py-3 text-right text-xs"
                        style={{ color: stale ? "var(--color-risk-monitor)" : "var(--color-ink-soft)" }}
                      >
                        {r.lastUpdated
                          ? new Date(r.lastUpdated).toLocaleString()
                          : "Never reported"}
                        {stale && " · stale"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

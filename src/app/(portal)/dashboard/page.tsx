"use client";

import { useEffect, useState, useCallback } from "react";
import { Topbar } from "@/components/Topbar";

interface Medicine {
  id: string;
  medicine_name: string;
  units_remaining: number;
  avg_daily_consumption: number;
  reorder_threshold_days: number;
}

interface Doctor {
  id: string;
  doctor_name: string;
  specialty: string;
  present: boolean;
  absence_reason: string | null;
}

interface FacilityBundle {
  facility: { id: string; name: string; type: string; beds_total: number } | null;
  medicines: Medicine[];
  beds: { occupied: number } | null;
  doctors: Doctor[];
  footfall: {
    children?: number;
    women?: number;
    elderly?: number;
    emergency?: number;
    general?: number;
  } | null;
}

function daysRemaining(m: Medicine) {
  return m.avg_daily_consumption > 0
    ? +(m.units_remaining / m.avg_daily_consumption).toFixed(1)
    : Infinity;
}

function riskColor(days: number) {
  if (days < 3) return "var(--color-risk-critical)";
  if (days < 6) return "var(--color-risk-monitor)";
  return "var(--color-risk-healthy)";
}

function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 bg-ink text-paper text-sm px-4 py-2.5 shadow-lg z-50">
      {message}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<FacilityBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [newMed, setNewMed] = useState({ name: "", units: "", consumption: "" });
  const [footfallDraft, setFootfallDraft] = useState({
    children: "0",
    women: "0",
    elderly: "0",
    emergency: "0",
    general: "0",
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/facility");
    const bundle = (await res.json()) as FacilityBundle;
    setData(bundle);
    if (bundle.footfall) {
      setFootfallDraft({
        children: String(bundle.footfall.children ?? 0),
        women: String(bundle.footfall.women ?? 0),
        elderly: String(bundle.footfall.elderly ?? 0),
        emergency: String(bundle.footfall.emergency ?? 0),
        general: String(bundle.footfall.general ?? 0),
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }

  async function saveMedicine(m: Medicine) {
    await fetch(`/api/medicines/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        units_remaining: m.units_remaining,
        avg_daily_consumption: m.avg_daily_consumption,
      }),
    });
    flash(`Synced ${m.medicine_name} to the district grid ✓`);
  }

  async function addMedicine() {
    if (!newMed.name || !newMed.units || !newMed.consumption) return;
    const res = await fetch("/api/medicines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        medicine_name: newMed.name,
        units_remaining: Number(newMed.units),
        avg_daily_consumption: Number(newMed.consumption),
      }),
    });
    if (res.ok) {
      setNewMed({ name: "", units: "", consumption: "" });
      flash("Medicine added ✓");
      load();
    }
  }

  async function saveBeds(occupied: number) {
    await fetch("/api/beds", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ occupied }),
    });
    flash("Bed status synced ✓");
  }

  async function toggleDoctor(doc: Doctor) {
    const present = !doc.present;
    await fetch(`/api/doctors/${doc.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        present,
        absence_reason: present ? null : "unauthorized",
      }),
    });
    flash(`${doc.doctor_name} marked ${present ? "present" : "absent"} ✓`);
    load();
  }

  async function saveFootfall() {
    const body = {
      children: Number(footfallDraft.children) || 0,
      women: Number(footfallDraft.women) || 0,
      elderly: Number(footfallDraft.elderly) || 0,
      emergency: Number(footfallDraft.emergency) || 0,
      general: Number(footfallDraft.general) || 0,
    };
    await fetch("/api/footfall", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    flash("Today's footfall synced ✓");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-paper">
        <Topbar title="Loading…" />
      </main>
    );
  }

  if (!data?.facility) {
    return (
      <main className="min-h-screen bg-paper">
        <Topbar title="Facility not found" />
        <p className="px-10 py-8 text-sm text-ink-soft">
          This account has no facility record yet. Run the seed script or contact the
          district administrator.
        </p>
      </main>
    );
  }

  const { facility, medicines, beds, doctors } = data;
  const occupied = beds?.occupied ?? 0;
  const occupancyPct = Math.round((occupied / facility.beds_total) * 100);

  return (
    <main className="min-h-screen bg-paper pb-20">
      <Topbar title={facility.name} subtitle={`${facility.type} · Facility Data Portal`} />

      <div className="max-w-3xl mx-auto px-6 md:px-10 py-10 space-y-12">
        {/* Medicine Inventory */}
        <section>
          <p className="text-[11px] tracking-[0.16em] uppercase text-ink-soft mb-4">
            Medicine Inventory
          </p>
          <div className="space-y-3">
            {medicines.map((m) => {
              const days = daysRemaining(m);
              return (
                <div
                  key={m.id}
                  className="border border-hairline bg-paper-dim/40 p-4 grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{m.medicine_name}</p>
                    <p
                      className="text-xs mt-1 tabular"
                      style={{ color: riskColor(days) }}
                    >
                      {Number.isFinite(days) ? `${days} days remaining` : "—"}
                    </p>
                  </div>
                  <div className="w-28">
                    <label className="block text-[9px] uppercase text-ink-soft mb-1">
                      Units
                    </label>
                    <input
                      type="number"
                      value={m.units_remaining}
                      onChange={(e) =>
                        setData({
                          ...data,
                          medicines: medicines.map((x) =>
                            x.id === m.id
                              ? { ...x, units_remaining: Number(e.target.value) }
                              : x
                          ),
                        })
                      }
                      className="w-full border border-hairline bg-paper px-2 py-1.5 text-sm tabular"
                    />
                  </div>
                  <div className="w-28">
                    <label className="block text-[9px] uppercase text-ink-soft mb-1">
                      Daily use
                    </label>
                    <input
                      type="number"
                      value={m.avg_daily_consumption}
                      onChange={(e) =>
                        setData({
                          ...data,
                          medicines: medicines.map((x) =>
                            x.id === m.id
                              ? { ...x, avg_daily_consumption: Number(e.target.value) }
                              : x
                          ),
                        })
                      }
                      className="w-full border border-hairline bg-paper px-2 py-1.5 text-sm tabular"
                    />
                  </div>
                  <button
                    onClick={() => saveMedicine(m)}
                    className="bg-accent-clay text-paper text-xs font-medium px-4 py-2 h-fit"
                  >
                    Save
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-4 border border-dashed border-hairline p-4 grid grid-cols-[1fr_auto_auto_auto] gap-4 items-end">
            <div>
              <label className="block text-[9px] uppercase text-ink-soft mb-1">
                New medicine name
              </label>
              <input
                value={newMed.name}
                onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                placeholder="e.g. Amoxicillin"
                className="w-full border border-hairline bg-paper px-2 py-1.5 text-sm"
              />
            </div>
            <div className="w-28">
              <label className="block text-[9px] uppercase text-ink-soft mb-1">Units</label>
              <input
                type="number"
                value={newMed.units}
                onChange={(e) => setNewMed({ ...newMed, units: e.target.value })}
                className="w-full border border-hairline bg-paper px-2 py-1.5 text-sm"
              />
            </div>
            <div className="w-28">
              <label className="block text-[9px] uppercase text-ink-soft mb-1">
                Daily use
              </label>
              <input
                type="number"
                value={newMed.consumption}
                onChange={(e) => setNewMed({ ...newMed, consumption: e.target.value })}
                className="w-full border border-hairline bg-paper px-2 py-1.5 text-sm"
              />
            </div>
            <button
              onClick={addMedicine}
              className="border border-accent-brass text-accent-brass text-xs font-medium px-4 py-2 h-fit"
            >
              Add
            </button>
          </div>
        </section>

        {/* Bed Status */}
        <section>
          <p className="text-[11px] tracking-[0.16em] uppercase text-ink-soft mb-4">
            Bed Status
          </p>
          <div className="border border-hairline bg-paper-dim/40 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-ink-soft">
                {occupied} / {facility.beds_total} beds occupied
              </span>
              <span className="font-serif-display text-2xl tabular" style={{ color: riskColor(occupancyPct > 90 ? 1 : 10) }}>
                {occupancyPct}%
              </span>
            </div>
            <div className="h-2 bg-hairline w-full">
              <div
                className="h-2"
                style={{
                  width: `${Math.min(occupancyPct, 100)}%`,
                  background: riskColor(occupancyPct > 90 ? 1 : 10),
                }}
              />
            </div>
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() =>
                  setData({ ...data, beds: { occupied: Math.max(0, occupied - 1) } })
                }
                className="border border-hairline w-8 h-8 text-sm"
              >
                −
              </button>
              <button
                onClick={() =>
                  setData({
                    ...data,
                    beds: { occupied: Math.min(facility.beds_total, occupied + 1) },
                  })
                }
                className="border border-hairline w-8 h-8 text-sm"
              >
                +
              </button>
              <button
                onClick={() => saveBeds(occupied)}
                className="bg-accent-clay text-paper text-xs font-medium px-4 py-2 ml-auto"
              >
                Save
              </button>
            </div>
          </div>
        </section>

        {/* Doctor Attendance */}
        <section>
          <p className="text-[11px] tracking-[0.16em] uppercase text-ink-soft mb-4">
            Doctor Attendance — Today
          </p>
          {doctors.length === 0 ? (
            <p className="text-sm text-ink-soft italic">
              No doctors registered for this facility yet.
            </p>
          ) : (
            <div className="space-y-2">
              {doctors.map((doc) => (
                <div
                  key={doc.id}
                  className="border border-hairline bg-paper-dim/40 p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{doc.doctor_name}</p>
                    <p className="text-xs text-ink-soft">{doc.specialty}</p>
                  </div>
                  <button
                    onClick={() => toggleDoctor(doc)}
                    className="text-xs font-medium px-4 py-2 border"
                    style={{
                      color: doc.present ? "var(--color-risk-healthy)" : "var(--color-risk-critical)",
                      borderColor: doc.present ? "var(--color-risk-healthy)" : "var(--color-risk-critical)",
                    }}
                  >
                    {doc.present ? "Present" : "Absent"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Patient Footfall */}
        <section>
          <p className="text-[11px] tracking-[0.16em] uppercase text-ink-soft mb-4">
            Patient Footfall — Today
          </p>
          <div className="border border-hairline bg-paper-dim/40 p-5 grid grid-cols-5 gap-3">
            {(["children", "women", "elderly", "emergency", "general"] as const).map(
              (key) => (
                <div key={key}>
                  <label className="block text-[9px] uppercase text-ink-soft mb-1">
                    {key}
                  </label>
                  <input
                    type="number"
                    value={footfallDraft[key]}
                    onChange={(e) =>
                      setFootfallDraft({ ...footfallDraft, [key]: e.target.value })
                    }
                    className="w-full border border-hairline bg-paper px-2 py-1.5 text-sm tabular"
                  />
                </div>
              )
            )}
          </div>
          <button
            onClick={saveFootfall}
            className="mt-3 bg-accent-clay text-paper text-xs font-medium px-4 py-2"
          >
            Save Today&apos;s Footfall
          </button>
        </section>
      </div>

      <Toast message={toast} />
    </main>
  );
}

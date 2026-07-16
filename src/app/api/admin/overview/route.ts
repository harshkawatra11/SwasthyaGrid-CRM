import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/firebaseAdmin";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [facilitiesSnap, medsSnap, bedsSnap] = await Promise.all([
    db().collection("facilities").get(),
    db().collection("medicine_stock").get(),
    db().collection("beds").get(),
  ]);

  const medsByFacility = new Map<string, Array<Record<string, unknown>>>();
  medsSnap.docs.forEach((d) => {
    const data = d.data();
    const list = medsByFacility.get(data.facility_id) ?? [];
    list.push(data);
    medsByFacility.set(data.facility_id, list);
  });

  const bedsByFacility = new Map<string, Record<string, unknown>>();
  bedsSnap.docs.forEach((d) => bedsByFacility.set(d.id, d.data()));

  const roster = facilitiesSnap.docs.map((d) => {
    const facility = d.data();
    const meds = medsByFacility.get(d.id) ?? [];
    const beds = bedsByFacility.get(d.id);
    const lastUpdated = meds
      .map((m) => (m.updated_at as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0)
      .concat(
        (beds?.updated_at as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0
      )
      .reduce((max, t) => Math.max(max, t), 0);

    const criticalMeds = meds.filter((m) => {
      const days = (m.units_remaining as number) / (m.avg_daily_consumption as number || 1);
      return days < 3;
    }).length;

    return {
      id: d.id,
      name: facility.name,
      type: facility.type,
      criticalMedicines: criticalMeds,
      bedOccupancyPct: beds
        ? Math.round(((beds.occupied as number) / (facility.beds_total as number)) * 100)
        : null,
      lastUpdated: lastUpdated ? new Date(lastUpdated).toISOString() : null,
    };
  });

  return NextResponse.json({ roster });
}

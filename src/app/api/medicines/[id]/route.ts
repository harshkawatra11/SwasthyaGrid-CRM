import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "facility" || !session.facilityId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const ref = db().collection("medicine_stock").doc(id);
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.facility_id !== session.facilityId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    units_remaining?: number;
    avg_daily_consumption?: number;
  };

  const update: Record<string, unknown> = {
    updated_at: FieldValue.serverTimestamp(),
    updated_by: session.username,
  };
  if (body.units_remaining != null) update.units_remaining = body.units_remaining;
  if (body.avg_daily_consumption != null) update.avg_daily_consumption = body.avg_daily_consumption;

  await ref.update(update);
  return NextResponse.json({ ok: true });
}

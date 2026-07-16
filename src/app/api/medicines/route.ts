import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

/** Add a new medicine to the caller's own facility. facility_id is always
 * derived from the session, never trusted from the request body. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "facility" || !session.facilityId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    medicine_name?: string;
    units_remaining?: number;
    avg_daily_consumption?: number;
    reorder_threshold_days?: number;
  };

  if (!body.medicine_name || body.units_remaining == null || !body.avg_daily_consumption) {
    return NextResponse.json({ error: "medicine_name, units_remaining, avg_daily_consumption are required." }, { status: 400 });
  }

  const ref = await db().collection("medicine_stock").add({
    facility_id: session.facilityId,
    medicine_name: body.medicine_name,
    units_remaining: body.units_remaining,
    avg_daily_consumption: body.avg_daily_consumption,
    reorder_threshold_days: body.reorder_threshold_days ?? 5,
    updated_at: FieldValue.serverTimestamp(),
    updated_by: session.username,
  });

  return NextResponse.json({ id: ref.id }, { status: 201 });
}

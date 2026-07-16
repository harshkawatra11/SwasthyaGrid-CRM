import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "facility" || !session.facilityId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { occupied } = (await request.json()) as { occupied?: number };
  if (occupied == null) {
    return NextResponse.json({ error: "occupied is required." }, { status: 400 });
  }

  await db()
    .collection("beds")
    .doc(session.facilityId)
    .set(
      { occupied, updated_at: FieldValue.serverTimestamp(), updated_by: session.username },
      { merge: true }
    );

  return NextResponse.json({ ok: true });
}

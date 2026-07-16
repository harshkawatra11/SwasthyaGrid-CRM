import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "facility" || !session.facilityId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    children?: number;
    women?: number;
    elderly?: number;
    emergency?: number;
    general?: number;
  };

  const total =
    (body.children ?? 0) +
    (body.women ?? 0) +
    (body.elderly ?? 0) +
    (body.emergency ?? 0) +
    (body.general ?? 0);

  await db()
    .collection("footfall_today")
    .doc(session.facilityId)
    .set(
      {
        ...body,
        total,
        date: new Date().toISOString().slice(0, 10),
        updated_at: FieldValue.serverTimestamp(),
        updated_by: session.username,
      },
      { merge: true }
    );

  return NextResponse.json({ ok: true, total });
}

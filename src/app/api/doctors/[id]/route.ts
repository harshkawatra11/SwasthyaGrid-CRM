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

  const ref = db().collection("doctors").doc(id);
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.facility_id !== session.facilityId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { present, absence_reason } = (await request.json()) as {
    present?: boolean;
    absence_reason?: string | null;
  };

  await ref.update({
    present: !!present,
    absence_reason: present ? null : (absence_reason ?? "unspecified"),
    updated_at: FieldValue.serverTimestamp(),
    updated_by: session.username,
  });

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/firebaseAdmin";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "facility" || !session.facilityId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const facilityId = session.facilityId;

  const [facilitySnap, medsSnap, bedsSnap, doctorsSnap, footfallSnap] =
    await Promise.all([
      db().collection("facilities").doc(facilityId).get(),
      db().collection("medicine_stock").where("facility_id", "==", facilityId).get(),
      db().collection("beds").doc(facilityId).get(),
      db().collection("doctors").where("facility_id", "==", facilityId).get(),
      db().collection("footfall_today").doc(facilityId).get(),
    ]);

  return NextResponse.json({
    facility: facilitySnap.exists ? { id: facilitySnap.id, ...facilitySnap.data() } : null,
    medicines: medsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    beds: bedsSnap.exists ? { id: bedsSnap.id, ...bedsSnap.data() } : null,
    doctors: doctorsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    footfall: footfallSnap.exists ? footfallSnap.data() : null,
  });
}

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/firebaseAdmin";
import { createSessionToken, SESSION_COOKIE } from "@/lib/session";

export async function POST(request: Request) {
  const { username, password } = (await request.json()) as {
    username?: string;
    password?: string;
  };

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password are required." },
      { status: 400 }
    );
  }

  const snap = await db().collection("crm_users").doc(username.trim().toLowerCase()).get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const user = snap.data() as {
    password_hash: string;
    role: "facility" | "admin";
    facility_id: string | null;
    display_name: string;
  };

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const token = await createSessionToken({
    username: username.trim().toLowerCase(),
    role: user.role,
    facilityId: user.facility_id,
    displayName: user.display_name,
  });

  const res = NextResponse.json({
    role: user.role,
    facilityId: user.facility_id,
    displayName: user.display_name,
  });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}

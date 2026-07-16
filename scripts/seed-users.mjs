// Seeds demo login accounts into the `crm_users` Firestore collection.
// Run locally only: node scripts/seed-users.mjs
// Requires .env.local to have FIREBASE_SERVICE_ACCOUNT set.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import bcrypt from "bcryptjs";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  const path = join(__dirname, "..", ".env.local");
  const content = readFileSync(path, "utf-8");
  for (const line of content.split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2];
  }
}
loadEnvLocal();

const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
const json = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf-8");
const serviceAccount = JSON.parse(json);

initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id });
const db = getFirestore();

const DEMO_PASSWORD = "Swasthya@2026";

const users = [
  { username: "phc-rural-14", role: "facility", facility_id: "phc_18", display_name: "PHC Rural-14 Staff" },
  { username: "phc-sector-12", role: "facility", facility_id: "phc_12", display_name: "PHC Sector-12 Staff" },
  { username: "chc-east", role: "facility", facility_id: "chc_east", display_name: "CHC East Staff" },
  { username: "district-admin", role: "admin", facility_id: null, display_name: "District Administrator" },
];

async function main() {
  const password_hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  for (const u of users) {
    await db.collection("crm_users").doc(u.username).set({ ...u, password_hash });
    console.log(`Seeded user: ${u.username} (${u.role})`);
  }
  console.log("\nDemo password for all accounts:", DEMO_PASSWORD);
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Server-only Firestore access via the Admin SDK. The Admin SDK bypasses
 * Firestore Security Rules by design — this is intentional here: rules are
 * deployed as deny-all for client SDKs (see scripts/deploy-rules.mjs), and
 * every read/write to the district's data goes exclusively through this
 * server, scoped by the authenticated session (see lib/session.ts).
 */
function getAdminApp(): App {
  if (getApps().length) return getApps()[0];

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT is not set. See .env.example for how to provide the service account JSON (base64-encoded)."
    );
  }

  const json = raw.trim().startsWith("{")
    ? raw
    : Buffer.from(raw, "base64").toString("utf-8");
  const serviceAccount = JSON.parse(json);

  return initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

let _db: Firestore | null = null;

export function db(): Firestore {
  if (!_db) {
    _db = getFirestore(getAdminApp());
  }
  return _db;
}

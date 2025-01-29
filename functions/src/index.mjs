import { setGlobalOptions } from "firebase-functions/v2/options";
import admin from "firebase-admin";

setGlobalOptions({
  region: "asia-northeast1",
  memory: "512MB",
  timeoutSeconds: 60
});

if (!admin.apps || admin.apps.length === 0) {
  admin.initializeApp();
}

import { testFirestore } from "./functions/firestore.mjs";
import { analyzeImage } from "./functions/vision-ai-poc.mjs";

export { testFirestore, analyzeImage };
import { onRequest } from "firebase-functions/v2/https";
import admin from "firebase-admin";

function getFirestore() {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  return admin.firestore();
}

export const testFirestore = onRequest({ region: "asia-northeast1" },async (req, res) => {
  try {
    const firestore = getFirestore();
    const testRef = firestore.collection("test_collection").doc("test_doc");

    await testRef.set({
      message: "Firestore 書き込み成功！（v2）🚀",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("Firestore にデータを書き込みました");
    res.status(200).send("Firestore 書き込み成功！（v2）");
  } catch (error) {
    console.error("Firestore 書き込みエラー:", error);
    res.status(500).send("Firestore 書き込みに失敗しました");
  }
});